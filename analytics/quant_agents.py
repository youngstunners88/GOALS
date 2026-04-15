"""
Soccer Souls - QuantAgents
Game Economy Analytics & Player Valuation Engine
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class PlayerMetrics:
    """Player performance metrics for valuation"""
    player_id: str
    goals: int
    assists: int
    matches_played: int
    minutes_played: int
    rating: float
    form_score: float  # 0-100
    rarity: str  # common, rare, epic, legendary
    last_updated: datetime


@dataclass
class MarketData:
    """NFT market data for a player card"""
    player_id: str
    floor_price: float
    volume_24h: float
    volume_7d: float
    listings_count: int
    sales_count_24h: int
    price_change_24h: float
    price_change_7d: float


class PlayerValuationEngine:
    """
    Quantitative valuation engine for Soccer Souls player NFTs
    Uses technical indicators and machine learning for price prediction
    """
    
    def __init__(self):
        self.weights = {
            'performance': 0.35,
            'rarity': 0.25,
            'market_momentum': 0.20,
            'form': 0.15,
            'scarcity': 0.05
        }
    
    def calculate_performance_score(self, metrics: PlayerMetrics) -> float:
        """Calculate performance-based valuation score (0-100)"""
        if metrics.matches_played == 0:
            return 50.0
        
        goals_per_match = metrics.goals / metrics.matches_played
        assists_per_match = metrics.assists / metrics.matches_played
        minutes_ratio = metrics.minutes_played / (metrics.matches_played * 90)
        
        # Normalize to 0-100 scale
        score = (
            goals_per_match * 20 +  # Max 20 points for goals
            assists_per_match * 15 +  # Max 15 points for assists
            metrics.rating * 5 +  # Max 5 points for rating
            minutes_ratio * 10  # Max 10 points for minutes
        )
        
        return min(100, max(0, score))
    
    def calculate_rarity_multiplier(self, rarity: str) -> float:
        """Rarity multiplier for valuation"""
        multipliers = {
            'common': 1.0,
            'rare': 2.5,
            'epic': 6.0,
            'legendary': 15.0
        }
        return multipliers.get(rarity.lower(), 1.0)
    
    def calculate_market_momentum(self, market: MarketData) -> float:
        """Calculate market momentum score (0-100)"""
        if market.volume_24h == 0:
            return 50.0
        
        # Volume momentum
        volume_score = min(50, market.volume_24h / 100)  # Cap at 50
        
        # Price momentum (RSI-like calculation)
        price_change_score = 50 + (market.price_change_7d * 2)  # Center at 50
        price_change_score = max(0, min(100, price_change_score))
        
        # Liquidity score
        liquidity_score = min(25, market.listings_count / 10)
        
        return (volume_score + price_change_score + liquidity_score) / 3
    
    def calculate_valuation(
        self, 
        metrics: PlayerMetrics, 
        market: MarketData,
        base_price: float = 100.0
    ) -> Dict[str, float]:
        """
        Calculate comprehensive player card valuation
        
        Returns:
            Dict with fair_value, confidence, and factors
        """
        performance_score = self.calculate_performance_score(metrics)
        rarity_mult = self.calculate_rarity_multiplier(metrics.rarity)
        momentum_score = self.calculate_market_momentum(market)
        
        # Scarcity factor based on listings
        scarcity_factor = 1 + (1 / (market.listings_count + 1))
        
        # Weighted valuation
        fair_value = base_price * rarity_mult * (
            self.weights['performance'] * (performance_score / 50) +
            self.weights['rarity'] * (rarity_mult / 5) +
            self.weights['market_momentum'] * (momentum_score / 50) +
            self.weights['form'] * (metrics.form_score / 50) +
            self.weights['scarcity'] * scarcity_factor
        )
        
        # Confidence based on data quality
        confidence = min(1.0, (
            (1 if metrics.matches_played > 5 else 0.5) +
            (1 if market.volume_24h > 0 else 0.3) +
            (1 if market.listings_count > 0 else 0.2)
        ) / 3)
        
        return {
            'fair_value': round(fair_value, 2),
            'confidence': round(confidence, 2),
            'performance_score': round(performance_score, 2),
            'momentum_score': round(momentum_score, 2),
            'rarity_multiplier': rarity_mult,
            'scarcity_factor': round(scarcity_factor, 2)
        }


class MarketAnalyzer:
    """
    Analyze NFT market trends and generate trading signals
    """
    
    def __init__(self):
        self.lookback_periods = [7, 14, 30]
    
    def calculate_rsi(self, prices: List[float], period: int = 14) -> float:
        """Calculate Relative Strength Index"""
        if len(prices) < period + 1:
            return 50.0
        
        deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
        gains = [d if d > 0 else 0 for d in deltas[-period:]]
        losses = [-d if d < 0 else 0 for d in deltas[-period:]]
        
        avg_gain = sum(gains) / period
        avg_loss = sum(losses) / period
        
        if avg_loss == 0:
            return 100.0
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        return rsi
    
    def calculate_macd(
        self, 
        prices: List[float], 
        fast: int = 12, 
        slow: int = 26, 
        signal: int = 9
    ) -> Tuple[float, float, float]:
        """Calculate MACD indicator"""
        if len(prices) < slow:
            return 0.0, 0.0, 0.0
        
        # Calculate EMAs
        ema_fast = self._calculate_ema(prices, fast)
        ema_slow = self._calculate_ema(prices, slow)
        
        macd_line = ema_fast - ema_slow
        signal_line = self._calculate_ema([macd_line], signal)
        histogram = macd_line - signal_line
        
        return macd_line, signal_line, histogram
    
    def _calculate_ema(self, prices: List[float], period: int) -> float:
        """Calculate Exponential Moving Average"""
        if len(prices) < period:
            return sum(prices) / len(prices) if prices else 0.0
        
        multiplier = 2 / (period + 1)
        ema = sum(prices[:period]) / period
        
        for price in prices[period:]:
            ema = (price - ema) * multiplier + ema
        
        return ema
    
    def generate_trading_signal(
        self, 
        price_history: List[float],
        volume_history: List[float]
    ) -> Dict[str, any]:
        """
        Generate trading signal based on technical analysis
        
        Returns:
            Dict with signal, strength, and indicators
        """
        if len(price_history) < 30:
            return {
                'signal': 'HOLD',
                'strength': 0.0,
                'reason': 'Insufficient data'
            }
        
        rsi = self.calculate_rsi(price_history)
        macd, signal, hist = self.calculate_macd(price_history)
        
        # Volume trend
        vol_avg = sum(volume_history[-7:]) / 7 if len(volume_history) >= 7 else 0
        vol_current = volume_history[-1] if volume_history else 0
        vol_ratio = vol_current / vol_avg if vol_avg > 0 else 1.0
        
        # Signal logic
        signal_type = 'HOLD'
        strength = 0.0
        reasons = []
        
        # RSI signals
        if rsi < 30:
            signal_type = 'BUY'
            strength += 0.3
            reasons.append(f"Oversold (RSI: {rsi:.1f})")
        elif rsi > 70:
            signal_type = 'SELL'
            strength += 0.3
            reasons.append(f"Overbought (RSI: {rsi:.1f})")
        
        # MACD signals
        if hist > 0 and macd > 0:
            if signal_type == 'BUY':
                strength += 0.3
            else:
                signal_type = 'BUY'
                strength += 0.2
            reasons.append("MACD bullish crossover")
        elif hist < 0 and macd < 0:
            if signal_type == 'SELL':
                strength += 0.3
            else:
                signal_type = 'SELL'
                strength += 0.2
            reasons.append("MACD bearish crossover")
        
        # Volume confirmation
        if vol_ratio > 1.5:
            strength += 0.2
            reasons.append(f"High volume ({vol_ratio:.1f}x avg)")
        
        return {
            'signal': signal_type,
            'strength': round(min(1.0, strength), 2),
            'rsi': round(rsi, 2),
            'macd': round(macd, 4),
            'histogram': round(hist, 4),
            'volume_ratio': round(vol_ratio, 2),
            'reasons': reasons
        }


class EconomySimulator:
    """
    Simulate Soccer Souls token economy
    """
    
    def __init__(
        self,
        total_supply: int = 1_000_000_000,
        initial_price: float = 0.01
    ):
        self.total_supply = total_supply
        self.initial_price = initial_price
        self.circulating_supply = 0
        self.treasury = 0
        
        # Distribution
        self.distribution = {
            'play_to_earn': 0.40,
            'treasury': 0.20,
            'team': 0.15,
            'staking': 0.15,
            'liquidity': 0.10
        }
    
    def simulate_match_rewards(
        self,
        winner_score: int,
        loser_score: int,
        total_participants: int
    ) -> Dict[str, float]:
        """Calculate match rewards distribution"""
        base_reward = 10.0
        margin_bonus = abs(winner_score - loser_score) * 2
        
        winner_pool = (base_reward + margin_bonus) * 10
        participant_pool = base_reward * total_participants
        
        return {
            'winner_reward': winner_pool,
            'participant_reward': participant_pool / total_participants if total_participants > 0 else 0,
            'total_distributed': winner_pool + participant_pool,
            'burn_amount': winner_pool * 0.02  # 2% burn
        }
    
    def calculate_staking_apy(
        self,
        lock_period_days: int,
        total_staked: float
    ) -> float:
        """Calculate dynamic staking APY"""
        base_apy = 0.05  # 5% base
        
        # Lock period bonus
        lock_bonus = {
            7: 0.0,
            30: 0.05,
            90: 0.10,
            180: 0.15,
            365: 0.25
        }.get(lock_period_days, 0.0)
        
        # Supply reduction bonus (more staked = higher APY)
        stake_ratio = total_staked / self.total_supply
        supply_bonus = stake_ratio * 0.10
        
        return base_apy + lock_bonus + supply_bonus


# Example usage
if __name__ == "__main__":
    # Initialize engines
    valuation = PlayerValuationEngine()
    analyzer = MarketAnalyzer()
    economy = EconomySimulator()
    
    # Example player metrics
    player = PlayerMetrics(
        player_id="messi_legend_001",
        goals=25,
        assists=15,
        matches_played=30,
        minutes_played=2700,
        rating=8.5,
        form_score=85.0,
        rarity="legendary",
        last_updated=datetime.now()
    )
    
    # Example market data
    market = MarketData(
        player_id="messi_legend_001",
        floor_price=2.5,
        volume_24h=150.0,
        volume_7d=1200.0,
        listings_count=5,
        sales_count_24h=3,
        price_change_24h=5.2,
        price_change_7d=15.8
    )
    
    # Calculate valuation
    result = valuation.calculate_valuation(player, market, base_price=100.0)
    print(f"Valuation Result: {result}")
    
    # Generate trading signal
    price_history = [100, 102, 98, 105, 110, 108, 115, 120, 118, 125] * 5
    volume_history = [50, 60, 45, 70, 80, 75, 90, 100, 85, 110] * 5
    signal = analyzer.generate_trading_signal(price_history, volume_history)
    print(f"Trading Signal: {signal}")
