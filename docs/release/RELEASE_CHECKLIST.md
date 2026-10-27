# Floor 13 release checklist

Updated 2026-10-27. **Public release is blocked** until the asset rights and
release-verification items below are resolved. Do not remove credits or
publish media with unknown redistribution permission to make this checklist
pass.

## Blocking items

- [ ] **Visual asset rights:** `docs/visual-asset-provenance.md` records
  supplied visual assets with unknown creators, licenses, and public
  redistribution permission. Obtain and document rights for the intended
  contest, repository, and game distribution, or replace affected media with
  cleared art. The software MIT license does not cover these files.
- [ ] **Dependency review:** the last recorded `npm audit` is dated 2026-10-09
  (`docs/dependency-audit-2026-10.md`). Re-run against the exact release
  lockfile and resolve or explicitly accept the applicable advisories before
  public release.
- [ ] **Hemi deployment record:** the configured Mainnet address has
  non-empty bytecode, but its verified source, deployment transaction,
  compiler/optimizer settings, and deployer record are not confirmed. The
  chain bytecode metadata indicates Solidity 0.8.34 while local
  `foundry.toml` pins 0.8.24; resolve this before claiming source verification.
- [ ] **Wallet lifecycle QA:** manually test rejected, pending, mined, and
  reverted TX1/TX2 states, including refresh/recovery and the explicit
  “inspect explorer” path. Do not submit a transaction without the player's
  approval.
- [ ] **Production browser QA:** a local production preview could not be
  opened from the available in-app browser on 2026-10-27. Verify the hosted
  page, console/network requests, responsive UI, floor transitions, and
  ending in a normal browser.
- [ ] **Play Online URL:** add a public URL only after the host is published
  and verified; until then the README marks it as unconfigured.

## Mainnet release configuration

The release build must explicitly set:

```env
VITE_HEMI_NETWORK=mainnet
VITE_HEMI_MAINNET_CONTRACT_ADDRESS=0x88b7Ac78c7964a2CbcFC8EC8e7bc9F8d39A3B059
```

Without `VITE_HEMI_NETWORK=mainnet`, the application defaults to Testnet. The
Testnet and Mainnet addresses are configured independently; never place a
private key or seed phrase in a Vite variable.

The on-chain contract stores player-submitted TX1/TX2 commitments. It does not
execute the game or independently prove a player's score. A non-empty
`eth_getCode` result confirms deployed bytecode exists at the configured
address; it does not prove bytecode/source equivalence or explorer verification.

## Validation recorded 2026-10-27

- [x] `npm test -- --reporter=dot --testTimeout=30000`: 59 files and 342 tests
  passed. An initial run using Vitest's 5-second default timed out on the
  128-seed encounter distribution test; the longer-timeout full rerun passed.
- [x] `npm run build`: passed. The main JavaScript bundle exceeds Vite's
  500 kB advisory threshold; dependency annotation and bundle-size warnings
  remain non-fatal.
- [x] Explicit Mainnet build with `VITE_HEMI_NETWORK=mainnet`: passed and
  included the configured Mainnet address. Deployment environments must set
  the same variable before rebuilding.
- [x] `git diff --check`: passed.
- [x] Asset-path and production manifest checks passed within the full test
  suite. This does not replace browser network-request verification.
- [x] Mainnet read-only `eth_getCode` returned non-empty bytecode at the
  configured RunRegistry address. No deployment or transaction was performed.
- [ ] Foundry compile/test was not part of this frontend release audit.
- [ ] No live wallet run, complete five-floor browser playthrough, or ending
  cinematic was manually verified.

## Final release actions

- [ ] Resolve the blocking items above and update their source documentation.
- [ ] Run `npm ci`, the full test suite, standard and explicit Mainnet builds,
  asset/link checks, and `git diff --check` on the exact release commit.
- [ ] Review the staged file list for secrets, source assets, and unintended
  outputs. `.env.local`, `dist/`, `node_modules/`, and `*.tsbuildinfo` are
  ignored by Git; keep the tracked `.env.example` free of secrets.
- [ ] Obtain a release-owner decision for any remaining security or rights
  risks. Commit and push only after the blockers are cleared.
