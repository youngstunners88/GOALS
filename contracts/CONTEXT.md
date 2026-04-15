# Contracts Workspace

## What Happens Here

Solidity smart contracts for the $GOALS NFT protocol, deployed on Base (L2).

## Key Files

- `contracts/GoalsProtocolNFT.sol` — Main ERC-721 with dynamic metadata
- `scripts/deploy.js` — Deployment script
- `scripts/auto-deploy-bot.js` — Auto-deploy bot
- `test/GoalsProtocolNFT.test.js` — Contract tests

## Rules

- Update the contract ABI in `frontend/src/infrastructure/blockchain/` after any function signature change
- Estimate gas before adding loops or dynamic arrays
- Use OpenZeppelin imports; do not roll custom access control
- Keep royalty logic simple and verifiable

## Current Priorities

1. Optimize gas for batch minting
2. Add on-chain health check hooks for agent integration
3. Harden against reentrancy in any new payable functions
