# GDD — Free Kicks Outside the Goal

> Bend the ball. Borrow the capital. Curve the market.

## One-Sentence Summary

A long-range speculation mini-game where users borrow `$GOALS` to take shots from free-kick positions outside the box; the farther out and riskier the angle, the higher the payout — with agents arbitraging oracle price gaps between prediction markets and on-chain resolution.

## World Cup 2026 Framing

Free kicks outside the box are moments of individual brilliance. From 25 yards, against a wall, with the world watching — it is pure speculation. For $GOALS, this is a **lending-driven risk engine** where users borrow to take bigger shots, and agents hunt for mispriced odds across oracles.

## Game Flow

### 1. The Position
Every free kick outside the box is assigned a **Risk Score** based on:
- **Distance** from goal (yards)
- **Angle** from center (degrees)
- **Wall height** (players in wall)
- **Pressure index** (group stage vs knockout)

| Risk Tier | Distance | Angle | Base Payout |
|-----------|----------|-------|-------------|
| Safe | <20 yards | Center (<15°) | 2.0x |
| Standard | 20-25 yards | Moderate (15-30°) | 3.5x |
| Bold | 25-30 yards | Wide (30-45°) | 6.0x |
| Hail Mary | >30 yards | Extreme (>45°) | 12.0x |

### 2. Borrow to Shoot
Users do not need to fully collateralize their bet. They can **borrow** from the `$GOALS` lending pool:
- **Collateral Factor**: 50% (user puts up half, borrows half)
- **Interest Rate**: Dynamic, based on pool utilization
- **Liquidation**: If the free kick misses and the user cannot repay, a portion of collateral is burned

Users choose a **shot type**:
- **Power Shot** (over the wall) — higher variance
- **Curve Ball** (around the wall) — lower variance, higher save chance
- **Chip** (over jumping wall) — highest payout, lowest success rate

### 3. The Oracle Resolution
The free kick outcome is resolved by a **multi-oracle consensus**:
- Official FIFA match feed
- Chainlink Sports Data
- Prediction market settlement (Polymarket / Overtime)

If oracles disagree, the **arbitrage agent** intervenes:
- Agent detects the price/oracle gap
- Agent can propose a **curve-ball arbitrage** trade on the prediction market
- Profits from arbitrage are split: 50% to agent owner, 40% to `$GOALS` treasury, 10% to buy-and-burn

### 4. The Payout
- **Goal**: `(Stake + Borrowed Amount) × Risk Tier Multiplier × Shot Type Bonus`
- **Save**: Borrowed amount + 20% of stake returned. Lender pool keeps interest.
- **Miss/Block**: Stake is partially burned (10%), partially redistributed to lenders (40%). Borrowed amount must be repaid or collateral is liquidated.

## DeFi Primitives Used

| Primitive | How it shows up |
|-----------|-----------------|
| **Lending / Borrowing** | Users borrow `$GOALS` to take shots |
| **Collateralization** | 50% collateral factor on all borrowed shots |
| **Liquidation** | Miss + insufficient collateral = partial burn |
| **Oracle Arbitrage** | Agents trade prediction markets when oracles diverge |
| **Buy-and-Burn** | 10% arbitrage profits buy and burn `$GOALS` |

## Agentic Layer

Agents specialize in two roles:

### Shot Agent
- Reads real-world player free-kick conversion rates
- Suggests optimal shot type and stake size
- Auto-borrows and executes when model edge >15%

### Arbitrage Agent
- Monitors oracle consensus in real time
- When oracles diverge by >2%:
  - Trades the cheaper prediction market side
  - Hedged against on-chain resolution
- Captures the spread as risk-free (or low-risk) profit

## Corner Case Rules

- If the free kick is retaken, borrowed positions are frozen (no interest accrues during the freeze).
- If the kick is indirect and a goal is scored on the second touch, payout is 0.5x the direct-goal multiplier.
- If the match is abandoned before resolution, all borrowed amounts are returned and collateral is unlocked.

## MVP Scope

- [ ] Risk tier calculation engine
- [ ] Lending pool with dynamic interest rates
- [ ] Shot type selection (Power / Curve / Chip)
- [ ] Multi-oracle consensus resolver
- [ ] Arbitrage agent prediction-market hooks
- [ ] Liquidation engine for missed shots
