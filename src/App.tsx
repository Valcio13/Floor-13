import { useState, useRef, useEffect, useCallback } from 'react';
import Phaser from 'phaser';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createGameConfig } from './game/config';
import { createRun } from './core/run';
import { localPlaytestRun } from './game/localPlaytest';
import { initRNG, initLocalRNG } from './core/rng';
import { useWallet, useStartRun } from './web3/hooks';
import { useCompleteRun } from './web3/hooks';
import { submitRunCompletion } from './web3/tx2Completion';
import type { Hash } from 'viem';
import { wagmiConfig } from './web3/wagmi';
import { hemiNetwork, type HemiNetworkName } from './web3/config';
import type { RunState } from './core/run';
import { RUN_RECOVERY_STORAGE_KEY, createRunCheckpoint, hashAuthoritativeState, parseRunCheckpoint, serializeRunCheckpoint, validateRunRecovery, type ValidatedRunRecovery } from './core/runRecovery';
import { InputRecorder, InputReplayer } from './core/inputRecorder';
import { finalStateV1FromSimulation, encodeFinalStateV1 } from './core/finalStateV1';
import { AuthoritativeSimulation, FIXED_SCALE } from './core/authoritativeSimulation';
import { keccak256, toHex } from 'viem';
import { tx2SubmissionBlockReason } from './web3/transactionRecovery';
import { onchainStartupCopy, resultHandoffReady, runMenuActions, startupErrorCopy, terminalSubmissionStatus } from './game/contestUx';
import { AudioSettingsPanel } from './components/AudioSettingsPanel';
import { HowToPlayPanel } from './components/HowToPlayPanel';
import { ConfirmedRunCountdownGate, countdownLabel, emptyRunPreparationStages, updateRunPreparationStage, type RunPreparationStageId, type RunPreparationStages, type RunPreparationStageStatus } from './game/runPreparation';
import { RunPreparationToasts } from './components/RunPreparationToasts';

const OPEN_AUDIO_SETTINGS_EVENT = 'block13:open-audio-settings';

const queryClient = new QueryClient();

type RunStatus = 'idle' | 'starting' | 'countdown' | 'playing' | 'complete';
type MenuStartPhase = 'idle' | 'entropy' | 'wallet' | 'submitted' | 'confirmed';

const TX1_PENDING_KEY = 'block13:tx1-pending:v1';
const TX2_PENDING_KEY = 'block13:tx2-pending:v1';
const TX2_DONE_PREFIX = 'block13:tx2-confirmed:';

function initialRunCheckpoint(runState: RunState) {
  const simulation = new AuthoritativeSimulation(BigInt(runState.canonicalSeed), {
    floor: runState.floor, hp: runState.hp, battery: Math.round(runState.battery * FIXED_SCALE),
    curse: Math.round(runState.curse * FIXED_SCALE), score: runState.score, floorsCompleted: runState.floorsCompleted,
  });
  const inputLog = new InputRecorder().encodeBinary();
  return createRunCheckpoint({
    runState: structuredClone(runState), inputLog, terminalTick: simulation.state.tick,
    stateHash: hashAuthoritativeState(simulation.state), inputHash: keccak256(toHex(inputLog)),
  });
}

function GameApp() {
  const [status, setStatus] = useState<RunStatus>('idle');
  const [startPhase, setStartPhase] = useState<MenuStartPhase>('idle');
  const [preparationStages, setPreparationStages] = useState<RunPreparationStages>(() => emptyRunPreparationStages());
  const [countdown, setCountdown] = useState<number | null>(null);
  const [runState, setRunState] = useState<RunState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completionData, setCompletionData] = useState<{ inputLogBytes?: Uint8Array; finalStateBytes?: Uint8Array } | null>(null);
  const [completionHash, setCompletionHash] = useState<Hash | null>(null);
  const [completionPhase, setCompletionPhase] = useState<'idle' | 'wallet' | 'submitted' | 'confirmed' | 'failed'>('idle');
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [audioSettingsOpen, setAudioSettingsOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const selectedNetwork: HemiNetworkName = hemiNetwork.name;
  const [recovery, setRecovery] = useState<ValidatedRunRecovery | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [transactionPending, setTransactionPending] = useState<string | null>(null);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const onchainAttemptRef = useRef(0);
  const startAbortRef = useRef<AbortController | null>(null);
  const runOriginRef = useRef<RunState | null>(null);
  const persistenceFailedRef = useRef(false);
  const activePreparationStageRef = useRef<RunPreparationStageId | null>(null);
  const startInProgressRef = useRef(false);
  const confirmedRunCountdownGateRef = useRef(new ConfirmedRunCountdownGate());

  const { address, chain, isConnected, isCorrectNetwork, connectWallet, switchToHemi, isConnecting, connectError, isSwitching, switchError } = useWallet(selectedNetwork);
  const { startRun, error: startError } = useStartRun(selectedNetwork);
  const { completeRun } = useCompleteRun(selectedNetwork);
  const closeAudioSettings = useCallback(() => setAudioSettingsOpen(false), []);
  const openAudioSettings = useCallback(() => {
    setHowToPlayOpen(false);
    setCreditsOpen(false);
    setAudioSettingsOpen(true);
  }, []);
  const openCredits = useCallback(() => {
    setHowToPlayOpen(false);
    setAudioSettingsOpen(false);
    setCreditsOpen(true);
  }, []);
  const openHowToPlay = useCallback(() => {
    setAudioSettingsOpen(false);
    setCreditsOpen(false);
    setHowToPlayOpen(true);
  }, []);
  const closeHowToPlay = useCallback(() => setHowToPlayOpen(false), []);
  const markPreparationStage = (stage: RunPreparationStageId, stageStatus: RunPreparationStageStatus) => {
    setPreparationStages(current => updateRunPreparationStage(current, stage, stageStatus));
    activePreparationStageRef.current = stageStatus === 'active' ? stage : activePreparationStageRef.current === stage ? null : activePreparationStageRef.current;
  };

  useEffect(() => {
    if (status !== 'countdown' || countdown === null) return;
    const timer = window.setTimeout(() => {
      if (countdown > 1) setCountdown(countdown - 1);
      else {
        setCountdown(null);
        if (activePreparationStageRef.current === 'game') markPreparationStage('game', 'completed');
        setStatus('playing');
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [status, countdown]);

  useEffect(() => {
    const open = () => openAudioSettings();
    window.addEventListener(OPEN_AUDIO_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_AUDIO_SETTINGS_EVENT, open);
  }, [openAudioSettings]);

  const resetCompletionState = () => {
    setCompletionData(null);
    setCompletionHash(null);
    setCompletionPhase('idle');
    setCompletionError(null);
  };

  // Validate and replay the last canonical checkpoint before entering gameplay.
  useEffect(() => {
    const tx2 = localStorage.getItem(TX2_PENDING_KEY);
    const tx1 = localStorage.getItem(TX1_PENDING_KEY);
    if (tx2) setTransactionPending(`TX2 status is unresolved (${tx2}). Do not submit completion again until its transaction status is checked.`);
    else if (tx1) setTransactionPending(`TX1 status is unresolved (${tx1}). Do not start another Hemi run until its transaction status is checked.`);
    const savedRun = localStorage.getItem(RUN_RECOVERY_STORAGE_KEY);
    if (!savedRun && sessionStorage.getItem('activeRun')) {
      setRecoveryError('The prior saved-run format contains no replay inputs and cannot reconstruct progress. It was kept intact.');
    }
    if (savedRun && status === 'idle') {
      try {
        const recovered = validateRunRecovery(parseRunCheckpoint(savedRun));
        runOriginRef.current = structuredClone(recovered.runState);
        setRecovery(recovered);
        const state = recovered.state;
        const restoredRun: RunState = {
          ...recovered.runState, floor: state.floor, floorsCompleted: state.floorsCompleted,
          hp: state.hp, battery: state.battery / FIXED_SCALE, curse: state.curse / FIXED_SCALE,
          score: state.score, status: state.status,
        };
        setRunState(restoredRun);
        if (state.status === 'playing') {
          if (restoredRun.manifest) initRNG(restoredRun.manifest); else initLocalRNG();
          setStatus('playing');
        } else {
          const logBytes = recovered.inputLog;
          const sim = new AuthoritativeSimulation(BigInt(restoredRun.canonicalSeed), {
            floor: recovered.runState.floor, hp: recovered.runState.hp,
            battery: Math.round(recovered.runState.battery * FIXED_SCALE),
            curse: Math.round(recovered.runState.curse * FIXED_SCALE),
            score: recovered.runState.score, floorsCompleted: recovered.runState.floorsCompleted,
          });
          const replay = InputReplayer.fromBinary(logBytes);
          for (let tick = 0; tick < recovered.terminalTick; tick++) sim.step(replay.getStateAtTick(tick));
          setCompletionData({ inputLogBytes: logBytes, finalStateBytes: recovered.runState.manifest
            ? encodeFinalStateV1(finalStateV1FromSimulation(recovered.runState.manifest, sim)) : undefined });
          if (recovered.runState.manifest) {
            const done = localStorage.getItem(`${TX2_DONE_PREFIX}${recovered.runState.manifest.runId}`);
            if (done) {
              setCompletionPhase('confirmed');
              try { setCompletionHash(JSON.parse(done).hash as Hash); } catch { /* retained confirmed status is sufficient */ }
            }
          }
          setStatus('complete');
        }
      } catch (err) {
        console.error('Saved run recovery failed:', err);
        setRecoveryError(err instanceof Error ? err.message : 'Saved run could not be recovered safely.');
      }
    }
  }, []);

  // Warn user before closing/refreshing during active game
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === 'playing' && runState) {
        e.preventDefault();
        e.returnValue = 'Your game is in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [status, runState]);

  const beginRun = async () => {
    if (startInProgressRef.current) return;
    if (localStorage.getItem(TX1_PENDING_KEY) || localStorage.getItem(TX2_PENDING_KEY)) {
      setTransactionPending('A previous Hemi transaction is unresolved. Check it before starting or completing another onchain run.');
      return;
    }
    if (!isConnected) {
      connectWallet();
      return;
    }

    if (!isCorrectNetwork) {
      setError(null);
      switchToHemi();
      return;
    }

    resetCompletionState();
    startInProgressRef.current = true;
    confirmedRunCountdownGateRef.current.reset();
    setPreparationStages(emptyRunPreparationStages());
    activePreparationStageRef.current = null;
    setStatus('starting');
    setStartPhase('entropy');
    setError(null);

    const attempt = ++onchainAttemptRef.current;
    const abortController = new AbortController();
    startAbortRef.current = abortController;
    let tx1Submitted = false;
    try {
      console.log('[App] Starting blockchain run...');
      const result = await startRun(0, phase => {
        if (attempt !== onchainAttemptRef.current) return;
        setStartPhase(phase);
        if (phase === 'wallet') markPreparationStage('wallet', 'active');
        if (phase === 'submitted') {
          markPreparationStage('wallet', 'completed');
          markPreparationStage('confirmation', 'active');
          tx1Submitted = true;
          localStorage.setItem(TX1_PENDING_KEY, 'submitted; receipt/run id not yet persisted');
        }
        if (phase === 'confirmed') {
          markPreparationStage('confirmation', 'completed');
          markPreparationStage('seed-manifest', 'active');
        }
      }, abortController.signal, (stage, stageStatus) => {
        if (attempt === onchainAttemptRef.current) markPreparationStage(stage, stageStatus);
      });
      if (attempt !== onchainAttemptRef.current) return;
      console.log('[App] Run started:', result);
      
      // Initialize RNG and derive the local seed only after TX1 returns its
      // confirmed run id. The on-chain identity and entropy are unchanged.
      initRNG(result.manifest);
      
      // Create run state with manifest
      const newRun = createRun(result.manifest);
      localStorage.setItem(TX1_PENDING_KEY, `TX1 confirmed ${result.hash}, run ${result.manifest.runId}; saving initial recovery checkpoint`);
      localStorage.setItem(RUN_RECOVERY_STORAGE_KEY, serializeRunCheckpoint(initialRunCheckpoint(newRun)));
      if (!confirmedRunCountdownGateRef.current.begin(true, true)) throw new Error('The confirmed run could not be prepared for game start. Its recovery record was retained.');
      localStorage.removeItem(TX1_PENDING_KEY);
      runOriginRef.current = structuredClone(newRun);
      setRecovery(null);
      setRunState(newRun);
      persistenceFailedRef.current = false;
      markPreparationStage('seed-manifest', 'completed');
      markPreparationStage('game', 'active');
      setStartPhase('confirmed');
      setCountdown(3);
      setStatus('countdown');
      startInProgressRef.current = false;
    } catch (err: any) {
      console.error('[App] Failed to start run:', err);
      if (attempt === onchainAttemptRef.current) {
        startInProgressRef.current = false;
        if (activePreparationStageRef.current) markPreparationStage(activePreparationStageRef.current, 'failed');
        if (!tx1Submitted) localStorage.removeItem(TX1_PENDING_KEY);
        else setTransactionPending('TX1 was submitted but its confirmation/run id is unresolved. Do not start another Hemi run yet.');
        setError(startupErrorCopy(err));
        setStatus('idle');
        setStartPhase('idle');
      }
    }
  };

  const beginLocalRun = () => {
    if (status === 'starting' && (startPhase === 'wallet' || startPhase === 'submitted')) {
      setError('A Hemi wallet request or transaction is already active. Reject or wait for it, then start Local safely.');
      return;
    }
    startAbortRef.current?.abort();
    startAbortRef.current = null;
    startInProgressRef.current = false;
    confirmedRunCountdownGateRef.current.reset();
    onchainAttemptRef.current++;
    resetCompletionState();
    setCountdown(3);
    setStatus('countdown');
    setError(null);
    setStartPhase('idle');
    
    console.log('[App] Starting local run...');
    
    // Initialize local RNG (no blockchain manifest)
    initLocalRNG();
    
    // Create local-only run (no manifest)
    const createdLocalRun = createRun(undefined);
    const localRun = import.meta.env.DEV
      ? localPlaytestRun(createdLocalRun, window.location.search)
      : createdLocalRun;
    runOriginRef.current = structuredClone(localRun);
    setRecovery(null);
    setRecoveryError(null);
    setTransactionPending(null);
    try {
      localStorage.setItem(RUN_RECOVERY_STORAGE_KEY, serializeRunCheckpoint(initialRunCheckpoint(localRun)));
      setPersistenceError(null);
    } catch (saveError) {
      setPersistenceError(saveError instanceof Error ? saveError.message : 'Browser storage could not save an initial checkpoint.');
    }
    sessionStorage.removeItem('activeRun');
    setRunState(localRun);
    
    persistenceFailedRef.current = false;
  };

  const cancelRunPreparation = () => {
    startAbortRef.current?.abort();
    startAbortRef.current = null;
    onchainAttemptRef.current++;
    startInProgressRef.current = false;
    activePreparationStageRef.current = null;
    setPreparationStages(emptyRunPreparationStages());
    setStartPhase('idle');
    setStatus('idle');
    setError(null);
  };

  const handleGameComplete = (finalState: RunState, registry: Phaser.Data.DataManager) => {
    setCompletionHash(null);
    setCompletionPhase('idle');
    setCompletionError(null);
    setRunState(finalState);
    setCompletionData({
      inputLogBytes: registry.get('inputLogV2Bytes') as Uint8Array | undefined,
      finalStateBytes: registry.get('finalStateV1Bytes') as Uint8Array | undefined,
    });
    setStatus('complete');
  };

  const submitCompletion = async () => {
    if (!runState?.manifest || localStorage.getItem(TX2_PENDING_KEY) || localStorage.getItem(TX1_PENDING_KEY)) return;
    const blockReason = tx2SubmissionBlockReason(runState.manifest, {
      connected: isConnected, address, chainId: chain?.id,
    }, false, selectedNetwork);
    if (blockReason) {
      setCompletionError(blockReason);
      return;
    }
    setCompletionPhase('wallet');
    setCompletionError(null);
    setCompletionHash(null);
    let submittedHash: Hash | null = null;
    localStorage.setItem(TX2_PENDING_KEY, 'wallet request active; submission status not yet known');
    try {
      const submission = await submitRunCompletion({
        manifest: runState.manifest,
        inputLogBytes: completionData?.inputLogBytes,
        finalStateBytes: completionData?.finalStateBytes,
        submit: (args) => completeRun(args, hash => {
          submittedHash = hash;
          localStorage.setItem(TX2_PENDING_KEY, `submitted ${hash}`);
          setCompletionHash(hash);
          setCompletionPhase('submitted');
        }),
        confirm: async () => undefined,
      });
      localStorage.removeItem(TX2_PENDING_KEY);
      const confirmedHash = submission.local ? null : submission.submission as Hash;
      if (confirmedHash) setCompletionHash(confirmedHash);
      localStorage.setItem(`${TX2_DONE_PREFIX}${runState.manifest.runId}`, JSON.stringify({ hash: confirmedHash }));
      setCompletionPhase('confirmed');
    } catch (err: any) {
      if (!submittedHash) localStorage.removeItem(TX2_PENDING_KEY);
      else localStorage.setItem(TX2_PENDING_KEY, `submitted ${submittedHash}; confirmation unresolved`);
      setCompletionPhase('failed');
      setCompletionError(err.message || 'TX2 submission failed. You can retry.');
    }
  };

  useEffect(() => {
    if (status === 'playing' && gameContainerRef.current && !gameRef.current && runState) {
      const persistRunRecovery = (inputLog: Uint8Array, state: import('./core/authoritativeSimulation').AuthoritativeState) => {
        const origin = runOriginRef.current;
        if (!origin) return;
        try {
          const checkpoint = createRunCheckpoint({
            runState: origin, inputLog, terminalTick: state.tick,
            stateHash: hashAuthoritativeState(state), inputHash: keccak256(toHex(inputLog)),
          });
          localStorage.setItem(RUN_RECOVERY_STORAGE_KEY, serializeRunCheckpoint(checkpoint));
          setPersistenceError(null);
          persistenceFailedRef.current = false;
        } catch (saveError) {
          if (!persistenceFailedRef.current) {
            persistenceFailedRef.current = true;
            setPersistenceError(saveError instanceof Error ? saveError.message : 'Browser storage could not save a recovery checkpoint.');
          }
        }
      };
      const config = createGameConfig('game-container', recovery?.runState ?? runState, recovery ? {
        recoveryLog: recovery.inputLog,
        recoveryStateHash: recovery.stateHash,
        persistRunRecovery,
      } : { persistRunRecovery });
      gameRef.current = new Phaser.Game(config);

      // Listen for game completion
      if (gameRef.current.registry) {
        const checkCompletion = setInterval(() => {
          const currentState = gameRef.current?.registry.get('runState') as RunState;
          const epilogueComplete = gameRef.current?.registry.get('victoryEpilogueComplete') === true;
          if (currentState && (currentState.status === 'won' || currentState.status === 'lost')
            && resultHandoffReady(currentState.status, epilogueComplete)) {
            clearInterval(checkCompletion);
            handleGameComplete(currentState, gameRef.current!.registry);
          }
        }, 1000);

        return () => clearInterval(checkCompletion);
      }
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [status, runState]);

  if (status === 'playing') {
    return (
      <main className="app-shell game-active">
        <div id="game-container" ref={gameContainerRef} />
        {audioSettingsOpen && <AudioSettingsPanel onClose={closeAudioSettings} />}
        {error && (
          <div className="error-overlay">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
        {persistenceError && <div role="alert" className="error-overlay"><p>Refresh recovery may be unavailable: {persistenceError}</p></div>}
      </main>
    );
  }

  if (status === 'countdown') {
    return <main className="app-shell run-countdown" aria-live="assertive">
      <section className="title-card"><p className="eyebrow">RUN READY</p><h1>{countdownLabel(countdown ?? 3)}</h1><p className="subtitle">ENTERING FLOOR 4</p>
        {runState?.manifest && <details className="run-technical-data"><summary>Technical run data</summary><dl>
          <dt>Run ID</dt><dd>{runState.manifest.runId.toString()}</dd>
          <dt>Game version</dt><dd>{runState.manifest.gameVersion}</dd>
          <dt>Rules hash</dt><dd>{runState.manifest.rulesHash}</dd>
          <dt>Bitcoin block</dt><dd>{runState.manifest.btcBlockHash}</dd>
          <dt>Ethereum block</dt><dd>{runState.manifest.ethBlockHash}</dd>
          <dt>Hemi block</dt><dd>{runState.manifest.hemiBlockHash}</dd>
          <dt>Hemi transaction</dt><dd>{runState.manifest.hemiTxHash}</dd>
        </dl></details>}
      </section>
    </main>;
  }

  if (status === 'complete') {
    const isBlockchainRun = runState?.manifest !== undefined;
    const completionStatus = terminalSubmissionStatus(completionPhase);
    
    return (
      <main className="app-shell result-shell">
        <section className={`title-card result-card ${runState?.status === 'won' ? 'is-won' : 'is-run-over'}`}>
          <p className="eyebrow">RUN REPORT // HEMI ARCADE</p>
          <h1>{runState?.status === 'won' ? 'RUN COMPLETE!' : 'RUN OVER'}</h1>
          {runState?.status === 'won' && <p className="premise">You escaped the building. The record remains.</p>}
          <p className="result-status">{isBlockchainRun
            ? runState?.status === 'won' ? 'Hemi run complete.' : 'This Hemi run ended before the escape.'
            : 'LOCAL RUN — NO ONCHAIN SUBMISSION REQUIRED'}</p>
          {runState && (
            <div className="result-stats">
              <div><span>FINAL SCORE</span><strong>{runState.score}</strong></div>
              <div><span>FLOORS COMPLETED</span><strong>{runState.floorsCompleted}</strong></div>
            </div>
          )}
          {isBlockchainRun && runState?.manifest && (
            <div className="result-chain-card">
              <div className="result-chain-heading">
                <p className="result-chain-title">HEMI RUN RECORD</p>
                <p className="result-run-id">RUN ID <strong>{runState.manifest.runId.toString()}</strong></p>
              </div>
              <p className="result-chain-description">{completionPhase === 'confirmed'
                ? 'This result and replay commitment are recorded on Hemi.'
                : completionPhase === 'submitted'
                  ? 'Your result submission is awaiting confirmation on Hemi.'
                  : 'Submit this result and replay commitment to Hemi.'}</p>
              {completionPhase === 'confirmed' ? (
                <>
                  <p className="result-chain-state is-confirmed">CONFIRMED</p>
                  <p className="result-transaction">TRANSACTION <span>{completionHash ? `${completionHash.slice(0, 10)}…${completionHash.slice(-8)}` : 'Confirmed'}</span></p>
                </>
              ) : (
                <>
                  <p className={`result-chain-state ${completionPhase === 'failed' ? 'is-failed' : ''}`}>{completionStatus.label}{completionPhase === 'submitted' && completionHash ? ` ${completionHash.slice(0, 10)}…${completionHash.slice(-8)}` : ''}</p>
                  {completionError && <p role="alert" className="result-chain-error">{completionError}</p>}
                  <button onClick={submitCompletion} disabled={completionStatus.disabled || !!transactionPending || !!localStorage.getItem(TX2_PENDING_KEY)}>{completionStatus.button}</button>
                </>
              )}
            </div>
          )}
          {transactionPending && <div role="alert" className="menu-error">
            <p>{transactionPending}</p>
            <button type="button" onClick={() => {
              localStorage.removeItem(TX1_PENDING_KEY);
              localStorage.removeItem(TX2_PENDING_KEY);
              setTransactionPending(null);
            }}>I checked the explorer; clear unresolved transaction marker</button>
          </div>}
          <button className="primary-action" onClick={() => { localStorage.removeItem(RUN_RECOVERY_STORAGE_KEY); sessionStorage.removeItem('activeRun'); window.location.reload(); }}>{isBlockchainRun ? 'NEW HEMI RUN' : 'PLAY AGAIN LOCALLY'}</button>
          <p className="result-secondary-action">{isBlockchainRun ? 'Return to the menu to begin another Hemi run.' : 'Start another local practice run without a wallet.'}</p>
        </section>
      </main>
    );
  }

  const menuActions = runMenuActions(
    isConnected,
    isCorrectNetwork,
    status === 'starting' || isConnecting || isSwitching,
    false,
  );
  const hemiLabel = status === 'starting' && startPhase !== 'idle'
    ? onchainStartupCopy(startPhase as Exclude<MenuStartPhase, 'idle'>)
    : menuActions.hemi === 'busy' ? isConnecting ? 'CONNECTING WALLET…' : isSwitching ? 'SWITCHING TO HEMI…' : 'STARTING HEMI RUN…'
        : menuActions.hemi === 'connect' ? 'CONNECT WALLET FOR HEMI'
        : menuActions.hemi === 'switch-network' ? 'SWITCH TO HEMI NETWORK' : 'PLAY ON HEMI';

  return (
    <main className="app-shell menu-shell">
      <section className="title-card" aria-labelledby="game-title">
        <p className="eyebrow">HEMI ARCADE // SURVIVAL HORROR</p>
        <h1 id="game-title">FLOOR 13</h1>
        <p className="subtitle">THE BUILDING THAT NEVER EXISTED</p>
        <p className="premise">An unknown number sent you a single message: “Go to the fourth floor.”</p>

        <RunPreparationToasts stages={preparationStages} visible={status === 'starting' || Object.values(preparationStages).includes('failed')} />
        {status === 'starting' && startPhase === 'entropy' && <button type="button" className="cancel-run-preparation" onClick={cancelRunPreparation}>CANCEL PREPARATION</button>}

        <div className="run-choices" aria-label="Choose how to play">
          <section className="run-choice run-choice-primary">
            <button type="button" aria-live="polite" onClick={beginRun} disabled={menuActions.hemi === 'busy' || !!transactionPending}>{hemiLabel}</button>
            <p>Record a verifiable run on Hemi and commit the result after you escape.</p>
            {isConnected && <p className={`network-state ${isCorrectNetwork ? 'is-ready' : 'is-warning'}`}>{isCorrectNetwork ? '● HEMI READY' : '● SWITCH TO THE CONFIGURED HEMI NETWORK TO CONTINUE'}</p>}
          </section>
          <section className="run-choice run-choice-secondary">
            <button type="button" className="local-run-button" onClick={beginLocalRun} disabled={!menuActions.localEnabled}>PLAY LOCAL</button>
            <p>Play immediately with no wallet or transaction requirements.</p>
          </section>
        </div>

        <nav className="menu-secondary-actions" aria-label="Menu information and settings">
          <button type="button" className="menu-how-to-play-button" onClick={openHowToPlay}>HOW TO PLAY</button>
          <button type="button" className="menu-settings-button" onClick={openAudioSettings}>AUDIO</button>
          <button type="button" className="menu-credits-button" onClick={openCredits}>CREDITS</button>
        </nav>

        <div className="menu-notices" aria-live="polite">
          {recoveryError && <div role="alert" className="menu-error">
            <p>Saved run recovery needs attention: {recoveryError}</p>
            <button type="button" onClick={() => { localStorage.removeItem(RUN_RECOVERY_STORAGE_KEY); sessionStorage.removeItem('activeRun'); setRecoveryError(null); }}>Discard saved run</button>
          </div>}
          {transactionPending && <div role="alert" className="menu-error">
            <p>{transactionPending}</p>
            <button type="button" onClick={() => {
              localStorage.removeItem(TX1_PENDING_KEY);
              localStorage.removeItem(TX2_PENDING_KEY);
              setTransactionPending(null);
            }}>Clear unresolved transaction marker</button>
          </div>}
          {persistenceError && <p role="alert" className="menu-error">Saved run checkpoint failed: {persistenceError}</p>}
          {isConnected && <p className="run-rule connected-wallet">Connected: {address?.slice(0, 6)}…{address?.slice(-4)}</p>}
          {(error || startError || connectError || switchError) && (
            <p className="menu-error" role="alert">{error || (startError ? startupErrorCopy(startError) : null) || (connectError ? startupErrorCopy(connectError) : null) || (switchError ? startupErrorCopy(switchError) : null)}</p>
          )}
          {isConnected && !isCorrectNetwork && <p className="network-note">Play Local is ready now. Hemi runs use the configured Hemi network.</p>}
        </div>
        {status === 'starting' && startPhase !== 'idle' && <span className="sr-only" role="status">{onchainStartupCopy(startPhase as Exclude<MenuStartPhase, 'idle'>)}</span>}
      </section>
      {audioSettingsOpen && <AudioSettingsPanel onClose={closeAudioSettings} />}
      {howToPlayOpen && <HowToPlayPanel onClose={closeHowToPlay} />}
      {creditsOpen && (
        <div className="credits-backdrop" role="presentation" onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); setCreditsOpen(false); } }} onMouseDown={event => { if (event.target === event.currentTarget) setCreditsOpen(false); }}>
          <section className="credits-panel" role="dialog" aria-modal="true" aria-labelledby="credits-title">
            <header className="credits-header">
              <div>
                <p className="credits-eyebrow">FLOOR 13 // PRODUCTION NOTES</p>
                <h2 id="credits-title">CREDITS &amp; ATTRIBUTION</h2>
              </div>
              <button autoFocus type="button" className="credits-close" onClick={() => setCreditsOpen(false)} aria-label="Close credits">CLOSE</button>
            </header>
            <div className="credits-body">
              <h3>FLOOR 13</h3>
              <p>An independent psychological survival-horror game about forgotten records, impossible architecture, and the building that never existed.</p>
              <h3>Audio</h3>
              <p>Processed music and sound effects are credited in the project license record. Third-party audio is used under the applicable Pixabay Content License or CC0 source license.</p>
              <ul>
                <li><a href="https://pixabay.com/music/scary-childrens-tunes-scary-halloween-617002/" target="_blank" rel="noreferrer">Scary Halloween — Dmitrii Spis (NastelBom)</a></li>
                <li><a href="https://opengameart.org/content/dark-sci-fi-audio-pack" target="_blank" rel="noreferrer">Dark Sci-Fi Audio Pack — SRG774 (CC0)</a></li>
                <li><a href="https://opengameart.org/content/lost-in-a-bad-place-horror-ambience-loop" target="_blank" rel="noreferrer">Lost in a Bad Place — congusbongus (CC0)</a></li>
              </ul>
              <h3>Technology</h3>
              <p>Built with Phaser, React, TypeScript, Vite, and viem. Hemi run verification uses the RunRegistry contract and wallet connection supplied by the Hemi network.</p>
              <p className="credits-note">Full source pages, creators, processing notes, and license details are retained in <strong>docs/credits/AUDIO_LICENSES.md</strong> and <strong>docs/audio/THIRD_PARTY_AUDIO.md</strong>.</p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <GameApp />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
