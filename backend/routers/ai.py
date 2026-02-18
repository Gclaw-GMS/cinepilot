"""
AI Features Router for CinePilot
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import re

router = APIRouter(prefix="/ai", tags=["AI"])

# Models
class ScriptAnalysisRequest(BaseModel):
    text: str

class BudgetForecastRequest(BaseModel):
    scene_count: int
    location_count: int
    cast_size: int
    duration_days: int
    is_outdoor: bool = False
    is_night_shoots: bool = False

class ScheduleOptimizationRequest(BaseModel):
    scenes: List[dict]
    locations: List[dict]
    cast_availability: List[dict]

class RiskDetectionRequest(BaseModel):
    budget: float
    schedule_days: int
    cast_size: int
    location_count: int
    is_monsoon: bool = False
    is_night_shoots: bool = False

# Script Analysis
@router.post("/script-analyze")
async def analyze_script(request: ScriptAnalysisRequest):
    text = request.text
    
    # Extract scenes
    int_scenes = len(re.findall(r'INT\.', text.upper()))
    ext_scenes = len(re.findall(r'EXT\.', text.upper()))
    
    # Extract locations (after INT./EXT.)
    locations = set(re.findall(r'(?:INT\.|EXT\.)\s+([A-Z\s]+?)(?:\s*-\s*|\s+[A-Z])', text.upper()))
    
    # Extract characters (names in all caps before dialogue)
    characters = set(re.findall(r'^([A-Z][A-Z\s]{2,20})\s*$', text, re.MULTILINE))
    
    # Calculate complexity score
    dialogue_count = len(re.findall(r'^[A-Z]', text, re.MULTILINE))
    scene_count = int_scenes + ext_scenes
    
    complexity = min(10, (dialogue_count / max(scene_count, 1)) * 2 + (len(locations) * 0.3))
    
    return {
        "complexity_score": round(complexity, 1),
        "total_scenes": scene_count,
        "int_scenes": int_scenes,
        "ext_scenes": ext_scenes,
        "locations": list(locations)[:20],
        "characters": list(characters)[:30],
        "dialogue_count": dialogue_count,
        "estimated_pages": round(scene_count / 2),
    }

# Budget Forecast
@router.post("/budget-forecast")
async def forecast_budget(request: BudgetForecastRequest):
    base_per_scene = 500000  # Base cost per scene
    
    # Calculate base budget
    budget = request.scene_count * base_per_scene
    
    # Location multiplier
    budget += request.location_count * 1500000
    
    # Cast multiplier
    budget += request.cast_size * 800000
    
    # Duration factor
    budget *= (1 + request.duration_days * 0.05)
    
    # Risk factors
    if request.is_outdoor:
        budget *= 1.15
    if request.is_night_shoots:
        budget *= 1.1
    
    # Breakdown
    breakdown = {
        "Locations": int(budget * 0.27),
        "Equipment": int(budget * 0.18),
        "Crew": int(budget * 0.30),
        "Post-Production": int(budget * 0.15),
        "Contingency": int(budget * 0.10),
    }
    
    return {
        "total_budget": int(budget),
        "breakdown": breakdown,
        "risk_factors": [
            "Monsoon season" if request.is_monsoon else None,
            "Night shoots" if request.is_night_shoots else None,
            "Multiple locations" if request.location_count > 5 else None,
        ],
        "potential_savings": int(budget * 0.05),
    }

# Schedule Optimization
@router.post("/optimize-schedule")
async def optimize_schedule(request: ScheduleOptimizationRequest):
    # Group scenes by location
    location_groups = {}
    for scene in request.scenes:
        loc = scene.get("location", "Unknown")
        if loc not in location_groups:
            location_groups[loc] = []
        location_groups[loc].append(scene)
    
    # Create optimized schedule
    schedule = []
    day = 1
    for location, scenes in location_groups.items():
        schedule.append({
            "day": day,
            "location": location,
            "scenes": len(scenes),
            "estimated_hours": len(scenes) * 3
        })
        day += 1
    
    return {
        "optimized_schedule": schedule,
        "total_days": len(schedule),
        "efficiency_score": 85,
    }

# Risk Detection
@router.post("/risk-detect")
async def detect_risks(request: RiskDetectionRequest):
    risk_score = 0
    factors = []
    mitigations = []
    
    # Budget-based risk
    if request.budget < request.schedule_days * 1000000:
        risk_score += 3
        factors.append("Low budget for schedule duration")
        mitigations("Consider extending schedule or reducing cast")
    
    # Schedule risk
    if request.schedule_days > 30 and request.cast_size > 10:
        risk_score += 2
        factors.append("Large cast with extended schedule")
        mitigations("Pre-plan batch shooting for common cast")
    
    # Location risk
    if request.location_count > 10:
        risk_score += 2
        factors.append("Multiple locations increase complexity")
        mitigations("Group nearby locations together")
    
    # Weather risk
    if request.is_monsoon:
        risk_score += 3
        factors.append("Monsoon season filming")
        mitigations("Schedule indoor shots during monsoon weeks")
    
    if request.is_night_shoots:
        risk_score += 1
        factors.append("Night shoots increase budget")
    
    return {
        "risk_score": min(10, risk_score),
        "risk_level": "High" if risk_score > 7 else "Medium" if risk_score > 4 else "Low",
        "factors": [f for f in factors if f],
        "mitigations": [m for m in mitigations if m],
    }

# Shot Recommendation
@router.post("/shot-suggest")
async def suggest_shots(scene_description: str, emotion: str = "neutral"):
    # Rule-based shot suggestions
    suggestions = []
    
    # Based on emotion
    emotion_shots = {
        "tension": ["Close-Up", "Dutch Angle", "Low Angle"],
        "romance": ["Wide Shot", "Two Shot", "Soft Focus"],
        "action": ["Tracking Shot", "POV", "Handheld"],
        "comedy": ["Wide Shot", "Over the Shoulder"],
        "sad": ["Extreme Close-Up", "High Angle"],
    }
    
    if emotion in emotion_shots:
        suggestions.extend(emotion_shots[emotion])
    else:
        suggestions = ["Medium Shot", "Close-Up", "Wide Shot"]
    
    return {
        "suggested_shots": suggestions,
        "camera_movement": "Static" if emotion == "romance" else "Dynamic",
        "lens_recommendation": "85mm" if emotion == "romance" else "35mm",
        "lighting_mood": "Soft" if emotion == "romance" else "Dramatic"
    }
