# Historical Hemi integration report

This page preserves context from the original Hemi Testnet MVP. It is **not**
current setup, deployment, or transaction-flow guidance. The early implementation
used an `actionHash` / score-submission flow that has since been replaced.

The current application supports Hemi Testnet (`743111`) and Hemi Mainnet
(`43111`). It creates a run through TX1 (`startRun`) and offers an explicit
TX2 (`completeRun`) commitment after the run. The contract does not replay the
game or independently prove that a submitted score is legitimate.

For current network variables, contract configuration, transaction semantics,
and release checks, use:

- [README: Hemi Integration](../../README.md#hemi-integration)
- [Mainnet deployment and configuration](MAINNET_DEPLOYMENT.md)
- [Current architecture](../architecture/ARCHITECTURE.md#run-replay-and-completion)
- [Hemi deployment release checklist](../release/RELEASE_CHECKLIST.md)

Old command examples, test results, addresses, and claims in the original MVP
report are intentionally not repeated here because they no longer describe the
current application.
