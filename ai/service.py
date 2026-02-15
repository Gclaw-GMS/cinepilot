"""
CinePilot AI Service
Real AI integrations with OpenAI and Claude
"""
import os
import json
from typing import Optional, Dict, Any, List
from datetime import datetime

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
CLAUDE_API_KEY = os.getenv("ANTHROPIC_API_KEY")

class AIService:
    """AI Service with OpenAI and Claude support"""
    
    def __init__(self):
        self.openai_available = bool(OPENAI_API_KEY)
        self.claude_available = bool(CLAUDE_API_KEY)
    
    async def analyze_script_openai(self, script_content: str, language: str = "tamil") -> Dict[str, Any]:
        """Analyze script using OpenAI GPT-4"""
        if not self.openai_available:
            return {"error": "OpenAI API key not configured", "fallback": "mock"}
        
        try:
            import openai
            client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
            
            prompt = f"""Analyze this {language} film script and provide:
1. Total scenes count
2. Locations identified
3. Characters and their importance
4. Estimated shooting days
5. Budget estimate
6. Genre tags
7. Safety warnings for production
8. Cultural notes

Script:
{script_content[:3000]}...

Provide a detailed JSON response."""
            
            response = await client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[{"role": "system", "content": "You are a film production expert assistant."},
                         {"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2000
            )
            
            result = response.choices[0].message.content
            return {
                "analysis": result,
                "model": "gpt-4-turbo-preview",
                "provider": "openai",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {"error": str(e), "fallback": "mock"}
    
    async def analyze_script_claude(self, script_content: str, language: str = "tamil") -> Dict[str, Any]:
        """Analyze script using Claude"""
        if not self.claude_available:
            return {"error": "Claude API key not configured", "fallback": "mock"}
        
        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=CLAUDE_API_KEY)
            
            prompt = f"""Analyze this {language} film script and provide:
1. Total scenes count
2. Locations identified  
3. Characters and their importance
4. Estimated shooting days
5. Budget estimate
6. Genre tags
7. Safety warnings for production
8. Cultural notes

Script:
{script_content[:3000]}...

Provide a detailed analysis in JSON format."""
            
            response = await client.messages.create(
                model="claude-3-opus-20240229",
                max_tokens=2000,
                system="You are a film production expert assistant specializing in Indian cinema.",
                messages=[{"role": "user", "content": prompt}]
            )
            
            return {
                "analysis": response.content[0].text,
                "model": "claude-3-opus",
                "provider": "claude",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {"error": str(e), "fallback": "mock"}
    
    async def generate_shot_list_ai(self, scene_description: str, style: str = "cinematic") -> Dict[str, Any]:
        """Generate shot list using AI"""
        prompt = f"""Generate a detailed shot list for this scene:

Scene: {scene_description}
Style: {style}

Provide shot suggestions with:
- Shot type (Wide, Medium, Close-up, etc.)
- Camera movement
- Lens recommendation
- Description of what to capture
- Duration estimate"""

        if self.openai_available:
            try:
                import openai
                client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
                
                response = await client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[{"role": "system", "content": "You are a cinematographer expert."},
                             {"role": "user", "content": prompt}],
                    temperature=0.7
                )
                
                return {
                    "shots": response.choices[0].message.content,
                    "model": "gpt-4",
                    "provider": "openai"
                }
            except Exception as e:
                return {"error": str(e)}
        
        return {"error": "No AI provider available"}
    
    async def optimize_schedule_ai(self, scenes: List[Dict], locations: List[Dict], 
                                   constraints: Dict = None) -> Dict[str, Any]:
        """AI-powered schedule optimization"""
        prompt = f"""Optimize this shooting schedule:

Scenes: {json.dumps(scenes[:20])}
Locations: {json.dumps(locations)}
Constraints: {json.dumps(constraints or {})}

Group scenes by location to minimize company moves.
Consider:
- Time of day (day/night scenes)
- Cast availability
- Equipment needs
- Weather contingencies

Provide an optimized schedule with day-by-day breakdown."""
        
        if self.openai_available:
            try:
                import openai
                client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
                
                response = await client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[{"role": "system", "content": "You are a film production scheduler expert."},
                             {"role": "user", "content": prompt}],
                    temperature=0.5
                )
                
                return {
                    "schedule": response.choices[0].message.content,
                    "model": "gpt-4",
                    "provider": "openai"
                }
            except Exception as e:
                return {"error": str(e)}
        
        return {"error": "No AI provider available"}
    
    async def generate_callsheet_ai(self, schedule: Dict, project_info: Dict,
                                    weather: str = None) -> Dict[str, Any]:
        """Generate AI-enhanced call sheet"""
        prompt = f"""Generate a detailed call sheet for:

Project: {project_info.get('name')}
Date: {schedule.get('date')}
Weather: {weather or 'TBD'}

Schedule: {json.dumps(schedule)}

Include:
- Call times for all departments
- Important notes
- Safety reminders
- Contact numbers
- Location details with directions"""

        if self.openai_available:
            try:
                import openai
                client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
                
                response = await client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[{"role": "system", "content": "You are a film production coordinator expert."},
                             {"role": "user", "content": prompt}],
                    temperature=0.5
                )
                
                return {
                    "callsheet": response.choices[0].message.content,
                    "model": "gpt-4",
                    "provider": "openai"
                }
            except Exception as e:
                return {"error": str(e)}
        
        return {"error": "No AI provider available"}


# Singleton instance
ai_service = AIService()

# ==================== SCRIPT PARSING SERVICE ====================

class ScriptParser:
    """Parse screenplay/script files"""
    
    @staticmethod
    def parse_fountain(text: str) -> Dict[str, Any]:
        """Parse Fountain format screenplay"""
        scenes = []
        characters = set()
        locations = {}
        
        lines = text.split('\n')
        current_scene = None
        
        for line in lines:
            line = line.strip()
            
            # Scene heading
            if line.startswith(('INT.', 'EXT.', 'INT/EXT.', 'I/E.')):
                if current_scene:
                    scenes.append(current_scene)
                current_scene = {
                    'heading': line,
                    'location': line.split('.')[1].strip() if '.' in line else '',
                    'time': 'DAY' if 'DAY' in line else 'NIGHT' if 'NIGHT' in line else 'CONTINUOUS',
                    'int_ext': 'INT' if 'INT' in line else 'EXT',
                    'action': '',
                    'dialogue': []
                }
                if current_scene['location']:
                    locations[current_scene['location']] = locations.get(current_scene['location'], 0) + 1
            
            # Character
            elif line.isupper() and len(line) < 40 and not line.startswith('('):
                characters.add(line)
                if current_scene:
                    current_scene['dialogue'].append({'speaker': line, 'lines': []})
            
            # Action
            elif current_scene and line:
                if current_scene['dialogue']:
                    current_scene['dialogue'][-1]['lines'].append(line)
                else:
                    current_scene['action'] += ' ' + line
        
        if current_scene:
            scenes.append(current_scene)
        
        return {
            'scenes': scenes,
            'characters': list(characters),
            'locations': locations,
            'total_scenes': len(scenes),
            'total_characters': len(characters)
        }
    
    @staticmethod
    def parse_simple_text(text: str) -> Dict[str, Any]:
        """Parse simple text script"""
        scenes = []
        current_scene = None
        
        lines = text.split('\n')
        scene_count = 0
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Detect scene headers (SCENE X, Scene #1, etc.)
            if line.upper().startswith(('SCENE', 'SEQ', 'SHOT')):
                if current_scene:
                    scenes.append(current_scene)
                scene_count += 1
                current_scene = {
                    'number': scene_count,
                    'heading': line,
                    'description': ''
                }
            elif current_scene:
                current_scene['description'] += ' ' + line
        
        if current_scene:
            scenes.append(current_scene)
        
        # Extract potential locations
        location_keywords = ['LOCATION', 'AT', 'IN', 'ON']
        locations = {}
        for scene in scenes:
            for keyword in location_keywords:
                if keyword in scene['heading'].upper():
                    loc = scene['heading'].upper().replace(keyword, '').strip()
                    if loc:
                        locations[loc] = locations.get(loc, 0) + 1
        
        return {
            'scenes': scenes,
            'locations': locations,
            'total_scenes': len(scenes)
        }


script_parser = ScriptParser()

# ==================== NOTIFICATION SERVICE ====================

class NotificationService:
    """Unified notification service"""
    
    def __init__(self):
        self.whatsapp_available = self._check_wacli()
        self.email_available = bool(os.getenv("SMTP_HOST"))
    
    def _check_wacli(self) -> bool:
        """Check if wacli is available"""
        import shutil
        return shutil.which("wacli") is not None
    
    async def send_whatsapp(self, to: str, message: str, project: str = None) -> Dict[str, Any]:
        """Send WhatsApp message"""
        if not self.whatsapp_available:
            return {"success": False, "error": "wacli not installed"}
        
        import subprocess
        
        full_message = f"🎬 *CinePilot*" + (f" - {project}" if project else "") + f"\n\n{message}"
        
        try:
            result = subprocess.run(
                ["wacli", "send", "text", "--to", to, "--message", full_message],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            return {
                "success": result.returncode == 0,
                "provider": "whatsapp",
                "to": to,
                "output": result.stdout
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def send_email(self, to: str, subject: str, body: str,
                         html: bool = False) -> Dict[str, Any]:
        """Send email notification"""
        if not self.email_available:
            return {"success": False, "error": "Email not configured"}
        
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            smtp_host = os.getenv("SMTP_HOST")
            smtp_port = int(os.getenv("SMTP_PORT", "587"))
            smtp_user = os.getenv("SMTP_USER")
            smtp_pass = os.getenv("SMTP_PASS")
            
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = smtp_user
            msg['To'] = to
            
            if html:
                msg.attach(MIMEText(body, 'html'))
            else:
                msg.attach(MIMEText(body, 'plain'))
            
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
            
            return {"success": True, "provider": "email", "to": to}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def send_batch(self, notifications: List[Dict], method: str = "whatsapp") -> Dict[str, Any]:
        """Send batch notifications"""
        results = []
        
        for notif in notifications:
            if method == "whatsapp":
                result = await self.send_whatsapp(
                    notif.get("to"), 
                    notif.get("message"),
                    notif.get("project")
                )
            elif method == "email":
                result = await self.send_email(
                    notif.get("to"),
                    notif.get("subject", "CinePilot Update"),
                    notif.get("message")
                )
            else:
                result = {"success": False, "error": "Unknown method"}
            
            results.append(result)
        
        success_count = sum(1 for r in results if r.get("success"))
        
        return {
            "total": len(notifications),
            "success": success_count,
            "failed": len(notifications) - success_count,
            "results": results
        }


notification_service = NotificationService()
