#!/usr/bin/env python3
"""
Soccer Souls - VM-Based Agent Manager
Manages autonomous trading agents across VM infrastructure
Decentralized approach with cloud fallback
"""

import asyncio
import json
import logging
import subprocess
import time
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import requests
import paramiko
from cryptography.fernet import Fernet

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class VMAgent:
    """VM-hosted agent instance"""
    agent_id: str
    vm_ip: str
    vm_user: str
    ssh_key_path: str
    wallet_address: str
    strategy: str
    status: str = "stopped"
    last_ping: Optional[datetime] = None
    uptime_seconds: int = 0
    trades_executed: int = 0
    profit_usd: float = 0.0


class VMAgentManager:
    """
    Manages VM-based agent fleet
    Handles deployment, monitoring, and failover
    """
    
    def __init__(self, config_path: str = "config/vm_fleet.json"):
        self.config_path = config_path
        self.agents: Dict[str, VMAgent] = {}
        self.ssh_clients: Dict[str, paramiko.SSHClient] = {}
        self.load_config()
        
    def load_config(self):
        """Load VM fleet configuration"""
        try:
            with open(self.config_path, 'r') as f:
                config = json.load(f)
                for agent_data in config.get('agents', []):
                    agent = VMAgent(**agent_data)
                    self.agents[agent.agent_id] = agent
            logger.info(f"Loaded {len(self.agents)} VM agents")
        except FileNotFoundError:
            logger.warning(f"Config not found: {self.config_path}")
    
    def save_config(self):
        """Save VM fleet configuration"""
        config = {
            'agents': [asdict(agent) for agent in self.agents.values()],
            'updated_at': datetime.now().isoformat()
        }
        with open(self.config_path, 'w') as f:
            json.dump(config, f, indent=2, default=str)
    
    def connect_ssh(self, agent_id: str) -> paramiko.SSHClient:
        """Establish SSH connection to VM"""
        agent = self.agents.get(agent_id)
        if not agent:
            raise ValueError(f"Agent not found: {agent_id}")
        
        if agent_id in self.ssh_clients:
            return self.ssh_clients[agent_id]
        
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        try:
            ssh.connect(
                hostname=agent.vm_ip,
                username=agent.vm_user,
                key_filename=agent.ssh_key_path,
                timeout=10
            )
            self.ssh_clients[agent_id] = ssh
            logger.info(f"SSH connected to {agent_id}@{agent.vm_ip}")
            return ssh
        except Exception as e:
            logger.error(f"SSH connection failed: {e}")
            raise
    
    def deploy_agent(self, agent_id: str) -> bool:
        """Deploy agent to VM"""
        agent = self.agents.get(agent_id)
        if not agent:
            logger.error(f"Agent not found: {agent_id}")
            return False
        
        try:
            ssh = self.connect_ssh(agent_id)
            
            # 1. Create agent directory
            commands = [
                "mkdir -p ~/soccer-souls-agent",
                "cd ~/soccer-souls-agent && python3 -m venv venv",
            ]
            
            for cmd in commands:
                stdin, stdout, stderr = ssh.exec_command(cmd)
                stdout.channel.recv_exit_status()
            
            # 2. Upload agent code
            sftp = ssh.open_sftp()
            
            # Create remote files
            agent_code = self._generate_agent_code(agent)
            requirements = self._generate_requirements()
            config = self._generate_agent_config(agent)
            systemd_service = self._generate_systemd_service(agent)
            
            # Write files
            files_to_upload = {
                '~/soccer-souls-agent/agent.py': agent_code,
                '~/soccer-souls-agent/requirements.txt': requirements,
                '~/soccer-souls-agent/config.json': config,
                '/tmp/soccer-souls-agent.service': systemd_service,
            }
            
            for remote_path, content in files_to_upload.items():
                with sftp.file(remote_path, 'w') as f:
                    f.write(content)
            
            sftp.close()
            
            # 3. Install dependencies
            install_cmd = """
                cd ~/soccer-souls-agent && 
                source venv/bin/activate && 
                pip install --upgrade pip && 
                pip install -r requirements.txt
            """
            stdin, stdout, stderr = ssh.exec_command(install_cmd)
            if stdout.channel.recv_exit_status() != 0:
                logger.error(f"Installation failed: {stderr.read().decode()}")
                return False
            
            # 4. Setup systemd service
            setup_service_cmd = """
                sudo mv /tmp/soccer-souls-agent.service /etc/systemd/system/ &&
                sudo systemctl daemon-reload &&
                sudo systemctl enable soccer-souls-agent
            """
            stdin, stdout, stderr = ssh.exec_command(setup_service_cmd)
            stdout.channel.recv_exit_status()
            
            logger.info(f"✅ Agent {agent_id} deployed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Deployment failed: {e}")
            return False
    
    def start_agent(self, agent_id: str) -> bool:
        """Start agent on VM"""
        try:
            ssh = self.connect_ssh(agent_id)
            stdin, stdout, stderr = ssh.exec_command(
                "sudo systemctl start soccer-souls-agent"
            )
            
            if stdout.channel.recv_exit_status() == 0:
                self.agents[agent_id].status = "running"
                self.agents[agent_id].last_ping = datetime.now()
                self.save_config()
                logger.info(f"🚀 Agent {agent_id} started")
                return True
            else:
                logger.error(f"Failed to start: {stderr.read().decode()}")
                return False
                
        except Exception as e:
            logger.error(f"Start failed: {e}")
            return False
    
    def stop_agent(self, agent_id: str) -> bool:
        """Stop agent on VM"""
        try:
            ssh = self.connect_ssh(agent_id)
            stdin, stdout, stderr = ssh.exec_command(
                "sudo systemctl stop soccer-souls-agent"
            )
            
            if stdout.channel.recv_exit_status() == 0:
                self.agents[agent_id].status = "stopped"
                self.save_config()
                logger.info(f"🛑 Agent {agent_id} stopped")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Stop failed: {e}")
            return False
    
    def get_agent_status(self, agent_id: str) -> Dict:
        """Get agent status from VM"""
        try:
            ssh = self.connect_ssh(agent_id)
            
            # Check systemd status
            stdin, stdout, stderr = ssh.exec_command(
                "sudo systemctl status soccer-souls-agent --no-pager"
            )
            status_output = stdout.read().decode()
            
            # Check logs
            stdin, stdout, stderr = ssh.exec_command(
                "sudo journalctl -u soccer-souls-agent -n 50 --no-pager"
            )
            logs = stdout.read().decode()
            
            # Check stats file
            stdin, stdout, stderr = ssh.exec_command(
                "cat ~/soccer-souls-agent/stats.json 2>/dev/null || echo '{}'"
            )
            try:
                stats = json.loads(stdout.read().decode())
            except:
                stats = {}
            
            return {
                'agent_id': agent_id,
                'status': self.agents[agent_id].status,
                'systemd_status': 'active' if 'Active: active' in status_output else 'inactive',
                'stats': stats,
                'last_logs': logs[-2000:],  # Last 2000 chars
                'vm_ip': self.agents[agent_id].vm_ip
            }
            
        except Exception as e:
            logger.error(f"Status check failed: {e}")
            return {
                'agent_id': agent_id,
                'status': 'error',
                'error': str(e)
            }
    
    def monitor_all_agents(self):
        """Monitor all agents and restart if needed"""
        logger.info("🔍 Monitoring all agents...")
        
        for agent_id, agent in self.agents.items():
            try:
                status = self.get_agent_status(agent_id)
                
                if status['systemd_status'] != 'active' and agent.status == 'running':
                    logger.warning(f"⚠️ Agent {agent_id} down, restarting...")
                    self.start_agent(agent_id)
                
                # Update stats
                if 'stats' in status:
                    agent.trades_executed = status['stats'].get('trades', 0)
                    agent.profit_usd = status['stats'].get('profit', 0.0)
                    agent.last_ping = datetime.now()
                
            except Exception as e:
                logger.error(f"Monitor error for {agent_id}: {e}")
        
        self.save_config()
    
    def _generate_agent_code(self, agent: VMAgent) -> str:
        """Generate autonomous agent code for VM"""
        return f'''#!/usr/bin/env python3
"""
Soccer Souls Autonomous Agent
Agent ID: {agent.agent_id}
Strategy: {agent.strategy}
Wallet: {agent.wallet_address}
"""

import asyncio
import json
import logging
import time
from datetime import datetime
import requests
import websocket

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('agent.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class AutonomousAgent:
    def __init__(self):
        self.agent_id = "{agent.agent_id}"
        self.wallet = "{agent.wallet_address}"
        self.strategy = "{agent.strategy}"
        self.running = True
        self.stats = {{
            'trades': 0,
            'profit': 0.0,
            'start_time': datetime.now().isoformat()
        }}
        
    async def run(self):
        logger.info(f"🚀 Agent {{self.agent_id}} starting with {{self.strategy}} strategy")
        
        while self.running:
            try:
                # 1. Connect to data stream
                await self.connect_data_stream()
                
                # 2. Process opportunities
                await self.process_opportunities()
                
                # 3. Update stats
                self.save_stats()
                
                await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"Error: {{e}}")
                await asyncio.sleep(10)
    
    async def connect_data_stream(self):
        """Connect to Soccer Souls data pipeline"""
        # Connect to Redis pub/sub or WebSocket
        pass
    
    async def process_opportunities(self):
        """Process trading opportunities"""
        # Implement strategy logic
        pass
    
    def save_stats(self):
        """Save stats to file"""
        with open('stats.json', 'w') as f:
            json.dump(self.stats, f)
    
    def stop(self):
        self.running = False

if __name__ == "__main__":
    agent = AutonomousAgent()
    try:
        asyncio.run(agent.run())
    except KeyboardInterrupt:
        agent.stop()
        logger.info("Agent stopped")
'''
    
    def _generate_requirements(self) -> str:
        """Generate requirements.txt"""
        return '''
asyncio==3.4.3
websocket-client==1.6.0
requests==2.31.0
redis==5.0.0
web3==6.10.0
'''
    
    def _generate_agent_config(self, agent: VMAgent) -> str:
        """Generate agent config"""
        return json.dumps({
            'agent_id': agent.agent_id,
            'wallet_address': agent.wallet_address,
            'strategy': agent.strategy,
            'network': 'base_sepolia',
            'data_endpoint': 'wss://data.soccersouls.xyz/stream',
            'update_interval': 5,
            'risk_params': {
                'max_position': 0.2,
                'stop_loss': 0.1,
                'take_profit': 0.25
            }
        }, indent=2)
    
    def _generate_systemd_service(self, agent: VMAgent) -> str:
        """Generate systemd service file"""
        return f'''[Unit]
Description=Soccer Souls Agent - {agent.agent_id}
After=network.target

[Service]
Type=simple
User={agent.vm_user}
WorkingDirectory=/home/{agent.vm_user}/soccer-souls-agent
Environment=PYTHONPATH=/home/{agent.vm_user}/soccer-souls-agent
Environment=AGENT_ID={agent.agent_id}
ExecStart=/home/{agent.vm_user}/soccer-souls-agent/venv/bin/python agent.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=soccer-souls-agent

[Install]
WantedBy=multi-user.target
'''


class VMFleetProvisioner:
    """
    Provision new VMs for agents
    Supports AWS, GCP, Azure, DigitalOcean
    """
    
    def __init__(self, cloud_provider: str, api_key: str):
        self.provider = cloud_provider
        self.api_key = api_key
    
    def provision_vm(self, region: str = "us-east-1") -> Dict:
        """Provision new VM"""
        if self.provider == "digitalocean":
            return self._provision_digitalocean(region)
        elif self.provider == "aws":
            return self._provision_aws(region)
        elif self.provider == "gcp":
            return self._provision_gcp(region)
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")
    
    def _provision_digitalocean(self, region: str) -> Dict:
        """Provision DigitalOcean droplet"""
        import digitalocean
        
        manager = digitalocean.Manager(token=self.api_key)
        
        # Create droplet
        droplet = digitalocean.Droplet(
            token=self.api_key,
            name=f"soccer-souls-agent-{int(time.time())}",
            region=region,
            image="ubuntu-22-04-x64",
            size_slug="s-1vcpu-1gb",  # $6/month
            ssh_keys=[],
            backups=False
        )
        
        droplet.create()
        
        # Wait for provisioning
        while True:
            actions = droplet.get_actions()
            for action in actions:
                action.load()
                if action.status == "completed":
                    droplet.load()
                    return {
                        'ip': droplet.ip_address,
                        'id': droplet.id,
                        'name': droplet.name
                    }
            time.sleep(10)
    
    def _provision_aws(self, region: str) -> Dict:
        """Provision AWS EC2 instance"""
        import boto3
        
        ec2 = boto3.client('ec2', region_name=region)
        
        response = ec2.run_instances(
            ImageId='ami-0c55b159cbfafe1f0',  # Ubuntu 22.04
            MinCount=1,
            MaxCount=1,
            InstanceType='t3.micro',
            KeyName='soccer-souls-agents'
        )
        
        instance_id = response['Instances'][0]['InstanceId']
        
        # Wait for instance
        waiter = ec2.get_waiter('instance_running')
        waiter.wait(InstanceIds=[instance_id])
        
        # Get IP
        response = ec2.describe_instances(InstanceIds=[instance_id])
        ip = response['Reservations'][0]['Instances'][0]['PublicIpAddress']
        
        return {
            'ip': ip,
            'id': instance_id,
            'name': f"soccer-souls-agent-{instance_id}"
        }
    
    def _provision_gcp(self, region: str) -> Dict:
        """Provision GCP Compute instance"""
        from googleapiclient import discovery
        from oauth2client.client import GoogleCredentials
        
        credentials = GoogleCredentials.get_application_default()
        compute = discovery.build('compute', 'v1', credentials=credentials)
        
        project = 'soccer-souls'
        zone = f"{region}-a"
        
        config = {{
            'name': f"soccer-souls-agent-{int(time.time())}",
            'machineType': f"zones/{zone}/machineTypes/e2-micro",
            'disks': [{{
                'boot': True,
                'initializeParams': {{
                    'sourceImage': 'projects/ubuntu-os-cloud/global/images/ubuntu-2204-jammy-v20231001'
                }}
            }}],
            'networkInterfaces': [{{
                'network': 'global/networks/default',
                'accessConfigs': [{{'type': 'ONE_TO_ONE_NAT', 'name': 'External NAT'}}]
            }}]
        }}
        
        operation = compute.instances().insert(
            project=project,
            zone=zone,
            body=config
        ).execute()
        
        # Wait for completion
        while True:
            result = compute.zoneOperations().get(
                project=project,
                zone=zone,
                operation=operation['name']
            ).execute()
            
            if result['status'] == 'DONE':
                # Get instance details
                instance = compute.instances().get(
                    project=project,
                    zone=zone,
                    instance=config['name']
                ).execute()
                
                ip = instance['networkInterfaces'][0]['accessConfigs'][0]['natIP']
                
                return {{
                    'ip': ip,
                    'id': instance['id'],
                    'name': config['name']
                }}
            
            time.sleep(5)


if __name__ == "__main__":
    # Example usage
    manager = VMAgentManager()
    
    # Add new agent
    agent = VMAgent(
        agent_id="souls_agent_001",
        vm_ip="192.168.1.100",
        vm_user="ubuntu",
        ssh_key_path="~/.ssh/soccer-souls-agents",
        wallet_address="0x1234...",
        strategy="balanced"
    )
    
    manager.agents[agent.agent_id] = agent
    
    # Deploy and start
    if manager.deploy_agent(agent.agent_id):
        manager.start_agent(agent.agent_id)
    
    # Monitor
    manager.monitor_all_agents()
