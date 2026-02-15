# CinePilot AI Analysis Service
import os
import json
import re
from typing import Dict, List, Optional, Any
from datetime import datetime

class ScriptAnalysisService:
    """Enhanced script analysis with multiple analysis types"""
    
    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        self.tamil_numbers = {
            '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
            '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
        }
    
    def to_tamil_subscript(self, num: int) -> str:
        """Convert number to Tamil subscript format"""
        return ''.join(self.tamil_numbers.get(d, d) for d in str(num))
    
    def analyze_dialogue(self, content: str) -> Dict[str, Any]:
        """Analyze dialogue patterns and statistics"""
        lines = content.split('\n')
        dialogue_by_char = {}
        total_dialogue_lines = 0
        total_words = 0
        
        current_char = None
        
        for line in lines:
            line = line.strip()
            
            # Detect character speaking
            char_match = re.match(r'^([A-Z][A-Z\s\.\-\']+)\s*\(', line)
            if char_match:
                current_char = char_match.group(1).strip()
                if current_char not in dialogue_by_char:
                    dialogue_by_char[current_char] = {
                        'lines': 0,
                        'words': 0,
                        'scenes': set()
                    }
            
            # Detect dialogue (regular text after character)
            elif current_char and line and not line.startswith('(') and len(line) > 0:
                # This is dialogue
                dialogue_by_char[current_char]['lines'] += 1
                dialogue_by_char[current_char]['words'] += len(line.split())
                total_dialogue_lines += 1
                total_words += len(line.split())
        
        # Convert sets to lists for JSON
        for char_data in dialogue_by_char.values():
            char_data['scenes'] = list(char_data['scenes'])
        
        # Find top speakers
        top_speakers = sorted(
            dialogue_by_char.items(),
            key=lambda x: x[1]['words'],
            reverse=True
        )[:10]
        
        return {
            'total_dialogue_lines': total_dialogue_lines,
            'total_words': total_words,
            'avg_words_per_line': total_words // max(total_dialogue_lines, 1),
            'unique_speakers': len(dialogue_by_char),
            'top_speakers': [
                {
                    'character': char,
                    'lines': data['lines'],
                    'words': data['words'],
                    'avg_words': data['words'] // max(data['lines'], 1)
                }
                for char, data in top_speakers
            ],
            'dialogue_by_character': dialogue_by_char
        }
    
    def analyze_emotional_arc(self, content: str) -> Dict[str, Any]:
        """Analyze emotional beats and arc throughout the script"""
        lines = content.split('\n')
        
        emotional_markers = {
            'happy': ['happy', 'laugh', 'joy', 'celebrate', 'smile', 'excited', 'love'],
            'sad': ['cry', 'tears', 'sad', 'grief', 'mourn', 'lose', 'death', 'die'],
            'angry': ['angry', 'furious', 'rage', 'shout', 'fight', 'hate'],
            'tense': ['suspense', 'fear', 'worry', 'nervous', 'danger', 'threat'],
            'romantic': ['love', 'kiss', 'romance', 'heart', 'feelings', 'miss']
        }
        
        emotional_scenes = []
        current_scene = None
        
        for i, line in enumerate(lines):
            line_lower = line.lower().strip()
            
            # Track scene
            if re.match(r'^(INT\.|EXT\.)\s*', line, re.IGNORECASE):
                if current_scene:
                    emotional_scenes.append(current_scene)
                current_scene = {
                    'scene_num': len(emotional_scenes) + 1,
                    'heading': line,
                    'emotions': []
                }
            
            # Check for emotional content
            if current_scene:
                for emotion, keywords in emotional_markers.items():
                    if any(kw in line_lower for kw in keywords):
                        current_scene['emotions'].append({
                            'type': emotion,
                            'line_preview': line[:80],
                            'line_num': i + 1
                        })
        
        if current_scene:
            emotional_scenes.append(current_scene)
        
        # Count emotional beats
        emotion_counts = {}
        for scene in emotional_scenes:
            for emotion in scene['emotions']:
                emotion_counts[emotion['type']] = emotion_counts.get(emotion['type'], 0) + 1
        
        return {
            'emotional_scenes': emotional_scenes[:30],  # Limit response size
            'emotion_counts': emotion_counts,
            'total_emotional_beats': sum(emotion_counts.values()),
            'dominant_emotion': max(emotion_counts.items(), key=lambda x: x[1])[0] if emotion_counts else None
        }
    
    def suggest_shot_types(self, scene_heading: str, characters: List[str], content: str) -> List[Dict[str, Any]]:
        """Suggest shot types for a scene"""
        shots = []
        
        heading_lower = scene_heading.lower()
        char_count = len(characters)
        
        # Opening shot
        shots.append({
            'shot_type': 'Establishing Shot',
            'description': f"Wide shot to establish {scene_heading}",
            'camera': 'Wide or Aerial',
            'movement': 'Dolly out / Static'
        })
        
        # Character coverage
        if char_count == 0:
            shots.append({
                'shot_type': 'Environmental',
                'description': 'Panning shot of location',
                'camera': 'Medium Wide',
                'movement': 'Pan / Slow move'
            })
        elif char_count == 1:
            shots.extend([
                {
                    'shot_type': 'Medium Close-Up',
                    'description': f"Single on {characters[0]}",
                    'camera': 'MCU',
                    'movement': 'Static or subtle push'
                },
                {
                    'shot_type': 'Over the Shoulder',
                    'description': 'Reaction setup',
                    'camera': 'Medium',
                    'movement': 'Cut to POV'
                }
            ])
        elif char_count == 2:
            shots.extend([
                {
                    'shot_type': 'Two-Shot',
                    'description': f"Both {characters[0]} and {characters[1]}",
                    'camera': 'Medium',
                    'movement': 'Static'
                },
                {
                    'shot_type': 'Single - A',
                    'description': f"{characters[0]} reaction",
                    'camera': 'Medium Close-Up',
                    'movement': 'Cut'
                },
                {
                    'shot_type': 'Single - B',
                    'description': f"{characters[1]} reaction",
                    'camera': 'Medium Close-Up',
                    'movement': 'Cut'
                }
            ])
        else:
            shots.extend([
                {
                    'shot_type': 'Group Shot',
                    'description': f"All {char_count} characters",
                    'camera': 'Wide',
                    'movement': 'Static'
                },
                {
                    'shot_type': 'Cross Coverage',
                    'description': 'Individual close-ups',
                    'camera': 'MCU',
                    'movement': 'Cut between'
                }
            ])
        
        # Scene-specific shots
        if any(w in heading_lower for w in ['action', 'fight', 'chase']):
            shots.append({
                'shot_type': 'Action Coverage',
                'description': 'Dynamic action shots',
                'camera': 'Various',
                'movement': 'Handheld, rapid cuts'
            })
        
        if any(w in heading_lower for w in ['emotional', 'cry', 'death']):
            shots.append({
                'shot_type': 'Emotional Beat',
                'description': 'Close-up on emotion',
                'camera': 'Close-Up',
                'movement': 'Push in slowly'
            })
        
        # Closing shot
        shots.append({
            'shot_type': 'Closing Shot',
            'description': 'Final beat or transition',
            'camera': 'Wide/Close',
            'movement': 'Pull out or cut'
        })
        
        return shots
    
    def basic_analysis(self, content: str, language: str = "tamil") -> Dict[str, Any]:
        """Basic script analysis without AI"""
        lines = content.split('\n')
        scenes = []
        characters = set()
        locations = set()
        
        current_scene = None
        for line in lines:
            line = line.strip()
            
            # Detect scene headings
            if re.match(r'^(INT\.|EXT\.|INT/EXT\.|INT\/EXT\.)\s*', line, re.IGNORECASE):
                if current_scene:
                    scenes.append(current_scene)
                current_scene = {
                    "heading": line,
                    "location": "",
                    "time_of_day": "",
                    "characters": []
                }
                # Extract location
                loc_match = re.match(r'^(INT\.|EXT\.|INT/EXT\.)\s*(.+?)(?:\s*[-–]\s*(.+))?$', line, re.IGNORECASE)
                if loc_match:
                    current_scene["location"] = loc_match.group(2).strip()
                    if loc_match.group(3):
                        current_scene["time_of_day"] = loc_match.group(3).strip()
                    locations.add(loc_match.group(2).strip())
            
            # Detect characters (lines with NAME:)
            char_match = re.match(r'^([A-Z][A-Z\s\.\-\']+)\s*\(', line)
            if char_match:
                char_name = char_match.group(1).strip()
                characters.add(char_name)
                if current_scene:
                    current_scene["characters"].append(char_name)
        
        if current_scene:
            scenes.append(current_scene)
        
        # Count night vs day scenes
        night_scenes = sum(1 for s in scenes if any(t in s.get("time_of_day", "").lower() for t in ["night", "evening", "dark"]))
        day_scenes = sum(1 for s in scenes if any(t in s.get("time_of_day", "").lower() for t in ["day", "morning", "sunrise", "sunset"]))
        
        return {
            "success": True,
            "analysis_type": "basic",
            "language": language,
            "timestamp": datetime.now().isoformat(),
            "basic": {
                "scene_count": len(scenes),
                "page_count": len(lines) / 50,  # Approximate
                "character_count": len(characters),
                "location_count": len(locations),
                "int_scenes": sum(1 for s in scenes if s.get("heading", "").upper().startswith("INT")),
                "ext_scenes": sum(1 for s in scenes if s.get("heading", "").upper().startswith("EXT")),
                "day_scenes": day_scenes,
                "night_scenes": night_scenes,
            },
            "characters": sorted(list(characters)),
            "locations": sorted(list(locations)),
            "scenes": scenes[:50],  # Limit for response size
        }
    
    def advanced_analysis(self, content: str, language: str = "tamil") -> Dict[str, Any]:
        """Advanced analysis with genre detection and complexity scoring"""
        basic = self.basic_analysis(content, language)
        
        # Detect potential genres based on content
        genres = []
        content_lower = content.lower()
        
        if any(w in content_lower for w in ["love", "romance", "kiss", "heart", "feelings"]):
            genres.append("romance")
        if any(w in content_lower for w in ["fight", "action", "battle", "chase", "explosion"]):
            genres.append("action")
        if any(w in content_lower for w in ["murder", "death", "killer", "investigation", "mystery"]):
            genres.append("thriller")
        if any(w in content_lower for w in ["comedy", "funny", "laugh", "joke", "humor"]):
            genres.append("comedy")
        if any(w in content_lower for w in ["family", "emotional", "cry", "tears", "emotions"]):
            genres.append("family drama")
        if any(w in content_lower for w in ["song", "dance", "music", "musical"]):
            genres.append("musical")
        
        # Calculate complexity score
        complexity_factors = {
            "scene_variety": min(basic["basic"]["scene_count"] / 50, 1.0),
            "location_spread": min(basic["basic"]["location_count"] / 20, 1.0),
            "cast_size": min(basic["basic"]["character_count"] / 30, 1.0),
            "night_shoots": basic["basic"]["night_scenes"] / max(basic["basic"]["scene_count"], 1),
        }
        
        complexity_score = sum(complexity_factors.values()) / len(complexity_factors)
        
        # Estimate budget based on complexity
        base_budget = 1000000  # 10L INR
        budget_multiplier = 1 + complexity_score
        estimated_budget = int(base_budget * budget_multiplier * (basic["basic"]["scene_count"] / 30))
        
        # Estimate shooting days
        base_days = 20
        estimated_days = int(base_days * (basic["basic"]["scene_count"] / 30) * (1 + complexity_score * 0.3))
        
        # Identify risk factors
        risk_factors = []
        if basic["basic"]["night_scenes"] > basic["basic"]["scene_count"] * 0.3:
            risk_factors.append({
                "factor": "High night shoot percentage",
                "risk_level": "medium",
                "mitigation": "Plan for additional lighting equipment and night permits"
            })
        if basic["basic"]["ext_scenes"] > basic["basic"]["scene_count"] * 0.5:
            risk_factors.append({
                "factor": "Many outdoor scenes",
                "risk_level": "medium",
                "mitigation": "Weather contingency planning required"
            })
        if estimated_days > 40:
            risk_factors.append({
                "factor": "Extended shooting schedule",
                "risk_level": "high",
                "mitigation": "Consider splitting into units or rescheduling"
            })
        
        return {
            **basic,
            "analysis_type": "advanced",
            "genres": genres,
            "complexity": {
                "score": round(complexity_score * 100, 1),
                "rating": "High" if complexity_score > 0.7 else "Medium" if complexity_score > 0.4 else "Low",
                "factors": complexity_factors
            },
            "estimates": {
                "budget": estimated_budget,
                "budget_formatted": f"₹{estimated_budget:,.0f}",
                "shooting_days": estimated_days,
                "budget_per_day": estimated_budget // max(estimated_days, 1)
            },
            "risk_factors": risk_factors,
            "production_tips": self._generate_production_tips(basic, genres)
        }
    
    def _generate_production_tips(self, basic: Dict, genres: List[str]) -> List[str]:
        """Generate production recommendations"""
        tips = []
        
        if basic["basic"]["night_scenes"] > 0:
            tips.append(f"📸 Plan for {basic['basic']['night_scenes']} night shoots - arrange lighting equipment")
        
        if basic["basic"]["ext_scenes"] > basic["basic"]["int_scenes"]:
            tips.append("🏝️ Many outdoor scenes - check weather and get location permits early")
        
        if basic["basic"]["location_count"] > 10:
            tips.append(f"📍 {basic['basic']['location_count']} locations - consider clustering for efficiency")
        
        if basic["basic"]["character_count"] > 15:
            tips.append(f"👥 Large cast ({basic['basic']['character_count']} characters) - schedule coordination will be key")
        
        if "musical" in genres:
            tips.append("🎵 Musical sequences detected - plan for playback and choreography rehearsal time")
        
        if "action" in genres:
            tips.append("💥 Action sequences - coordinate with stunt team and safety officer early")
        
        return tips

class ScheduleOptimizationService:
    """Schedule optimization and recommendations"""
    
    def optimize(self, scenes: List[Dict], locations: List[Dict], days: int) -> Dict[str, Any]:
        """Optimize shooting schedule"""
        
        # Group scenes by location
        location_groups = {}
        for scene in scenes:
            loc = scene.get("location", "Unknown")
            if loc not in location_groups:
                location_groups[loc] = []
            location_groups[loc].append(scene)
        
        # Calculate optimal days per location
        total_scenes = len(scenes)
        scenes_per_day = total_scenes / max(days, 1)
        
        return {
            "total_scenes": total_scenes,
            "shooting_days": days,
            "scenes_per_day": round(scenes_per_day, 1),
            "location_days": {loc: max(1, len(scenes_list) // max(1, int(scenes_per_day))) 
                             for loc, scenes_list in location_groups.items()},
            "recommendations": [
                "Group scenes by location to minimize travel",
                "Schedule night shoots on consecutive days",
                "Allow buffer days for weather contingencies",
                "Plan complex setups (action/vfx) early in the schedule"
            ]
        }

# Create singleton instances
script_analyzer = ScriptAnalysisService()
schedule_optimizer = ScheduleOptimizationService()
