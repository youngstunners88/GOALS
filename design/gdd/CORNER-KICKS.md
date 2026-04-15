# GDD — Corner Kicks

> Pack the box. Supply the liquidity. Head the yield.

## One-Sentence Summary

A zone-based liquidity mini-game where users supply `$GOALS` to specific areas of the penalty box; if a goal is scored from a corner via that zone, the zone's LPs earn a burst yield proportional to their share and the goal's rarity.

## World Cup 2026 Framing

Corner kicks are set-piece theater. 22 players crowd the box. The ball is whipped in. One touch decides everything. For $GOALS, the box becomes an **AMM liquidity surface** — users supply capital to zones, and goals pay yield bursts.

## Game Flow

### 1. The Box Zones (Pre-Kick)
The penalty box is divided into **6 zones**:

| Zone | Description | Base Yield Multiplier |
|------|-------------|----------------------|
| A | Near post (low, crowded) | 1.2x |
| B | Front center (headers, chaos) | 1.5x |
| C | Far post (back-post tap-ins) | 1.8x |
| D | Top of box edge (volleys, clearances) | 2.2x |
| E | Penalty spot (classic header zone) | 1.6x |
| F | Deep far corner (scrambles, rebounds) | 2.5x |

Users supply `$GOALS` to any zone before the corner is taken. The more liquidity in a zone, the lower the individual yield (AMM-style share dilution).

### 2. The Cross
- The corner taker is identified.
- Users can **boost** a zone by burning a small amount of `$GOALS` to increase that zone's yield multiplier for 30 seconds.
- Agents can reallocate liquidity across zones based on real-time aerial-duel win probabilities.

### 3. The Goal or Clearance
If a goal is scored within **8 seconds** of the corner being taken:
- The zone where the final touch/shot originated pays out.
- Yield = `(Zone Multiplier × Goal Rarity Bonus × User LP Share) / Total Zone Liquidity`
- **Goal Rarity Bonus**: Direct header = 1.5x | Volley = 2.0x | Rebound/scramble = 2.5x | Own goal = 0.5x
- If no goal: 80% of supplied liquidity returns to users. 20% rolls into the next corner kick pool as a **progressive jackpot**.

### 4. Progressive Jackpot
- Every cleared corner adds 20% to the jackpot.
- The next corner kick from the same team in the same match has its base multipliers increased by the jackpot size.
- This creates **liquidity clustering** — users chase the fattened pools.

## DeFi Primitives Used

| Primitive | How it shows up |
|-----------|-----------------|
| **Liquidity Pools** | Each zone is an LP pool |
| **AMM Share Dilution** | More LPs = lower per-user yield |
| **Burning** | Burn `$GOALS` to boost zone multipliers |
| **Progressive Jackpot** | Rolled liquidity creates clustering incentives |
| **Yield Burst** | Goal events trigger non-linear payout curves |

## Agentic Layer

Agents analyze:
- Team set-piece strength (xG from corners)
- Aerial duel win rates by zone
- Pool depth imbalance (where is liquidity under-supplied?)

Agent actions:
- **Auto-supply** to under-capitalized high-probability zones
- **Burn-boost** zones where model confidence >70%
- **Arbitrage** between corner-kick zone pools and prediction market odds for "next goal from a corner"

## Corner Case Rules

- If the corner is short (played to a teammate outside the box), the 8-second goal window still applies but the zone is determined by the final shot location.
- If the ball never enters the box, all stakes are refunded (no jackpot add).
- If a handball is called during the corner sequence, stakes are refunded.

## MVP Scope

- [ ] 6-zone box visualization
- [ ] LP supply/withdraw mechanics
- [ ] Corner event detection & 8-second goal window
- [ ] Burn-to-boost logic
- [ ] Progressive jackpot rollover
- [ ] Agent zone-arbitrage hooks
