# GDD — Penalty Shootout

> One shot. One bet. Live or liquidated.

## One-Sentence Summary

A high-stakes 1v1 mini-game where the shooter and keeper are backed by opposing staked capital; the outcome redistributes the pool, and sudden-death rounds apply liquidation-level leverage.

## World Cup 2026 Framing

Penalty shootouts decide knockout matches. There is no second half, no comeback — just 5 rounds of pure 1v1, then sudden death. For $GOALS, this is the **perfect DeFi metaphor**: two parties enter, one leaves with the pooled capital.

## Game Flow

### 1. The Stake (Pre-Shot)
- **Shooter Pool**: Users stake `$GOALS` on the shooter scoring.
- **Keeper Pool**: Users stake `$GOALS` on the keeper saving.
- Minimum stake: dynamic based on round (group stage vs knockout vs final).
- Pools close 30 seconds before the kick.

### 2. The Shot
- Shooter chooses **power** (slider: 0-100) and **aim zone** (9-grid).
- Keeper chooses **dive zone** (9-grid) and **commit timing** (early / balanced / late).
- RNG is weighted by:
  - Real-world player xG data
  - Keeper save %
  - Match pressure index (knockout multiplier)
- Outcome: **Goal** | **Save** | **Miss** (off target)

### 3. The Distribution
- If **Goal**: Shooter pool + 85% of keeper pool. Keeper pool keeps 15% (consolation).
- If **Save/Miss**: Keeper pool + 90% of shooter pool. Shooter pool keeps 10%.
- 2.5% platform fee → split between `$GOALS` buy-and-burn (1%) and treasury (1.5%).

### 4. Sudden Death Leverage (Round 6+)
- Stakes auto-compound into the next round.
- From Round 6, a **liquidation threshold** triggers:
  - If your pool loses 3 consecutive sudden-death rounds, your position is **liquidated** (50% burned, 50% redistributed to winners).
- Users can **add margin** before the liquidation threshold.

## DeFi Primitives Used

| Primitive | How it shows up |
|-----------|-----------------|
| **Staking** | Lock `$GOALS` into Shooter/Keeper pools |
| **Liquidity** | Pool depth determines max bet size and slippage |
| **Liquidation** | Sudden-death margin calls for 3 consecutive losses |
| **Buy-and-Burn** | 1% of every shootout fee is used to buy and burn `$GOALS` |
| **Leverage** | Compound staking in sudden death = 2x exposure per round |

## Agentic Layer

Agents monitor:
- Pool imbalance (arbitrage between lopsided pools)
- Real-world data (injury reports, fatigue metrics)
- On-chain momentum (which side is being aped)

Agent actions:
- **Auto-stake** when xG model shows >60% probability and pool odds are mispriced
- **Hedge** by splitting stake across both pools when variance is high
- **Auto-exit** before liquidation threshold by withdrawing margin

## Corner Case Rules

- If the shot is retaken (keeper encroachment), pools freeze and stakes roll over.
- If a player is subbed before the shootout, users have 60s to withdraw or re-stake on the replacement.
- In the event of a server-side timeout, all stakes are refunded (no fee).

## MVP Scope

- [ ] Pool creation & staking UI
- [ ] 9-zone shooter/keeper selection
- [ ] RNG resolution with real player weights
- [ ] Sudden-death compound logic
- [ ] Liquidation trigger + margin add
- [ ] Agent auto-stake/hide hooks
