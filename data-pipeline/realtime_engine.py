"""
Soccer Souls - Real-Time Data Pipeline
Processes live match data with <500ms latency
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
import websockets
import aiohttp
from redis import Redis
import hashlib

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EventType(Enum):
    """Match event types"""
    PASS = "pass"
    SHOT = "shot"
    GOAL = "goal"
    TACKLE = "tackle"
    SAVE = "save"
    SUBSTITUTION = "substitution"
    YELLOW_CARD = "yellow_card"
    RED_CARD = "red_card"
    SPRINT = "sprint"
    POSSESSION_CHANGE = "possession_change"
    FORMATION_CHANGE = "formation_change"


@dataclass
class PlayerPosition:
    """GPS tracking data"""
    x: float  # 0-100 (pitch percentage)
    y: float  # 0-100
    speed: float  # km/h
    distance_covered: float  # meters
    timestamp: datetime


@dataclass
class BiometricData:
    """Player biometric data"""
    heart_rate: int  # bpm
    fatigue_level: int  # 0-100
    sprint_capacity: int  # 0-100
    recovery_rate: float  # seconds
    timestamp: datetime


@dataclass
class MatchEvent:
    """Real-time match event"""
    event_id: str
    match_id: str
    event_type: EventType
    player_id: str
    team_id: str
    timestamp: datetime
    
    # Event details
    position: Optional[PlayerPosition] = None
    biometric: Optional[BiometricData] = None
    xG: Optional[float] = None  # Expected goals
    xA: Optional[float] = None  # Expected assists
    
    # Context
    minute: int = 0
    score_home: int = 0
    score_away: int = 0
    possession: float = 50.0  # Percentage
    
    # Advanced metrics
    pressing_intensity: Optional[float] = None  # 0-100
    pass_distance: Optional[float] = None
    pass_angle: Optional[float] = None
    shot_power: Optional[float] = None


class StadiumAPIConnector:
    """
    Connect to stadium data APIs
    StatsBomb, Opta, SportsRadar, etc.
    """
    
    def __init__(self, config: Dict):
        self.config = config
        self.connections = {}
        self.callbacks: List[Callable] = []
        
    async def connect_statsbomb(self, api_key: str):
        """Connect to StatsBomb API"""
        url = "wss://statsbomb.com/api/v1/stream"
        headers = {"Authorization": f"Bearer {api_key}"}
        
        try:
            ws = await websockets.connect(url, extra_headers=headers)
            self.connections['statsbomb'] = ws
            asyncio.create_task(self._listen_statsbomb(ws))
            logger.info("✅ StatsBomb connected")
        except Exception as e:
            logger.error(f"❌ StatsBomb connection failed: {e}")
    
    async def connect_opta(self, api_key: str):
        """Connect to Opta API"""
        url = "wss://opta.api.stats.com/v1/live"
        headers = {"X-API-Key": api_key}
        
        try:
            ws = await websockets.connect(url, extra_headers=headers)
            self.connections['opta'] = ws
            asyncio.create_task(self._listen_opta(ws))
            logger.info("✅ Opta connected")
        except Exception as e:
            logger.error(f"❌ Opta connection failed: {e}")
    
    async def connect_sportradar(self, api_key: str):
        """Connect to SportsRadar API"""
        url = f"wss://ws.sportradar.com/soccer/trial/v1/stream?api_key={api_key}"
        
        try:
            ws = await websockets.connect(url)
            self.connections['sportradar'] = ws
            asyncio.create_task(self._listen_sportradar(ws))
            logger.info("✅ SportsRadar connected")
        except Exception as e:
            logger.error(f"❌ SportsRadar connection failed: {e}")
    
    async def connect_catapult(self, api_key: str, team_id: str):
        """
        Connect to Catapult GPS tracking
        Requires team partnership
        """
        url = f"wss://catapult.com/api/v6/teams/{team_id}/live"
        headers = {"Authorization": f"Bearer {api_key}"}
        
        try:
            ws = await websockets.connect(url, extra_headers=headers)
            self.connections['catapult'] = ws
            asyncio.create_task(self._listen_catapult(ws))
            logger.info("✅ Catapult GPS connected")
        except Exception as e:
            logger.error(f"❌ Catapult connection failed: {e}")
    
    async def _listen_statsbomb(self, ws):
        """Listen to StatsBomb stream"""
        async for message in ws:
            try:
                data = json.loads(message)
                event = self._parse_statsbomb_event(data)
                await self._broadcast_event(event)
            except Exception as e:
                logger.error(f"StatsBomb parse error: {e}")
    
    async def _listen_opta(self, ws):
        """Listen to Opta stream"""
        async for message in ws:
            try:
                data = json.loads(message)
                event = self._parse_opta_event(data)
                await self._broadcast_event(event)
            except Exception as e:
                logger.error(f"Opta parse error: {e}")
    
    async def _listen_sportradar(self, ws):
        """Listen to SportsRadar stream"""
        async for message in ws:
            try:
                data = json.loads(message)
                event = self._parse_sportradar_event(data)
                await self._broadcast_event(event)
            except Exception as e:
                logger.error(f"SportsRadar parse error: {e}")
    
    async def _listen_catapult(self, ws):
        """Listen to Catapult GPS stream"""
        async for message in ws:
            try:
                data = json.loads(message)
                event = self._parse_catapult_event(data)
                await self._broadcast_event(event)
            except Exception as e:
                logger.error(f"Catapult parse error: {e}")
    
    def _parse_statsbomb_event(self, data: Dict) -> MatchEvent:
        """Parse StatsBomb event format"""
        return MatchEvent(
            event_id=data.get('id', ''),
            match_id=data.get('match_id', ''),
            event_type=EventType(data.get('type', {}).get('name', '').lower()),
            player_id=str(data.get('player', {}).get('id', '')),
            team_id=str(data.get('team', {}).get('id', '')),
            timestamp=datetime.now(),
            minute=data.get('minute', 0),
            xG=data.get('shot', {}).get('statsbomb_xg') if data.get('type', {}).get('name') == 'Shot' else None
        )
    
    def _parse_opta_event(self, data: Dict) -> MatchEvent:
        """Parse Opta event format"""
        return MatchEvent(
            event_id=str(data.get('eventId', '')),
            match_id=str(data.get('matchId', '')),
            event_type=self._map_opta_event_type(data.get('type', {}).get('value', '')),
            player_id=str(data.get('contestantId', '')),
            team_id=str(data.get('contestantId', '')),
            timestamp=datetime.now(),
            minute=data.get('time', {}).get('minute', 0)
        )
    
    def _parse_sportradar_event(self, data: Dict) -> MatchEvent:
        """Parse SportsRadar event format"""
        return MatchEvent(
            event_id=data.get('id', ''),
            match_id=data.get('sport_event', {}).get('id', ''),
            event_type=self._map_sportradar_event_type(data.get('type', '')),
            player_id=data.get('players', [{}])[0].get('id', '') if data.get('players') else '',
            team_id=data.get('team', {}).get('id', ''),
            timestamp=datetime.now()
        )
    
    def _parse_catapult_event(self, data: Dict) -> MatchEvent:
        """Parse Catapult GPS data"""
        return MatchEvent(
            event_id=hashlib.md5(f"{data['timestamp']}{data['player_id']}".encode()).hexdigest(),
            match_id=data.get('match_id', ''),
            event_type=EventType.SPRINT if data.get('speed', 0) > 25 else EventType.PASS,
            player_id=str(data.get('player_id', '')),
            team_id=str(data.get('team_id', '')),
            timestamp=datetime.now(),
            position=PlayerPosition(
                x=data.get('x', 0),
                y=data.get('y', 0),
                speed=data.get('speed', 0),
                distance_covered=data.get('distance', 0),
                timestamp=datetime.now()
            ),
            biometric=BiometricData(
                heart_rate=data.get('heart_rate', 0),
                fatigue_level=data.get('fatigue', 0),
                sprint_capacity=data.get('sprint_capacity', 100),
                recovery_rate=data.get('recovery', 0),
                timestamp=datetime.now()
            )
        )
    
    def _map_opta_event_type(self, opta_type: str) -> EventType:
        """Map Opta event types to our enum"""
        mapping = {
            '1': EventType.PASS,
            '13': EventType.SHOT,
            '16': EventType.GOAL,
            '7': EventType.TACKLE,
            '10': EventType.SAVE,
            '18': EventType.SUBSTITUTION,
            '31': EventType.YELLOW_CARD,
            '32': EventType.RED_CARD
        }
        return mapping.get(opta_type, EventType.PASS)
    
    def _map_sportradar_event_type(self, sr_type: str) -> EventType:
        """Map SportsRadar event types"""
        mapping = {
            'score_change': EventType.GOAL,
            'shot': EventType.SHOT,
            'penalty_shootout': EventType.SHOT,
            'yellow_card': EventType.YELLOW_CARD,
            'red_card': EventType.RED_CARD,
            'substitution': EventType.SUBSTITUTION
        }
        return mapping.get(sr_type.lower(), EventType.PASS)
    
    async def _broadcast_event(self, event: MatchEvent):
        """Broadcast event to all registered callbacks"""
        for callback in self.callbacks:
            try:
                asyncio.create_task(callback(event))
            except Exception as e:
                logger.error(f"Callback error: {e}")
    
    def register_callback(self, callback: Callable):
        """Register event callback"""
        self.callbacks.append(callback)
    
    async def close_all(self):
        """Close all connections"""
        for name, ws in self.connections.items():
            await ws.close()
            logger.info(f"Closed {name} connection")


class EventProcessor:
    """
    Process match events and trigger NFT updates
    Target: <500ms end-to-end latency
    """
    
    def __init__(self, redis_host: str = 'localhost', redis_port: int = 6379):
        self.redis = Redis(host=redis_host, port=redis_port, decode_responses=True)
        self.processors = {
            EventType.SHOT: self._process_shot,
            EventType.GOAL: self._process_goal,
            EventType.SPRINT: self._process_sprint,
            EventType.PASS: self._process_pass,
            EventType.TACKLE: self._process_tackle,
            EventType.SAVE: self._process_save,
        }
        self.callbacks = []
        
    async def process_event(self, event: MatchEvent):
        """Process a match event"""
        start_time = datetime.now()
        
        # 1. Store in Redis (cache for 1 hour)
        self._cache_event(event)
        
        # 2. Run specific processor
        processor = self.processors.get(event.event_type)
        if processor:
            await processor(event)
        
        # 3. Update player NFT stats
        await self._update_player_stats(event)
        
        # 4. Check for achievements
        await self._check_achievements(event)
        
        # 5. Broadcast to subscribers
        await self._broadcast(event)
        
        # Log latency
        latency = (datetime.now() - start_time).total_seconds() * 1000
        logger.info(f"⚡ Event processed in {latency:.2f}ms: {event.event_type.value}")
    
    def _cache_event(self, event: MatchEvent):
        """Cache event in Redis"""
        key = f"match:{event.match_id}:events"
        event_json = json.dumps(asdict(event), default=str)
        self.redis.zadd(key, {event_json: event.timestamp.timestamp()})
        self.redis.expire(key, 3600)  # 1 hour TTL
    
    async def _process_shot(self, event: MatchEvent):
        """Process shot event"""
        if event.xG and event.xG > 0.3:
            await self._trigger_prediction_opportunity(event)
        
        await self._update_stat(event.player_id, 'shots', 1)
        await self._update_stat(event.player_id, 'xG_total', event.xG or 0)
    
    async def _process_goal(self, event: MatchEvent):
        """Process goal event"""
        await self._update_stat(event.player_id, 'goals', 1)
        await self._update_stat(event.player_id, 'match_goals', 1)
        
        current_goals = int(self.redis.hget(f"player:{event.player_id}:match", 'goals') or 0)
        if current_goals >= 3:
            await self._trigger_achievement(event.player_id, 'hat_trick')
        
        await self._boost_card_value(event.player_id, duration_minutes=30)
        await self._trigger_celebration(event)
    
    async def _process_sprint(self, event: MatchEvent):
        """Process sprint event"""
        if event.position and event.position.speed > 30:
            await self._update_stat(event.player_id, 'sprints_high', 1)
            
            if event.biometric and event.biometric.fatigue_level > 80:
                await self._alert_fatigue(event)
    
    async def _process_pass(self, event: MatchEvent):
        """Process pass event"""
        await self._update_stat(event.player_id, 'passes', 1)
        
        if event.xA and event.xA > 0.2:
            await self._update_stat(event.player_id, 'key_passes', 1)
    
    async def _process_tackle(self, event: MatchEvent):
        """Process tackle event"""
        await self._update_stat(event.player_id, 'tackles', 1)
        
        pressing = event.pressing_intensity or 0
        if pressing > 75:
            await self._update_stat(event.player_id, 'pressing_bonus', 1)
    
    async def _process_save(self, event: MatchEvent):
        """Process save event"""
        await self._update_stat(event.player_id, 'saves', 1)
    
    async def _update_player_stats(self, event: MatchEvent):
        """Update player NFT on-chain stats"""
        update_data = {
            'player_id': event.player_id,
            'match_id': event.match_id,
            'timestamp': event.timestamp.isoformat(),
            'event_type': event.event_type.value
        }
        self.redis.lpush('nft:update:queue', json.dumps(update_data))
    
    async def _update_stat(self, player_id: str, stat_name: str, value: float):
        """Update player stat in Redis"""
        key = f"player:{player_id}:stats"
        self.redis.hincrbyfloat(key, stat_name, value)
        self.redis.expire(key, 86400)
    
    async def _check_achievements(self, event: MatchEvent):
        """Check for achievement triggers"""
        stats = self.redis.hgetall(f"player:{event.player_id}:stats")
        
        achievements = []
        
        if int(stats.get('goals', 0)) >= 10:
            achievements.append('goal_machine')
        
        if int(stats.get('sprints_high', 0)) >= 5:
            achievements.append('speed_demon')
        
        if int(stats.get('passes', 0)) >= 50:
            achievements.append('playmaker')
        
        for achievement in achievements:
            await self._trigger_achievement(event.player_id, achievement)
    
    async def _trigger_achievement(self, player_id: str, achievement_type: str):
        """Trigger achievement NFT mint"""
        match_key = f"player:{player_id}:achievements:match"
        if self.redis.sismember(match_key, achievement_type):
            return
        
        achievement_data = {
            'player_id': player_id,
            'type': achievement_type,
            'timestamp': datetime.now().isoformat()
        }
        self.redis.lpush('nft:achievement:queue', json.dumps(achievement_data))
        self.redis.sadd(match_key, achievement_type)
        self.redis.expire(match_key, 7200)
        
        logger.info(f"🏆 Achievement queued: {achievement_type} for {player_id}")
    
    async def _boost_card_value(self, player_id: str, duration_minutes: int):
        """Temporarily boost card value"""
        boost_key = f"player:{player_id}:boost"
        self.redis.setex(boost_key, duration_minutes * 60, 'active')
    
    async def _trigger_prediction_opportunity(self, event: MatchEvent):
        """Trigger prediction market opportunity"""
        opportunity = {
            'type': 'high_xg_shot',
            'match_id': event.match_id,
            'player_id': event.player_id,
            'team_id': event.team_id,
            'xG': event.xG,
            'timestamp': datetime.now().isoformat()
        }
        self.redis.publish('prediction:opportunities', json.dumps(opportunity))
    
    async def _alert_fatigue(self, event: MatchEvent):
        """Alert about player fatigue"""
        alert = {
            'player_id': event.player_id,
            'fatigue_level': event.biometric.fatigue_level if event.biometric else 100,
            'risk': 'high',
            'timestamp': datetime.now().isoformat()
        }
        self.redis.publish('alerts:fatigue', json.dumps(alert))
    
    async def _trigger_celebration(self, event: MatchEvent):
        """Trigger goal celebration"""
        celebration = {
            'type': 'goal',
            'player_id': event.player_id,
            'match_id': event.match_id,
            'minute': event.minute,
            'timestamp': datetime.now().isoformat()
        }
        self.redis.publish('events:celebrations', json.dumps(celebration))
    
    async def _broadcast(self, event: MatchEvent):
        """Broadcast to WebSocket subscribers"""
        message = json.dumps(asdict(event), default=str)
        self.redis.publish(f"match:{event.match_id}:stream", message)


class RealtimePipeline:
    """Main pipeline orchestrator"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.connector = StadiumAPIConnector(config)
        self.processor = EventProcessor(
            redis_host=config.get('redis_host', 'localhost'),
            redis_port=config.get('redis_port', 6379)
        )
        self.running = False
        
    async def start(self):
        """Start the pipeline"""
        logger.info("🚀 Starting Soccer Souls Real-Time Pipeline...")
        self.running = True
        
        self.connector.register_callback(self.processor.process_event)
        
        if self.config.get('statsbomb_key'):
            await self.connector.connect_statsbomb(self.config['statsbomb_key'])
        
        if self.config.get('opta_key'):
            await self.connector.connect_opta(self.config['opta_key'])
        
        if self.config.get('sportradar_key'):
            await self.connector.connect_sportradar(self.config['sportradar_key'])
        
        if self.config.get('catapult_key') and self.config.get('team_id'):
            await self.connector.connect_catapult(
                self.config['catapult_key'],
                self.config['team_id']
            )
        
        logger.info("✅ Pipeline running. Listening for events...")
        
        while self.running:
            await asyncio.sleep(1)
    
    async def stop(self):
        """Stop the pipeline"""
        logger.info("🛑 Stopping pipeline...")
        self.running = False
        await self.connector.close_all()


if __name__ == "__main__":
    async def main():
        config = {
            'redis_host': 'localhost',
            'redis_port': 6379,
        }
        
        pipeline = RealtimePipeline(config)
        
        try:
            await pipeline.start()
        except KeyboardInterrupt:
            await pipeline.stop()
    
    asyncio.run(main())
