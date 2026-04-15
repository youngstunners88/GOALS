#!/usr/bin/env python3
"""
Soccer Souls - Agent Monitoring Service
24/7 monitoring of VM-based agents with alerting
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List
import requests
import sqlite3

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AgentMonitor:
    """
    Monitor VM-based agent fleet
    Tracks health, performance, and profitability
    """
    
    def __init__(self, config_path: str = "config/monitor.json"):
        self.config = self.load_config(config_path)
        self.db_path = self.config.get('db_path', 'data/monitor.db')
        self.init_database()
        
        # Alert thresholds
        self.thresholds = {
            'max_downtime_minutes': 5,
            'min_profit_per_day': -50,  # Alert if losing more than $50/day
            'max_latency_ms': 1000,
            'min_trades_per_hour': 1
        }
        
        # Alert channels
        self.webhook_url = self.config.get('webhook_url')
        self.telegram_bot_token = self.config.get('telegram_bot_token')
        self.telegram_chat_id = self.config.get('telegram_chat_id')
    
    def load_config(self, path: str) -> Dict:
        """Load monitor configuration"""
        try:
            with open(path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {}
    
    def init_database(self):
        """Initialize SQLite database for metrics"""
        import os
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS agent_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                status TEXT,
                uptime_seconds INTEGER,
                trades_executed INTEGER,
                profit_usd REAL,
                latency_ms INTEGER,
                error_count INTEGER,
                memory_usage_mb REAL,
                cpu_usage_percent REAL
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                alert_type TEXT,
                severity TEXT,
                message TEXT,
                resolved BOOLEAN DEFAULT FALSE
            )
        ''')
        
        conn.commit()
        conn.close()
    
    async def collect_metrics(self, agent_id: str, vm_ip: str) -> Dict:
        """Collect metrics from agent VM"""
        try:
            # Fetch metrics from agent's HTTP endpoint
            response = requests.get(
                f"http://{vm_ip}:8080/metrics",
                timeout=5
            )
            
            if response.status_code == 200:
                metrics = response.json()
                metrics['agent_id'] = agent_id
                metrics['timestamp'] = datetime.now().isoformat()
                metrics['status'] = 'healthy'
                return metrics
            else:
                return {
                    'agent_id': agent_id,
                    'status': 'unhealthy',
                    'error': f'HTTP {response.status_code}',
                    'timestamp': datetime.now().isoformat()
                }
                
        except requests.exceptions.ConnectionError:
            return {
                'agent_id': agent_id,
                'status': 'offline',
                'error': 'Connection refused',
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'agent_id': agent_id,
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def store_metrics(self, metrics: Dict):
        """Store metrics in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO agent_metrics 
            (agent_id, timestamp, status, uptime_seconds, trades_executed, 
             profit_usd, latency_ms, error_count, memory_usage_mb, cpu_usage_percent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            metrics.get('agent_id'),
            metrics.get('timestamp'),
            metrics.get('status'),
            metrics.get('uptime_seconds', 0),
            metrics.get('trades_executed', 0),
            metrics.get('profit_usd', 0.0),
            metrics.get('latency_ms', 0),
            metrics.get('error_count', 0),
            metrics.get('memory_usage_mb', 0),
            metrics.get('cpu_usage_percent', 0)
        ))
        
        conn.commit()
        conn.close()
    
    def check_alerts(self, metrics: Dict) -> List[Dict]:
        """Check for alert conditions"""
        alerts = []
        agent_id = metrics['agent_id']
        
        # Check agent status
        if metrics['status'] != 'healthy':
            alerts.append({
                'agent_id': agent_id,
                'type': 'status',
                'severity': 'critical' if metrics['status'] == 'offline' else 'warning',
                'message': f"Agent {agent_id} is {metrics['status']}: {metrics.get('error', 'Unknown error')}"
            })
        
        # Check latency
        if metrics.get('latency_ms', 0) > self.thresholds['max_latency_ms']:
            alerts.append({
                'agent_id': agent_id,
                'type': 'latency',
                'severity': 'warning',
                'message': f"High latency: {metrics['latency_ms']}ms (threshold: {self.thresholds['max_latency_ms']}ms)"
            })
        
        # Check profit (need historical data)
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get 24h profit
        cursor.execute('''
            SELECT SUM(profit_usd) FROM agent_metrics 
            WHERE agent_id = ? AND timestamp > datetime('now', '-1 day')
        ''', (agent_id,))
        
        result = cursor.fetchone()
        profit_24h = result[0] if result[0] else 0
        
        if profit_24h < self.thresholds['min_profit_per_day']:
            alerts.append({
                'agent_id': agent_id,
                'type': 'profit',
                'severity': 'warning',
                'message': f"Low 24h profit: ${profit_24h:.2f}"
            })
        
        # Check trade frequency
        cursor.execute('''
            SELECT COUNT(*) FROM agent_metrics 
            WHERE agent_id = ? AND timestamp > datetime('now', '-1 hour')
        ''', (agent_id,))
        
        trades_1h = cursor.fetchone()[0]
        if trades_1h < self.thresholds['min_trades_per_hour']:
            alerts.append({
                'agent_id': agent_id,
                'type': 'activity',
                'severity': 'info',
                'message': f"Low activity: {trades_1h} trades/hour"
            })
        
        conn.close()
        
        return alerts
    
    def store_alert(self, alert: Dict):
        """Store alert in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO alerts (agent_id, timestamp, alert_type, severity, message)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            alert['agent_id'],
            datetime.now().isoformat(),
            alert['type'],
            alert['severity'],
            alert['message']
        ))
        
        conn.commit()
        conn.close()
    
    async def send_alert(self, alert: Dict):
        """Send alert via configured channels"""
        message = f"🚨 *{alert['severity'].upper()}*\n"
        message += f"Agent: `{alert['agent_id']}`\n"
        message += f"Type: {alert['type']}\n"
        message += f"Message: {alert['message']}\n"
        message += f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        
        # Send to Telegram
        if self.telegram_bot_token and self.telegram_chat_id:
            try:
                url = f"https://api.telegram.org/bot{self.telegram_bot_token}/sendMessage"
                payload = {
                    'chat_id': self.telegram_chat_id,
                    'text': message,
                    'parse_mode': 'Markdown'
                }
                requests.post(url, json=payload, timeout=10)
            except Exception as e:
                logger.error(f"Telegram alert failed: {e}")
        
        # Send to webhook
        if self.webhook_url:
            try:
                requests.post(self.webhook_url, json=alert, timeout=10)
            except Exception as e:
                logger.error(f"Webhook alert failed: {e}")
        
        logger.warning(f"ALERT: {alert['message']}")
    
    async def monitor_agent(self, agent_id: str, vm_ip: str):
        """Monitor a single agent continuously"""
        while True:
            try:
                # Collect metrics
                metrics = await self.collect_metrics(agent_id, vm_ip)
                
                # Store metrics
                self.store_metrics(metrics)
                
                # Check for alerts
                alerts = self.check_alerts(metrics)
                for alert in alerts:
                    self.store_alert(alert)
                    await self.send_alert(alert)
                
                # Log status
                if metrics['status'] == 'healthy':
                    logger.info(f"✅ {agent_id}: Healthy | Profit: ${metrics.get('profit_usd', 0):.2f} | Trades: {metrics.get('trades_executed', 0)}")
                else:
                    logger.warning(f"⚠️  {agent_id}: {metrics['status']} - {metrics.get('error', '')}")
                
                # Wait before next check
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                logger.error(f"Monitor error for {agent_id}: {e}")
                await asyncio.sleep(30)
    
    async def run_dashboard(self):
        """Run web dashboard for monitoring"""
        from aiohttp import web
        
        async def handle_stats(request):
            """API endpoint for stats"""
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Get latest metrics for all agents
            cursor.execute('''
                SELECT * FROM agent_metrics 
                WHERE id IN (
                    SELECT MAX(id) FROM agent_metrics GROUP BY agent_id
                )
            ''')
            
            rows = cursor.fetchall()
            agents = [dict(row) for row in rows]
            
            # Get total stats
            cursor.execute('''
                SELECT 
                    COUNT(DISTINCT agent_id) as total_agents,
                    SUM(profit_usd) as total_profit,
                    SUM(trades_executed) as total_trades
                FROM agent_metrics 
                WHERE timestamp > datetime('now', '-1 day')
            ''')
            
            totals = cursor.fetchone()
            
            conn.close()
            
            return web.json_response({
                'agents': agents,
                'totals': dict(totals) if totals else {},
                'timestamp': datetime.now().isoformat()
            })
        
        async def handle_alerts(request):
            """API endpoint for alerts"""
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM alerts 
                WHERE resolved = FALSE
                ORDER BY timestamp DESC
                LIMIT 100
            ''')
            
            rows = cursor.fetchall()
            alerts = [dict(row) for row in rows]
            
            conn.close()
            
            return web.json_response({'alerts': alerts})
        
        app = web.Application()
        app.router.add_get('/api/stats', handle_stats)
        app.router.add_get('/api/alerts', handle_alerts)
        
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, '0.0.0.0', 8080)
        await site.start()
        
        logger.info("📊 Dashboard running on http://0.0.0.0:8080")
    
    async def run(self):
        """Main monitoring loop"""
        logger.info("🔍 Starting Agent Monitor...")
        
        # Load agent fleet
        try:
            with open('config/vm_fleet.json', 'r') as f:
                fleet = json.load(f)
                agents = fleet.get('agents', [])
        except FileNotFoundError:
            logger.error("Fleet config not found")
            return
        
        # Start monitoring tasks
        tasks = []
        
        # Monitor each agent
        for agent in agents:
            task = asyncio.create_task(
                self.monitor_agent(agent['agent_id'], agent['vm_ip'])
            )
            tasks.append(task)
        
        # Start dashboard
        dashboard_task = asyncio.create_task(self.run_dashboard())
        tasks.append(dashboard_task)
        
        # Run forever
        await asyncio.gather(*tasks)


if __name__ == "__main__":
    monitor = AgentMonitor()
    asyncio.run(monitor.run())
