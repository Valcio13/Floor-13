import { useEffect, useRef } from 'react';

interface HowToPlayPanelProps {
  onClose: () => void;
}

/** A concise, spoiler-free orientation panel for first-time players. */
export function HowToPlayPanel({ onClose }: HowToPlayPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      onCloseRef.current();
    };
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keydown', trapTab, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keydown', trapTab, true);
      previousFocusRef.current?.focus();
    };
  }, []);

  return (
    <div className="how-to-play-backdrop" role="presentation"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={panelRef} className="how-to-play-panel" role="dialog" aria-modal="true" aria-labelledby="how-to-play-title">
        <header className="how-to-play-header">
          <div>
            <p className="how-to-play-eyebrow">FLOOR 13 // FIELD GUIDE</p>
            <h2 id="how-to-play-title">HOW TO PLAY</h2>
          </div>
          <button ref={closeButtonRef} type="button" className="how-to-play-close" onClick={onClose} aria-label="Close how to play">CLOSE ×</button>
        </header>
        <div className="how-to-play-body">
          <p className="how-to-play-intro">Explore. Investigate. Survive.</p>
          <section className="how-to-play-section">
            <h3>EXPLORATION</h3>
            <p>Search apartments and corridors for useful objects and evidence.</p>
          </section>
          <section className="how-to-play-section">
            <h3>INVESTIGATION</h3>
            <p>Collect clues, review your notebook, and solve puzzles.</p>
          </section>
          <section className="how-to-play-section">
            <h3>SURVIVAL</h3>
            <p>Avoid hostile creatures and manage your flashlight battery. Darkness can make navigation harder.</p>
          </section>
          <section className="how-to-play-section">
            <h3>PROGRESSION</h3>
            <p>Complete each floor&apos;s objectives to unlock the way forward.</p>
          </section>
          <section className="how-to-play-section how-to-play-controls-section">
            <h3>CONTROLS</h3>
            <dl className="how-to-play-controls">
              <dt>WASD / ARROWS</dt><dd>Move</dd>
              <dt>E</dt><dd>Interact</dd>
              <dt>F</dt><dd>Flashlight</dd>
              <dt>TAB</dt><dd>Notebook</dd>
              <dt>ESC</dt><dd>Pause</dd>
            </dl>
          </section>
        </div>
        <p className="how-to-play-hint">TAB / SHIFT+TAB NAVIGATE · ESC CLOSE</p>
      </section>
    </div>
  );
}
