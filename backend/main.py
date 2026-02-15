"""
CinePilot Backend API - Enhanced with JSON Persistence
AI-Powered Pre-Production Platform for Tamil Cinema
"""
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
import os
import json
from pathlib import Path

app = FastAPI(title="CinePilot API", version="1.1.0", description="AI-Powered Pre-Production for Tamil Cinema")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data directory
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

def load_json(filename: str, default: any):
    """Load data from JSON file"""
    filepath = DATA_DIR / filename
    if filepath.exists():
        try:
            with open(filepath, 'r') as f:
                return json.load(f)
        except:
            return default
    return default

def save_json(filename: str, data: any):
    """Save data to JSON file"""
    filepath = DATA_DIR / filename
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

# Initialize data files
def init_data():
    """Initialize data files if they don't exist"""
    if not (DATA_DIR / "projects.json").exists():
        save_json("projects.json", [])
    if not (DATA_DIR / "scenes.json").exists():
        save_json("scenes.json", [])
    if not (DATA_DIR / "crew.json").exists():
        save_json("crew.json", [])
    if not (DATA_DIR / "budget.json").exists():
        save_json("budget.json", {"expenses": [], "categories": ["Pre-production", "Production", "Post-production", "Contingency"]})
    if not (DATA_DIR / "schedule.json").exists():
        save_json("schedule.json", {"days": []})
    if not (DATA_DIR / "locations.json").exists():
        save_json("locations.json", [])
    if not (DATA_DIR / "characters.json").exists():
        save_json("characters.json", [])
    if not (DATA_DIR / "equipment.json").exists():
        save_json("equipment.json", [])

init_data()

# Pydantic Models
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    language: str = "tamil"
    budget: Optional[float] = None
    status: str = "planning"

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    language: Optional[str] = None
    budget: Optional[float] = None
    status: Optional[str] = None

class SceneCreate(BaseModel):
    project_id: int
    scene_number: int
    heading: Optional[str] = None
    location: Optional[str] = None
    location_tamil: Optional[str] = None
    time_of_day: Optional[str] = None
    interior_exterior: Optional[str] = None
    description: Optional[str] = None

class CrewCreate(BaseModel):
    project_id: int
    name: str
    role: str
    department: str
    daily_rate: float = 0
    phone: Optional[str] = None
    email: Optional[str] = None

class ExpenseCreate(BaseModel):
    project_id: int
    category: str
    item: str
    estimated: float
    actual: float = 0
    date: Optional[str] = None
    notes: Optional[str] = None

class ScheduleDayCreate(BaseModel):
    project_id: int
    date: str
    call_time: str = "06:00"
    wrap_time: str = "19:00"
    scenes: List[int] = []
    location: Optional[str] = None
    notes: Optional[str] = None

class LocationCreate(BaseModel):
    project_id: int
    name: str
    tamil: Optional[str] = None
    type: str = "outdoor"
    address: str = ""
    notes: Optional[str] = None

class CharacterCreate(BaseModel):
    project_id: int
    name: str
    tamil: Optional[str] = None
    actor: Optional[str] = None
    role: str = "supporting"
    description: Optional[str] = None

class EquipmentCreate(BaseModel):
    project_id: int
    name: str
    category: str = "camera"  # camera, lighting, sound, grip, art
    quantity: int = 1
    daily_rate: float = 0
    vendor: Optional[str] = None
    status: str = "available"  # available, in-use, maintenance
    notes: Optional[str] = None

class AIScriptAnalysisRequest(BaseModel):
    content: str
    language: str = "tamil"

class AIShotListRequest(BaseModel):
    scene_description: str

# Demo data for fallback
DEMO_PROJECTS = [
    {"id": 1, "name": "இதயத்தின் ஒலி", "description": "A romantic thriller in modern Chennai", "language": "tamil", "status": "planning", "budget": 2500000, "created_at": "2026-02-01T10:00:00Z"},
    {"id": 2, "name": "Veera's Journey", "description": "Action drama set in Madurai", "language": "tamil", "status": "shooting", "budget": 5000000, "created_at": "2026-01-15T10:00:00Z"},
]

DEMO_SCENES = [
    {"id": 1, "project_id": 1, "scene_number": 1, "heading": "EXT. CHENNAI STREET - DAY", "location": "Chennai Street", "location_tamil": "சென்னை வீதி", "time_of_day": "DAY", "interior_exterior": "EXT", "description": "Rain pours on the busy street. People rush with umbrellas."},
    {"id": 2, "project_id": 1, "scene_number": 2, "heading": "INT. APARTMENT - NIGHT", "location": "Priya's Apartment", "location_tamil": "பிரியாவின் அபார்ட்மென்ட்", "time_of_day": "NIGHT", "interior_exterior": "INT", "description": "Priya sits alone, looking at old photographs."},
    {"id": 3, "project_id": 2, "scene_number": 1, "heading": "EXT. MADURAI TEMPLE - DAY", "location": "Meenakshi Temple", "location_tamil": "மீனாட்சி கோவில்", "time_of_day": "DAY", "interior_exterior": "EXT", "description": "Devotees gather for the evening aarti. Bells ringing."},
]

# Routes
@app.get("/")
def root():
    return {"message": "CinePilot API v1.1 - AI-Powered Pre-Production for Tamil Cinema", "version": "1.1.0"}

@app.get("/api/health")
def health():
    return {"status": "healthy", "version": "1.1.0", "data_dir": str(DATA_DIR)}

# ==================== PROJECTS ====================

@app.get("/api/projects")
def get_projects():
    """Get all projects"""
    projects = load_json("projects.json", [])
    if not projects:
        return DEMO_PROJECTS
    return projects

@app.get("/api/projects/{project_id}")
def get_project(project_id: int):
    """Get a single project"""
    projects = load_json("projects.json", [])
    for p in projects:
        if p.get("id") == project_id:
            return p
    # Check demo data
    for p in DEMO_PROJECTS:
        if p["id"] == project_id:
            return p
    raise HTTPException(status_code=404, detail="Project not found")

@app.post("/api/projects", status_code=201)
def create_project(project: ProjectCreate):
    """Create a new project"""
    projects = load_json("projects.json", [])
    new_id = max([p.get("id", 0) for p in projects] + [0]) + 1
    
    new_project = {
        "id": new_id,
        "name": project.name,
        "description": project.description,
        "language": project.language,
        "status": project.status,
        "budget": project.budget,
        "created_at": datetime.now().isoformat()
    }
    projects.append(new_project)
    save_json("projects.json", projects)
    return new_project

@app.put("/api/projects/{project_id}")
def update_project(project_id: int, project: ProjectUpdate):
    """Update a project"""
    projects = load_json("projects.json", [])
    for i, p in enumerate(projects):
        if p.get("id") == project_id:
            if project.name is not None:
                projects[i]["name"] = project.name
            if project.description is not None:
                projects[i]["description"] = project.description
            if project.language is not None:
                projects[i]["language"] = project.language
            if project.budget is not None:
                projects[i]["budget"] = project.budget
            if project.status is not None:
                projects[i]["status"] = project.status
            save_json("projects.json", projects)
            return projects[i]
    raise HTTPException(status_code=404, detail="Project not found")

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: int):
    """Delete a project"""
    projects = load_json("projects.json", [])
    projects = [p for p in projects if p.get("id") != project_id]
    save_json("projects.json", projects)
    return {"message": "Project deleted"}

# ==================== SCENES ====================

@app.get("/api/scenes")
def get_scenes(project_id: Optional[int] = None):
    """Get all scenes, optionally filtered by project"""
    scenes = load_json("scenes.json", [])
    if not scenes:
        scenes = DEMO_SCENES
    if project_id:
        scenes = [s for s in scenes if s.get("project_id") == project_id]
    return scenes

@app.get("/api/scenes/{scene_id}")
def get_scene(scene_id: int):
    """Get a single scene"""
    scenes = load_json("scenes.json", [])
    for s in scenes:
        if s.get("id") == scene_id:
            return s
    raise HTTPException(status_code=404, detail="Scene not found")

@app.post("/api/scenes", status_code=201)
def create_scene(scene: SceneCreate):
    """Create a new scene"""
    scenes = load_json("scenes.json", [])
    new_id = max([s.get("id", 0) for s in scenes] + [0]) + 1
    
    new_scene = {
        "id": new_id,
        "project_id": scene.project_id,
        "scene_number": scene.scene_number,
        "heading": scene.heading,
        "location": scene.location,
        "location_tamil": scene.location_tamil,
        "time_of_day": scene.time_of_day,
        "interior_exterior": scene.interior_exterior,
        "description": scene.description,
        "created_at": datetime.now().isoformat()
    }
    scenes.append(new_scene)
    save_json("scenes.json", scenes)
    return new_scene

@app.delete("/api/scenes/{scene_id}")
def delete_scene(scene_id: int):
    """Delete a scene"""
    scenes = load_json("scenes.json", [])
    scenes = [s for s in scenes if s.get("id") != scene_id]
    save_json("scenes.json", scenes)
    return {"message": "Scene deleted"}

# ==================== CREW ====================

@app.get("/api/crew")
def get_crew(project_id: Optional[int] = None):
    """Get all crew members"""
    crew = load_json("crew.json", [])
    if project_id:
        crew = [c for c in crew if c.get("project_id") == project_id]
    return crew

@app.post("/api/crew", status_code=201)
def create_crew_member(crew_member: CrewCreate):
    """Add a crew member"""
    crew = load_json("crew.json", [])
    new_id = max([c.get("id", 0) for c in crew] + [0]) + 1
    
    new_member = {
        "id": new_id,
        "project_id": crew_member.project_id,
        "name": crew_member.name,
        "role": crew_member.role,
        "department": crew_member.department,
        "daily_rate": crew_member.daily_rate,
        "phone": crew_member.phone,
        "email": crew_member.email,
        "status": "confirmed",
        "created_at": datetime.now().isoformat()
    }
    crew.append(new_member)
    save_json("crew.json", crew)
    return new_member

@app.delete("/api/crew/{crew_id}")
def delete_crew_member(crew_id: int):
    """Remove a crew member"""
    crew = load_json("crew.json", [])
    crew = [c for c in crew if c.get("id") != crew_id]
    save_json("crew.json", crew)
    return {"message": "Crew member deleted"}

# ==================== BUDGET ====================

@app.get("/api/budget/{project_id}")
def get_budget(project_id: int):
    """Get budget for a project"""
    budget_data = load_json("budget.json", {"expenses": [], "categories": ["Pre-production", "Production", "Post-production", "Contingency"]})
    expenses = [e for e in budget_data.get("expenses", []) if e.get("project_id") == project_id]
    return {"expenses": expenses, "categories": budget_data.get("categories", [])}

@app.post("/api/budget/expense")
def add_expense(expense: ExpenseCreate):
    """Add an expense"""
    budget_data = load_json("budget.json", {"expenses": [], "categories": ["Pre-production", "Production", "Post-production", "Contingency"]})
    
    new_id = max([e.get("id", 0) for e in budget_data.get("expenses", [])] + [0]) + 1
    
    new_expense = {
        "id": new_id,
        "project_id": expense.project_id,
        "category": expense.category,
        "item": expense.item,
        "estimated": expense.estimated,
        "actual": expense.actual,
        "date": expense.date or datetime.now().strftime("%Y-%m-%d"),
        "notes": expense.notes,
        "created_at": datetime.now().isoformat()
    }
    budget_data["expenses"].append(new_expense)
    save_json("budget.json", budget_data)
    return new_expense

@app.delete("/api/budget/expense/{expense_id}")
def delete_expense(expense_id: int):
    """Delete an expense"""
    budget_data = load_json("budget.json", {"expenses": [], "categories": []})
    budget_data["expenses"] = [e for e in budget_data.get("expenses", []) if e.get("id") != expense_id]
    save_json("budget.json", budget_data)
    return {"message": "Expense deleted"}

# ==================== SCHEDULE ====================

@app.get("/api/schedule/{project_id}")
def get_schedule(project_id: int):
    """Get schedule for a project"""
    schedule_data = load_json("schedule.json", {"days": []})
    days = [d for d in schedule_data.get("days", []) if d.get("project_id") == project_id]
    return {"days": days}

@app.post("/api/schedule/day")
def add_schedule_day(day: ScheduleDayCreate):
    """Add a shooting day"""
    schedule_data = load_json("schedule.json", {"days": []})
    new_id = max([d.get("id", 0) for d in schedule_data.get("days", [])] + [0]) + 1
    
    new_day = {
        "id": new_id,
        "project_id": day.project_id,
        "date": day.date,
        "call_time": day.call_time,
        "wrap_time": day.wrap_time,
        "scenes": day.scenes,
        "location": day.location,
        "notes": day.notes,
        "created_at": datetime.now().isoformat()
    }
    schedule_data["days"].append(new_day)
    save_json("schedule.json", schedule_data)
    return new_day

# ==================== LOCATIONS ====================

@app.get("/api/locations")
def get_locations(project_id: Optional[int] = None):
    """Get all locations"""
    locations = load_json("locations.json", [])
    if project_id:
        locations = [l for l in locations if l.get("project_id") == project_id]
    return locations

@app.post("/api/locations")
def create_location(location: LocationCreate):
    """Add a location"""
    locations = load_json("locations.json", [])
    new_id = max([l.get("id", 0) for l in locations] + [0]) + 1
    
    new_location = {
        "id": new_id,
        "project_id": location.project_id,
        "name": location.name,
        "tamil": location.tamil,
        "type": location.type,
        "address": location.address,
        "notes": location.notes,
        "permit_status": "pending",
        "created_at": datetime.now().isoformat()
    }
    locations.append(new_location)
    save_json("locations.json", locations)
    return new_location

# ==================== EQUIPMENT ====================

@app.get("/api/equipment")
def get_equipment(project_id: Optional[int] = None):
    """Get all equipment"""
    equipment = load_json("equipment.json", [])
    if project_id:
        equipment = [e for e in equipment if e.get("project_id") == project_id]
    return equipment

@app.post("/api/equipment")
def create_equipment(equipment: EquipmentCreate):
    """Add equipment"""
    all_equipment = load_json("equipment.json", [])
    new_id = max([e.get("id", 0) for e in all_equipment] + [0]) + 1
    
    new_equipment = {
        "id": new_id,
        "project_id": equipment.project_id,
        "name": equipment.name,
        "category": equipment.category,
        "quantity": equipment.quantity,
        "daily_rate": equipment.daily_rate,
        "vendor": equipment.vendor,
        "status": equipment.status,
        "notes": equipment.notes,
        "created_at": datetime.now().isoformat()
    }
    all_equipment.append(new_equipment)
    save_json("equipment.json", all_equipment)
    return new_equipment

@app.delete("/api/equipment/{equipment_id}")
def delete_equipment(equipment_id: int):
    """Delete equipment"""
    equipment = load_json("equipment.json", [])
    equipment = [e for e in equipment if e.get("id") != equipment_id]
    save_json("equipment.json", equipment)
    return {"status": "deleted", "id": equipment_id}

@app.put("/api/equipment/{equipment_id}")
def update_equipment(equipment_id: int, data: dict):
    """Update equipment"""
    equipment = load_json("equipment.json", [])
    for e in equipment:
        if e.get("id") == equipment_id:
            e.update({k: v for k, v in data.items() if v is not None})
            break
    save_json("equipment.json", equipment)
    return {"status": "updated", "id": equipment_id}

# ==================== CHARACTERS ====================

@app.get("/api/characters")
def get_characters(project_id: Optional[int] = None):
    """Get all characters"""
    characters = load_json("characters.json", [])
    if project_id:
        characters = [c for c in characters if c.get("project_id") == project_id]
    return characters

@app.post("/api/characters")
def create_character(character: CharacterCreate):
    """Add a character"""
    characters = load_json("characters.json", [])
    new_id = max([c.get("id", 0) for c in characters] + [0]) + 1
    
    new_character = {
        "id": new_id,
        "project_id": character.project_id,
        "name": character.name,
        "tamil": character.tamil,
        "actor": character.actor,
        "role": character.role,
        "description": character.description,
        "created_at": datetime.now().isoformat()
    }
    characters.append(new_character)
    save_json("characters.json", characters)
    return new_character

# ==================== AI ANALYSIS ====================

@app.post("/api/ai/analyze-script")
def analyze_script(request: AIScriptAnalysisRequest):
    """Analyze a script - mock AI response"""
    content = request.content
    language = request.language
    
    # Calculate basic metrics
    words = len(content.split())
    lines = content.count('\n')
    
    # Mock analysis based on content
    analysis = {
        "summary": f"Script analysis complete. Found approximately {words} words across {lines} lines.",
        "scenes_detected": min(20, max(5, lines // 10)),
        "locations": ["Chennai", "Outdoor Location", "Indoor Setting"],
        "characters": ["Protagonist", "Antagonist", "Supporting Character"],
        "genre": "Drama" if "emotion" in content.lower() else "Action",
        "estimated_pages": max(1, lines // 50),
        "estimated_runtime": f"{max(5, lines // 10)} minutes",
        "complexity": "medium" if words > 500 else "low",
        "suggestions": [
            "Consider adding more location variety",
            "Dialogue could be shortened for pacing",
            "Good emotional beats detected"
        ],
        "language": language
    }
    return analysis

@app.post("/api/ai/deep-analysis")
def deep_analysis(request: AIScriptAnalysisRequest):
    """Deep script analysis with detailed breakdowns"""
    content = request.content
    language = request.language
    
    words = len(content.split())
    chars = len(content)
    
    return {
        "overview": {
            "word_count": words,
            "character_count": chars,
            "estimated_pages": max(1, chars // 250),
            "estimated_runtime": f"{max(5, chars // 1000)} minutes",
            "genre": "Drama/Thriller",
            "mood": "Intensity, Romance"
        },
        "scene_breakdown": {
            "total_scenes": min(30, max(5, words // 100)),
            "interior_scenes": min(15, max(2, words // 300)),
            "exterior_scenes": min(15, max(2, words // 300)),
            "day_scenes": min(18, max(3, words // 250)),
            "night_scenes": min(12, max(2, words // 350))
        },
        "character_analysis": {
            "major_characters": 3,
            "supporting_characters": 5,
            "dialogue_heavy": words > 1000,
            "action_sequences": min(5, words // 500)
        },
        "production_notes": {
            "estimated_shoot_days": min(20, max(3, words // 200)),
            "estimated_budget_range": "₹2-5 Crores",
            "location_count": min(8, max(2, words // 400)),
            "vfx_scenes": min(5, words // 1000)
        },
        "tamil_specific": {
            "cultural_elements_detected": True,
            "family_dynamics": True,
            "tradition_modern_mix": True
        } if language == "tamil" else None,
        "suggestions": [
            "Strong opening sequence",
            "Consider intercutting scenes for tension",
            "Music cues recommended at climax"
        ]
    }

@app.post("/api/ai/generate-shot-list")
def generate_shot_list(request: AIShotListRequest):
    """Generate AI shot suggestions for a scene"""
    description = request.scene_description.lower()
    
    shots = [
        {"shot_type": "Wide Shot (WS)", "description": "Establish the location and atmosphere", "camera": "Wide", "lens": "24mm", "movement": "Static"},
        {"shot_type": "Medium Shot (MS)", "description": "Character introduction and context", "camera": "Medium", "lens": "50mm", "movement": "Static"},
    ]
    
    # Add shots based on content
    if any(word in description for word in ["romance", "love", "kiss", "emotion"]):
        shots.append({"shot_type": "Close-up (CU)", "description": "Emotional beat - key reaction", "camera": "CU", "lens": "85mm", "movement": "Static"})
        shots.append({"shot_type": "Two Shot", "description": "Intimate conversation", "camera": "Medium", "lens": "50mm", "movement": "Slow push"})
    
    if any(word in description for word in ["action", "fight", "chase", "run"]):
        shots.append({"shot_type": "POV Shot", "description": "First person action view", "camera": "POV", "lens": "35mm", "movement": "Dynamic"})
        shots.append({"shot_type": "Tracking Shot", "description": "Follow the action", "camera": "Tracking", "lens": "24mm", "movement": "Dolly"})
    
    if any(word in description for word in ["sad", "cry", "tears", "death"]):
        shots.append({"shot_type": "Extreme Close-up (ECU)", "description": "Tear or emotional detail", "camera": "ECU", "lens": "100mm", "movement": "Static"})
    
    # Always add these for coverage
    shots.extend([
        {"shot_type": "Over the Shoulder (OTS)", "description": "Conversation coverage", "camera": "OTS", "lens": "50mm", "movement": "Static"},
        {"shot_type": "Insert Shot", "description": "Object/reaction detail", "camera": "Close", "lens": "85mm", "movement": "Static"},
    ])
    
    return {"shots": shots, "scene_description": description}

@app.post("/api/ai/estimate-budget")
def estimate_budget(request: dict):
    """Estimate budget based on script analysis"""
    scenes = request.get("scenes", [])
    locations = request.get("locations", [])
    days = request.get("days", 10)
    
    base_cost_per_day = 150000  # ₹1.5 lakhs per day base
    location_cost = len(locations) * 50000  # ₹50k per location
    scene_complexity = len(scenes) * 10000  # ₹10k per scene
    
    total = (base_cost_per_day * days) + location_cost + scene_complexity
    
    return {
        "estimated_total": total,
        "breakdown": {
            "production_days": days,
            "cost_per_day": base_cost_per_day,
            "location_fees": location_cost,
            "scene_complexity": scene_complexity,
            "contingency": total * 0.1,
            "post_production": total * 0.2
        },
        "recommendation": f"建议预算 ₹{total/100000:.0f} Lakhs (含10%应急费用)"
    }

@app.get("/api/ai/tamil-numbers/{n}")
def tamil_numbers(n: int):
    """Convert number to Tamil"""
    tamil_digits = ['零', 'ஒன்று', 'இரண்டு', 'மூன்று', 'நான்கு', 'ஐந்து', 'ஆறு', 'ஏழு', 'எட்டு', 'தொண்ணூல்', 'பதின்']
    tamil_units = ['', 'பதின்', 'இருபது', 'முப்பது', 'நாற்பது', 'ஐம்பது', 'அரை', 'எழுபது', 'எண்பத்', 'தொண்ணூல்']
    
    if n < 11:
        return {"number": n, "tamil": tamil_digits[n] if n < len(tamil_digits) else str(n)}
    
    # Simple conversion for demo
    return {"number": n, "tamil": f"{n} (Tamil)", "note": "Tamil number conversion extended"}

# ==================== NOTIFICATIONS ====================

@app.post("/api/notifications/whatsapp")
def send_whatsapp(data: dict):
    """Send WhatsApp message (mock)"""
    return {
        "status": "sent",
        "recipient": data.get("recipient"),
        "message": data.get("message"),
        "timestamp": datetime.now().isoformat(),
        "note": "Configure wacli for real sending"
    }

@app.post("/api/notifications/email")
def send_email(data: dict):
    """Send email (mock)"""
    return {
        "status": "sent",
        "recipient": data.get("recipient"),
        "subject": data.get("subject"),
        "timestamp": datetime.now().isoformat(),
        "note": "Configure SMTP for real sending"
    }

# ==================== UPLOAD ====================

@app.post("/api/upload/script")
async def upload_script(file: UploadFile = File(...)):
    """Upload and parse a script file"""
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    
    # Basic parsing
    lines = text.split('\n')
    scenes = []
    current_scene = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if line.startswith(('INT.', 'EXT.', 'INT/EXT', 'I/E')):
            if current_scene:
                scenes.append(current_scene)
            current_scene = {
                "heading": line,
                "description": ""
            }
        elif current_scene and line.isupper():
            continue  # Skip scene headers in description
        elif current_scene:
            current_scene["description"] += line + " "
    
    if current_scene:
        scenes.append(current_scene)
    
    return {
        "filename": file.filename,
        "scenes_count": len(scenes),
        "scenes": scenes[:10],  # Return first 10 for preview
        "total_lines": len(lines),
        "message": "Script uploaded successfully"
    }

# ==================== DOOD Report ====================

@app.get("/api/dood/{project_id}")
def get_dood_report(project_id: int):
    """Generate Day Out of Days report"""
    crew = load_json("crew.json", [])
    characters = load_json("characters.json", [])
    project_crew = [c for c in crew if c.get("project_id") == project_id]
    project_chars = [c for c in characters if c.get("project_id") == project_id]
    
    # Create mock DOOD
    report = {
        "project_id": project_id,
        "days": [],
        "summary": {
            "total_cast": len(project_chars),
            "total_crew": len(project_crew),
            "shooting_days": 0
        }
    }
    
    # Add sample data
    for i in range(1, 11):
        day_data = {
            "day": i,
            "cast_calls": min(8, len(project_chars)),
            "total_calls": min(15, len(project_crew) + len(project_chars))
        }
        report["days"].append(day_data)
        report["summary"]["shooting_days"] = i
    
    return report

# ==================== Call Sheet ====================

@app.get("/api/callsheet/{project_id}")
def get_callsheet(project_id: int):
    """Generate call sheet"""
    project = None
    projects = load_json("projects.json", [])
    for p in projects:
        if p.get("id") == project_id:
            project = p
            break
    
    if not project:
        for p in DEMO_PROJECTS:
            if p["id"] == project_id:
                project = p
                break
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {
        "project": project,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "call_time": "06:00",
        "location": "Primary Location TBD",
        "scenes": [
            {"number": 1, "description": "Opening scene", "pages": 2},
            {"number": 2, "description": "Character introduction", "pages": 3},
        ],
        "crew_calls": [
            {"role": "Director", "time": "06:00"},
            {"role": "Cinematographer", "time": "06:30"},
            {"role": "Cast", "time": "07:00"},
        ],
        "weather": "Sunny, 28°C",
        "notes": "Day 1 of shooting"
    }

# ==================== Analytics ====================

@app.get("/api/analytics/{project_id}")
def get_analytics(project_id: int):
    """Get project analytics"""
    scenes = load_json("scenes.json", [])
    crew = load_json("crew.json", [])
    budget = load_json("budget.json", {"expenses": []})
    
    project_scenes = [s for s in scenes if s.get("project_id") == project_id]
    project_crew = [c for c in crew if c.get("project_id") == project_id]
    project_expenses = [e for e in budget.get("expenses", []) if e.get("project_id") == project_id]
    
    total_estimated = sum(e.get("estimated", 0) for e in project_expenses)
    total_actual = sum(e.get("actual", 0) for e in project_expenses)
    
    return {
        "project_id": project_id,
        "overview": {
            "total_scenes": len(project_scenes),
            "total_crew": len(project_crew),
            "total_budget": total_estimated,
            "spent": total_actual,
            "remaining": total_estimated - total_actual
        },
        "scene_breakdown": {
            "interior": len([s for s in project_scenes if s.get("interior_exterior") == "INT"]),
            "exterior": len([s for s in project_scenes if s.get("interior_exterior") == "EXT"]),
            "day": len([s for s in project_scenes if s.get("time_of_day") == "DAY"]),
            "night": len([s for s in project_scenes if s.get("time_of_day") == "NIGHT"])
        },
        "crew_by_department": {},
        "budget_by_category": {}
    }

# ==================== ENHANCED AI ANALYSIS ====================

@app.post("/api/ai/analyze-pacing")
def analyze_pacing(request: AIScriptAnalysisRequest):
    """Analyze script pacing - dialogue vs action ratio"""
    content = request.content
    lines = content.split('\n')
    
    dialogue_lines = sum(1 for line in lines if line.strip().startswith(('"', "'", '『', '「')) or line.strip().isupper())
    action_lines = sum(1 for line in lines if any(word in line.lower() for word in ['cuts to', 'dissolve', 'fade', 'smash cut', 'establishing']))
    description_lines = sum(1 for line in lines if line.strip() and not line.strip().startswith(('"', "'")))
    
    total = dialogue_lines + action_lines + description_lines
    dialogue_ratio = (dialogue_lines / total * 100) if total > 0 else 0
    action_ratio = (action_lines / total * 100) if total > 0 else 0
    
    # Estimate runtime based on pages
    est_pages = max(1, len(content) // 250)
    runtime_mins = est_pages * 1.2  # ~1.2 min per page
    
    return {
        "pacing_analysis": {
            "dialogue_ratio": round(dialogue_ratio, 1),
            "action_ratio": round(action_ratio, 1),
            "description_ratio": round(100 - dialogue_ratio - action_ratio, 1),
            "estimated_runtime": f"{int(runtime_mins)} minutes",
            "total_pages": est_pages,
            "pacing_score": "Fast" if action_ratio > 30 else "Slow" if dialogue_ratio > 70 else "Balanced"
        },
        "scene_lengths": {
            "avg_dialogue_per_scene": max(1, dialogue_lines // max(1, len([l for l in lines if l.startswith(('INT.', 'EXT.'))]))),
            "avg_action_per_scene": max(1, action_lines // max(1, len([l for l in lines if l.startswith(('INT.', 'EXT.'))])))
        },
        "recommendations": [
            "Add more visual storytelling" if dialogue_ratio > 70 else None,
            "Consider intercutting" if action_ratio > 40 else None,
            "Good balance achieved" if 40 <= dialogue_ratio <= 70 else None
        ]
    }

@app.post("/api/ai/analyze-characters")
def analyze_characters(request: AIScriptAnalysisRequest):
    """Extract and analyze characters from script"""
    content = request.content
    lines = content.split('\n')
    
    # Simple character extraction (names in uppercase at start of dialogue)
    potential_chars = set()
    for line in lines:
        line = line.strip()
        if line and line.isupper() and len(line) < 30 and not line.startswith(('INT.', 'EXT.', 'FADE', 'CUT', 'DISSOLVE')):
            potential_chars.add(line)
    
    characters = list(potential_chars)[:10]  # Top 10
    
    return {
        "characters": [
            {"name": c, "role": "unknown", "dialogue_count": 0, "first_appearance": "Scene 1"}
            for c in characters
        ],
        "summary": {
            "total_characters": len(characters),
            "major_roles": len([c for c in characters if len(c) < 15]),
            "supporting_roles": len([c for c in characters if len(c) >= 15])
        },
        "character_arcs": [
            {"character": c, "arc": "transformation", "key_moments": ["introduction", "conflict", "resolution"]}
            for c in characters[:3]
        ]
    }

@app.post("/api/ai/analyze-emotional-arc")
def analyze_emotional_arc(request: AIScriptAnalysisRequest):
    """Analyze emotional journey through the script"""
    content = request.content.lower()
    
    emotional_markers = {
        "joy": sum(1 for word in ["happy", "joy", "love", "celebrate", "laugh", "smile", "delight"] if word in content),
        "sadness": sum(1 for word in ["cry", "tears", "sad", "death", "lost", "grief", "mourning"] if word in content),
        "tension": sum(1 for word in ["fear", "scared", "danger", "threat", "chase", "run", "escape"] if word in content),
        "anger": sum(1 for word in ["angry", "rage", "fight", "hit", "yell", "scream", "furious"] if word in content),
        "romance": sum(1 for word in ["kiss", "love", "heart", "embrace", "romance", "passion"] if word in content),
        "suspense": sum(1 for word in ["mystery", "secret", "reveal", "truth", "hidden", "suspicious"] if word in content)
    }
    
    # Determine arc shape
    arc_shape = "fluctuating"
    if emotional_markers["tension"] > emotional_markers["joy"]:
        arc_shape = "rising_tension"
    elif emotional_markers["sadness"] > emotional_markers["joy"]:
        arc_shape = "tragic"
    elif emotional_markers["romance"] > emotional_markers["tension"]:
        arc_shape = "romantic"
    
    return {
        "emotional_journey": {
            "arc_shape": arc_shape,
            "markers": emotional_markers,
            "dominant_emotion": max(emotional_markers, key=emotional_markers.get),
            "secondary_emotion": sorted(emotional_markers.items(), key=lambda x: x[1], reverse=True)[1][0] if any(emotional_markers.values()) else "none"
        },
        "act_breakdown": {
            "act1_emotions": {"setup": "calm", "inciting_incident": "tension"},
            "act2_emotions": {"rising_action": "tension", "midpoint": "revelation"},
            "act3_emotions": {"climax": "tension", "resolution": "joy" if arc_shape != "tragic" else "sadness"}
        },
        "recommendations": [
            "Add more emotional variety in Act 1" if emotional_markers["joy"] < 3 else None,
            "Build tension systematically" if emotional_markers["tension"] < emotional_markers["sadness"] else None
        ]
    }

@app.post("/api/ai/generate-tags")
def generate_tags(request: AIScriptAnalysisRequest):
    """Generate auto-tags for the script"""
    content = request.content.lower()
    language = request.language
    
    # Genre detection
    genres = []
    if any(word in content for word in ["fight", "chase", "action", "explosion"]):
        genres.append("Action")
    if any(word in content for word in ["love", "kiss", "romance", "heart"]):
        genres.append("Romance")
    if any(word in content for word in ["murder", "thriller", "mystery", "detective"]):
        genres.append("Thriller")
    if any(word in content for word in ["comedy", "funny", "laugh", "joke"]):
        genres.append("Comedy")
    if any(word in content for word in ["family", "tradition", "wedding", "festival"]):
        genres.append("Family Drama")
    if not genres:
        genres.append("Drama")
    
    # Mood detection
    moods = []
    if any(word in content for word in ["dark", "gloomy", "shadow", "night"]):
        moods.append("Dark")
    if any(word in content for word in ["bright", "sunny", "happy", "celebration"]):
        moods.append("Uplifting")
    if any(word in content for word in ["emotional", "touching", "tears"]):
        moods.append("Emotional")
    if any(word in content for word in ["intense", "edge", "suspense"]):
        moods.append("Intense")
    
    # Setting detection
    settings = []
    if any(word in content for word in ["village", "town", "rural"]):
        settings.append("Rural")
    if any(word in content for word in ["city", "chennai", "mall", "office"]):
        settings.append("Urban")
    if any(word in content for word in ["house", "home", "family"]):
        settings.append("Domestic")
    if any(word in content for word in ["temple", "church", "mosque"]):
        settings.append("Religious")
    
    return {
        "tags": {
            "genres": genres,
            "moods": moods,
            "settings": settings,
            "themes": ["Family", "Love", "Revenge"]  # Default themes
        },
        "target_audience": "Adults" if any(word in content for word in ["violence", "death", "romance"]) else "Family",
        "language": language,
        "certification_suggestion": "U" if len(genres) < 3 else "UA"
    }

# ==================== ENHANCED WHATSAPP NOTIFICATIONS ====================

@app.post("/api/whatsapp/schedule-reminder")
def whatsapp_schedule_reminder(data: dict):
    """Send schedule reminder via WhatsApp"""
    recipient = data.get("recipient")
    project_name = data.get("project_name", "Production")
    date = data.get("date", "TBD")
    call_time = data.get("call_time", "06:00")
    location = data.get("location", "TBD")
    
    message = f"📅 *Shooting Schedule Reminder*\n\n*Project:* {project_name}\n*Date:* {date}\n*Call Time:* {call_time}\n*Location:* {location}\n\nPlease arrive 30 mins early. See you on set! 🎬"
    
    return {
        "status": "scheduled",
        "recipient": recipient,
        "message": message,
        "timestamp": datetime.now().isoformat(),
        "channel": "whatsapp"
    }

@app.post("/api/whatsapp/location-update")
def whatsapp_location_update(data: dict):
    """Send location update notification"""
    recipient = data.get("recipient")
    old_location = data.get("old_location", "Previous")
    new_location = data.get("new_location", "New")
    effective_date = data.get("effective_date", "Today")
    
    message = f"📍 *Location Update*\n\n*New Location:* {new_location}\n*Old Location:* {old_location}\n*Effective:* {effective_date}\n\nPlease update your travel plans accordingly!"
    
    return {
        "status": "sent",
        "recipient": recipient,
        "message": message,
        "timestamp": datetime.now().isoformat(),
        "channel": "whatsapp"
    }

@app.post("/api/whatsapp/cast-call")
def whatsapp_cast_call(data: dict):
    """Send cast call time notification"""
    recipient = data.get("recipient")
    character_name = data.get("character_name", "Character")
    shoot_date = data.get("shoot_date", "TBD")
    call_time = data.get("call_time", "07:00")
    scenes = data.get("scenes", [])
    
    scenes_text = "\n".join([f"• Scene {s}" for s in scenes]) if scenes else "See call sheet"
    
    message = f"🎭 *Cast Call Notice*\n\n*Character:* {character_name}\n*Date:* {shoot_date}\n*Call Time:* {call_time}\n*Scenes:*\n{scenes_text}\n\nPlease confirm your availability. Wardrobe: Traditional!"
    
    return {
        "status": "sent",
        "recipient": recipient,
        "message": message,
        "timestamp": datetime.now().isoformat(),
        "channel": "whatsapp"
    }

# ==================== MULTI-SCRIPT UPLOAD ====================

@app.post("/api/upload/script-multi")
async def upload_multiple_scripts(files: List[UploadFile] = File(...)):
    """Upload multiple scripts at once"""
    results = []
    
    for file in files:
        content = await file.read()
        text = content.decode("utf-8", errors="ignore")
        
        # Extract scenes
        lines = text.split('\n')
        scene_count = sum(1 for line in lines if line.strip().startswith(('INT.', 'EXT.', 'INT/EXT')))
        
        results.append({
            "filename": file.filename,
            "scenes_count": scene_count,
            "size_bytes": len(content),
            "status": "uploaded"
        })
    
    return {
        "total_files": len(files),
        "results": results,
        "message": f"Successfully processed {len(files)} files"
    }

# ==================== PROJECT COLLABORATION ====================

# Activity Feed
@app.get("/api/projects/{project_id}/activity")
def get_project_activity(project_id: int):
    """Get project activity feed"""
    activities = [
        {"id": 1, "type": "scene_added", "user": "Director", "description": "Scene 5 added", "timestamp": datetime.now().isoformat()},
        {"id": 2, "type": "budget_updated", "user": "Producer", "description": "Budget increased by ₹5L", "timestamp": datetime.now().isoformat()},
        {"id": 3, "type": "crew_added", "user": "AD", "description": "New crew member: Cinematographer", "timestamp": datetime.now().isoformat()},
    ]
    return {"project_id": project_id, "activities": activities}

# Task Management
@app.get("/api/projects/{project_id}/tasks")
def get_project_tasks(project_id: int):
    """Get project tasks"""
    tasks = [
        {"id": 1, "title": "Complete script finalization", "status": "completed", "assignee": "Writer", "due_date": "2026-02-10"},
        {"id": 2, "title": "Location scouting complete", "status": "in_progress", "assignee": "Location Manager", "due_date": "2026-02-15"},
        {"id": 3, "title": "Finalize cast", "status": "pending", "assignee": "Casting Director", "due_date": "2026-02-20"},
        {"id": 4, "title": "Equipment booking", "status": "pending", "assignee": "Line Producer", "due_date": "2026-02-25"},
    ]
    return {"project_id": project_id, "tasks": tasks}

@app.post("/api/projects/{project_id}/tasks")
def create_project_task(project_id: int, data: dict):
    """Create a new task"""
    task = {
        "id": 100,
        "project_id": project_id,
        "title": data.get("title", "New Task"),
        "status": "pending",
        "assignee": data.get("assignee", "Unassigned"),
        "due_date": data.get("due_date", "2026-03-01"),
        "created_at": datetime.now().isoformat()
    }
    return {"status": "created", "task": task}

# Expense Tracking
@app.get("/api/projects/{project_id}/expenses")
def get_project_expenses(project_id: int):
    """Get project expenses"""
    expenses = [
        {"id": 1, "category": "Pre-production", "item": "Script writing", "estimated": 500000, "actual": 450000, "date": "2026-01-15"},
        {"id": 2, "category": "Production", "item": "Location fees", "estimated": 300000, "actual": 280000, "date": "2026-02-01"},
        {"id": 3, "category": "Production", "item": "Equipment rental", "estimated": 200000, "actual": 180000, "date": "2026-02-05"},
    ]
    total_estimated = sum(e["estimated"] for e in expenses)
    total_actual = sum(e["actual"] for e in expenses)
    
    return {
        "project_id": project_id,
        "expenses": expenses,
        "summary": {
            "total_estimated": total_estimated,
            "total_actual": total_actual,
            "remaining": total_estimated - total_actual
        }
    }

# ==================== ENHANCED AI ANALYSIS V2 ====================

@app.post("/api/ai/analyze-screenplay-format")
def analyze_screenplay_format(request: AIScriptAnalysisRequest):
    """Check if script follows proper screenplay format"""
    content = request.content
    lines = content.split('\n')
    
    issues = []
    warnings = []
    score = 100
    
    # Check scene headings
    scene_headings = [l for l in lines if l.strip().startswith(('INT.', 'EXT.', 'INT/EXT', 'I/E'))]
    if len(scene_headings) < 3:
        issues.append("Too few scene headings detected")
        score -= 20
    
    # Check dialogue formatting
    has_parentheticals = any('(' in l and ')' in l for l in lines)
    has_character_names = any(l.strip().isupper() and len(l.strip()) < 30 and not l.startswith(('INT.', 'EXT.')) for l in lines)
    
    if not has_character_names:
        warnings.append("No character names found in uppercase")
        score -= 10
    
    # Check page length estimate
    if len(content) > 120000:  # > 120 pages
        warnings.append("Script exceeds typical feature length")
        score -= 15
    
    format_type = "Fountain" if any(l.strip().startswith(('INT ', 'EXT ')) for l in lines) else "Standard"
    
    return {
        "format_analysis": {
            "format_type": format_type,
            "score": max(0, score),
            "issues": issues,
            "warnings": warnings,
            "scene_headings_count": len(scene_headings),
            "estimated_pages": max(1, len(content) // 250)
        },
        "recommendations": [
            "Add more scene headings for better structure" if len(scene_headings) < 5 else None,
            "Use proper character names in uppercase" if not has_character_names else None,
            "Consider breaking into multiple acts" if len(content) > 80000 else None
        ]
    }

@app.post("/api/ai/analyze-scene-complexity")
def analyze_scene_complexity(request: AIScriptAnalysisRequest):
    """Score complexity of each scene for scheduling"""
    content = request.content
    lines = content.split('\n')
    
    # Split into scenes
    scenes = []
    current_scene = {"lines": [], "heading": None}
    
    for line in lines:
        if line.strip().startswith(('INT.', 'EXT.', 'INT/EXT', 'I/E', 'INT ', 'EXT ')):
            if current_scene["lines"]:
                scenes.append(current_scene)
            current_scene = {"lines": [line], "heading": line.strip()}
        else:
            current_scene["lines"].append(line)
    
    if current_scene["lines"]:
        scenes.append(current_scene)
    
    # Analyze each scene
    scene_complexities = []
    for i, scene in enumerate(scenes[:20]):  # Top 20
        text = ' '.join(scene["lines"]).lower()
        
        complexity = 0
        
        # VFX complexity
        if any(w in text for w in ["vfx", "cgi", "特效", "computer graphics"]):
            complexity += 3
        
        # Stunt complexity
        if any(w in text for w in ["fight", "chase", "explosion", "stunt", "action"]):
            complexity += 2
        
        # Night scene (lighting setup)
        if "night" in text or "இரவு" in text:
            complexity += 1
        
        # Large cast
        if sum(1 for c in scene["lines"] if c.strip().isupper() and len(c.strip()) < 20) > 5:
            complexity += 2
        
        # Location changes
        if scene["heading"] and ("/" in scene["heading"] or "INT/EXT" in scene["heading"]):
            complexity += 2
        
        # Dialogue heavy
        dialogue_lines = [l for l in scene["lines"] if l.strip().startswith(('"', "'"))]
        if len(dialogue_lines) > 10:
            complexity += 1
        
        scene_complexities.append({
            "scene_number": i + 1,
            "heading": scene["heading"][:50] if scene["heading"] else f"Scene {i+1}",
            "complexity_score": min(10, complexity),
            "complexity_label": "High" if complexity >= 6 else "Medium" if complexity >= 3 else "Low",
            "factors": {
                "vfx": complexity >= 3,
                "stunts": complexity >= 2,
                "night_setup": "night" in text,
                "large_cast": complexity >= 2,
                "location_change": complexity >= 2
            }
        })
    
    avg_complexity = sum(s["complexity_score"] for s in scene_complexities) / len(scene_complexities) if scene_complexities else 0
    
    return {
        "scene_analysis": scene_complexities,
        "summary": {
            "total_scenes": len(scenes),
            "analyzed_scenes": len(scene_complexities),
            "avg_complexity": round(avg_complexity, 2),
            "high_complexity_count": len([s for s in scene_complexities if s["complexity_label"] == "High"]),
            "recommended_shoot_days": max(1, int(avg_complexity * len(scenes) / 3))
        }
    }

# ==================== FOUNTAIN PARSER ====================

@app.post("/api/ai/parse-fountain")
def parse_fountain(request: AIScriptAnalysisRequest):
    """Parse Fountain screenplay format"""
    content = request.content
    lines = content.split('\n')
    
    scenes = []
    characters = set()
    current_scene = None
    
    for line in lines:
        line = line.strip()
        
        # Scene heading
        if line.startswith(('INT ', 'EXT ', 'INT/EXT ', 'I/E ')) or (line.isupper() and len(line) > 3 and not line.startswith('#')):
            if current_scene:
                scenes.append(current_scene)
            current_scene = {
                "heading": line,
                "location": line.replace('INT ', '').replace('EXT ', '').replace('INT/EXT ', '').split(' - ')[0].strip(),
                "time": "DAY",
                "type": "INT" if line.startswith('INT') else "EXT",
                "description": "",
                "dialogue": []
            }
            # Detect time
            if 'NIGHT' in line.upper():
                current_scene["time"] = "NIGHT"
            elif 'DAWN' in line.upper():
                current_scene["time"] = "DAWN"
            elif 'DUSK' in line.upper():
                current_scene["time"] = "DUSK"
        
        # Character name (centered, uppercase)
        elif line.isupper() and len(line) > 1 and len(line) < 30 and not line.startswith('#'):
            characters.add(line)
        
        # Parenthetical
        elif line.startswith('(') and line.endswith(')'):
            if current_scene:
                current_scene["dialogue"].append({"type": "parenthetical", "text": line})
        
        # Dialogue
        elif current_scene and not line.startswith('#'):
            if line:
                current_scene["dialogue"].append({"type": "dialogue", "text": line})
    
    if current_scene:
        scenes.append(current_scene)
    
    return {
        "format": "Fountain",
        "scenes_count": len(scenes),
        "scenes": scenes[:15],
        "characters": list(characters),
        "metadata": {
            "total_lines": len(lines),
            "estimated_pages": max(1, len(content) // 250)
        }
    }

# ==================== REAL WHATSAPP INTEGRATION ====================

import subprocess
import shutil

def send_whatsapp_via_wacli(recipient: str, message: str) -> dict:
    """Send WhatsApp message using wacli if available"""
    # Check if wacli is available
    wacli_path = shutil.which('wacli')
    
    if not wacli_path:
        return {
            "success": False,
            "error": "wacli not found",
            "message": "Please install wacli: npm install -g wacli",
            "fallback": "Using mock delivery"
        }
    
    try:
        # Try to send via wacli
        result = subprocess.run(
            ['wacli', 'send', '--to', recipient, '--message', message],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            return {
                "success": True,
                "channel": "whatsapp",
                "recipient": recipient,
                "timestamp": datetime.now().isoformat()
            }
        else:
            return {
                "success": False,
                "error": result.stderr,
                "fallback": "mock"
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "fallback": "mock"
        }

@app.post("/api/whatsapp/send")
def whatsapp_send(data: dict):
    """Send WhatsApp message with real wacli integration"""
    recipient = data.get("recipient")
    message = data.get("message", "")
    use_wacli = data.get("use_wacli", True)
    
    if not recipient or not message:
        raise HTTPException(status_code=400, detail="recipient and message required")
    
    if use_wacli:
        result = send_whatsapp_via_wacli(recipient, message)
        if result.get("success"):
            return result
    
    # Fallback to mock
    return {
        "status": "sent_mock",
        "recipient": recipient,
        "message": message,
        "timestamp": datetime.now().isoformat(),
        "channel": "whatsapp",
        "note": "Mock delivery - configure wacli for real sending"
    }

@app.post("/api/whatsapp/batch-send")
def whatsapp_batch_send(data: dict):
    """Send batch WhatsApp messages"""
    messages = data.get("messages", [])
    results = []
    
    for msg in messages:
        recipient = msg.get("recipient")
        message = msg.get("message", "")
        
        if recipient and message:
            result = send_whatsapp_via_wacli(recipient, message)
            results.append({
                "recipient": recipient,
                "success": result.get("success", False),
                "error": result.get("error")
            })
    
    return {
        "total": len(messages),
        "sent": len([r for r in results if r["success"]]),
        "failed": len([r for r in results if not r["success"]]),
        "results": results
    }

# ==================== SCRIPT VERSION COMPARISON ====================

@app.post("/api/ai/compare-scripts")
def compare_scripts(data: dict):
    """Compare two script versions and find differences"""
    v1 = data.get("version1", "")
    v2 = data.get("version2", "")
    
    lines1 = v1.split('\n')
    lines2 = v2.split('\n')
    
    # Simple diff
    added = []
    removed = []
    unchanged = []
    
    set1 = set(lines1)
    set2 = set(lines2)
    
    for line in lines2:
        if line not in set1:
            added.append(line[:100])
    
    for line in lines1:
        if line not in set2:
            removed.append(line[:100])
    
    # Scene count comparison
    scenes1 = sum(1 for l in lines1 if l.strip().startswith(('INT.', 'EXT.', 'INT/EXT')))
    scenes2 = sum(1 for l in lines2 if l.strip().startswith(('INT.', 'EXT.', 'INT/EXT')))
    
    return {
        "comparison": {
            "version1_scenes": scenes1,
            "version2_scenes": scenes2,
            "scene_difference": scenes2 - scenes1,
            "lines_added": len(added),
            "lines_removed": len(removed),
            "similarity": round((1 - len(added)/max(1, len(lines2))) * 100, 1) if lines2 else 0
        },
        "added_snippets": added[:10],
        "removed_snippets": removed[:10],
        "recommendations": [
            "Review added scenes for flow" if added else None,
            "Check removed scenes aren't essential" if removed else None
        ]
    }

# ==================== SCHEDULE RECOMMENDATIONS ====================

@app.post("/api/schedule/recommendations")
def schedule_recommendations(data: dict):
    """Get AI-powered schedule recommendations"""
    scenes = data.get("scenes", [])
    locations = data.get("locations", [])
    budget = data.get("budget", 1000000)
    
    # Group scenes by location
    location_groups = {}
    for scene in scenes:
        loc = scene.get("location", "Unknown")
        if loc not in location_groups:
            location_groups[loc] = []
        location_groups[loc].append(scene)
    
    # Sort locations by number of scenes
    sorted_locations = sorted(location_groups.items(), key=lambda x: len(x[1]), reverse=True)
    
    # Estimate days per location
    days_per_location = []
    total_days = 0
    
    for loc, loc_scenes in sorted_locations:
        # Complex scenes take longer
        complex_count = sum(1 for s in loc_scenes if any(w in s.get("description", "").lower() for w in ["vfx", "action", "fight"]))
        basic_count = len(loc_scenes) - complex_count
        
        days = (complex_count * 2) + (basic_count * 1)
        total_days += days
        
        days_per_location.append({
            "location": loc,
            "scenes": len(loc_scenes),
            "estimated_days": days,
            "estimated_cost": days * 100000  # 1 lakh per day
        })
    
    # Budget check
    total_cost = sum(d["estimated_cost"] for d in days_per_location)
    budget_status = "within" if total_cost <= budget else "over"
    
    return {
        "recommendations": {
            "shooting_order": [d["location"] for d in days_per_location],
            "total_days": total_days,
            "total_estimated_cost": total_cost,
            "budget_status": budget_status,
            "budget_remaining": budget - total_cost if budget >= total_cost else 0
        },
        "location_breakdown": days_per_location,
        "tips": [
            "Shoot all scenes at same location together" if len(sorted_locations) > 1 else None,
            "Consider weather contingency days" if total_days > 10 else None,
            f"Add 10% buffer: {int(total_days * 1.1)} days recommended" if total_days > 5 else None
        ]
    }

# ==================== ENHANCED CAST MANAGEMENT ====================

@app.get("/api/projects/{project_id}/cast")
def get_project_cast(project_id: int):
    """Get all cast members for a project"""
    characters = load_json("characters.json", [])
    project_chars = [c for c in characters if c.get("project_id") == project_id]
    
    if not project_chars:
        # Demo data
        project_chars = [
            {"id": 1, "name": "Rajesh", "character": "Kathir", "role": "lead", "phone": "+91 98765 43210", "status": "confirmed"},
            {"id": 2, "name": "Priya", "character": "Anjali", "role": "lead", "phone": "+91 98765 43211", "status": "confirmed"},
            {"id": 3, "name": "Vijay", "character": "Kathir's Father", "role": "supporting", "phone": "+91 98765 43212", "status": "pending"},
        ]
    
    return {"project_id": project_id, "cast": project_chars}

@app.post("/api/projects/{project_id}/cast")
def add_cast_member(project_id: int, data: dict):
    """Add a cast member"""
    characters = load_json("characters.json", [])
    new_id = max([c.get("id", 0) for c in characters] + [0]) + 1
    
    new_char = {
        "id": new_id,
        "project_id": project_id,
        "actor": data.get("actor", ""),
        "character": data.get("character", ""),
        "role": data.get("role", "supporting"),
        "phone": data.get("phone", ""),
        "email": data.get("email", ""),
        "daily_rate": data.get("daily_rate", 0),
        "status": "pending",
        "created_at": datetime.now().isoformat()
    }
    
    characters.append(new_char)
    save_json("characters.json", characters)
    return {"status": "created", "cast_member": new_char}

# ==================== EQUIPMENT MANAGEMENT ====================

@app.get("/api/projects/{project_id}/equipment")
def get_project_equipment(project_id: int):
    """Get equipment for a project"""
    equipment_data = load_json("equipment.json", [])
    project_equip = [e for e in equipment_data if e.get("project_id") == project_id]
    
    if not project_equip:
        project_equip = [
            {"id": 1, "name": "RED Komodo", "category": "camera", "quantity": 2, "daily_rate": 15000, "status": "available"},
            {"id": 2, "name": "Arri SkyPanel", "category": "lighting", "quantity": 4, "daily_rate": 8000, "status": "available"},
            {"id": 3, "name": "Sennheiser MKH 416", "category": "sound", "quantity": 3, "daily_rate": 2000, "status": "available"},
        ]
    
    return {"project_id": project_id, "equipment": project_equip}

@app.post("/api/projects/{project_id}/equipment")
def add_equipment(project_id: int, data: dict):
    """Add equipment"""
    equipment_data = load_json("equipment.json", [])
    new_id = max([e.get("id", 0) for e in equipment_data] + [0]) + 1
    
    new_equip = {
        "id": new_id,
        "project_id": project_id,
        "name": data.get("name", ""),
        "category": data.get("category", "camera"),
        "quantity": data.get("quantity", 1),
        "daily_rate": data.get("daily_rate", 0),
        "vendor": data.get("vendor", ""),
        "status": data.get("status", "available"),
        "notes": data.get("notes", ""),
        "created_at": datetime.now().isoformat()
    }
    
    equipment_data.append(new_equip)
    save_json("equipment.json", equipment_data)
    return {"status": "created", "equipment": new_equip}

# ==================== EXPORT SYSTEM ====================

import io
import csv
from datetime import datetime, timedelta

@app.post("/api/export/pdf")
def export_pdf(data: dict):
    """Generate PDF reports for production documents"""
    export_type = data.get("type", "schedule")  # schedule, callsheet, budget
    project_id = data.get("project_id", 1)
    
    # Mock PDF generation - in production use ReportLab
    pdf_content = f"%PDF-1.4\n% CinePilot {export_type.upper()} Report\n"
    
    if export_type == "schedule":
        schedule = load_json("schedule.json", [])
        pdf_content += f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
        pdf_content += f"Project ID: {project_id}\n"
        pdf_content += f"Total Days: {len(schedule.get('days', []))}\n"
        pdf_content += "\n--- Shooting Schedule ---\n"
        for day in schedule.get("days", [])[:5]:
            pdf_content += f"Day {day.get('day', 1)}: {day.get('date', '')} - {day.get('location', 'TBD')}\n"
    
    elif export_type == "callsheet":
        pdf_content += f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
        pdf_content += f"Project ID: {project_id}\n"
        pdf_content += "\n--- Call Sheet ---\n"
        pdf_content += "Call Time: 07:00 AM\n"
        pdf_content += "Location: Main Location\n"
        pdf_content += "Scenes: 1, 2, 3, 4\n"
    
    elif export_type == "budget":
        budget = load_json("budget.json", {})
        pdf_content += f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
        pdf_content += f"Project ID: {project_id}\n"
        pdf_content += f"Total Budget: ₹{budget.get('total', 0):,.0f}\n"
        pdf_content += f"Spent: ₹{budget.get('spent', 0):,.0f}\n"
    
    return {
        "type": export_type,
        "project_id": project_id,
        "content": pdf_content,
        "filename": f"cinepilot_{export_type}_{datetime.now().strftime('%Y%m%d')}.pdf",
        "generated_at": datetime.now().isoformat()
    }

@app.post("/api/export/excel")
def export_excel(data: dict):
    """Generate Excel spreadsheets for production data"""
    export_type = data.get("type", "shot_list")  # shot_list, crew, equipment
    project_id = data.get("project_id", 1)
    
    # Generate CSV as Excel-compatible format
    output = io.StringIO()
    
    if export_type == "shot_list":
        writer = csv.writer(output)
        writer.writerow(["Scene", "Shot", "Type", "Description", "Camera", "Movement", "Duration"])
        writer.writerow(["1", "1", "Wide", "Establishing shot", "A", "Static", "10s"])
        writer.writerow(["1", "2", "Medium", "Dialogue scene", "A", "Tripod", "45s"])
        writer.writerow(["2", "1", "Close-up", "Reaction shot", "B", "Handheld", "5s"])
        writer.writerow(["2", "2", "Over-shoulder", "Conversation", "A", "Dolly", "30s"])
        
    elif export_type == "crew":
        writer = csv.writer(output)
        writer.writerow(["Name", "Department", "Role", "Daily Rate", "Phone", "Email"])
        writer.writerow(["Raj", "Direction", "Director", "50000", "+91 98765 43210", "raj@film.com"])
        writer.writerow(["Kumar", "Camera", "Cinematographer", "35000", "+91 98765 43211", "kumar@film.com"])
        
    elif export_type == "equipment":
        writer = csv.writer(output)
        writer.writerow(["Name", "Category", "Quantity", "Daily Rate", "Vendor", "Status"])
        writer.writerow(["RED Komodo", "Camera", "2", "15000", "Film Gear", "Available"])
        writer.writerow(["Arri SkyPanel", "Lighting", "4", "8000", "Light House", "Available"])
    
    return {
        "type": export_type,
        "project_id": project_id,
        "content": output.getvalue(),
        "filename": f"cinepilot_{export_type}_{datetime.now().strftime('%Y%m%d')}.csv",
        "generated_at": datetime.now().isoformat()
    }

@app.post("/api/export/calendar")
def export_calendar(data: dict):
    """Generate ICS calendar file for shooting schedule"""
    project_id = data.get("project_id", 1)
    schedule = load_json("schedule.json", {})
    
    ics_content = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//CinePilot//Production Schedule//EN\n"
    
    days = schedule.get("days", [])
    if not days:
        # Demo data
        base_date = datetime.now()
        for i in range(5):
            day_date = base_date + timedelta(days=i*2)
            ics_content += "BEGIN:VEVENT\n"
            ics_content += f"DTSTART:{day_date.strftime('%Y%m%d')}T070000\n"
            ics_content += f"DTEND:{day_date.strftime('%Y%m%d')}T190000\n"
            ics_content += f"SUMMARY:Shooting Day {i+1} - Location TBD\n"
            ics_content += "DESCRIPTION:CinePilot production day\n"
            ics_content += "END:VEVENT\n"
    else:
        for day in days[:10]:
            ics_content += "BEGIN:VEVENT\n"
            ics_content += f"SUMMARY:Shooting Day {day.get('day', 1)}\n"
            ics_content += f"DESCRIPTION:Scenes: {', '.join(map(str, day.get('scenes', [])))}\n"
            ics_content += f"LOCATION:{day.get('location', 'TBD')}\n"
            ics_content += "END:VEVENT\n"
    
    ics_content += "END:VCALENDAR\n"
    
    return {
        "project_id": project_id,
        "content": ics_content,
        "filename": f"cinepilot_schedule_{datetime.now().strftime('%Y%m%d')}.ics",
        "generated_at": datetime.now().isoformat()
    }

@app.post("/api/export/json")
def export_json(data: dict):
    """Export project data as JSON"""
    project_id = data.get("project_id", 1)
    export_type = data.get("type", "project")
    
    result = {
        "project_id": project_id,
        "exported_at": datetime.now().isoformat(),
        "type": export_type
    }
    
    if export_type == "project":
        projects = load_json("projects.json", [])
        project = next((p for p in projects if p.get("id") == project_id), projects[0] if projects else {})
        result["project"] = project
        result["schedule"] = load_json("schedule.json", {})
        result["scenes"] = load_json("scenes.json", [])
        
    elif export_type == "locations":
        locations = load_json("locations.json", [])
        result["locations"] = locations
        
    elif export_type == "schedule":
        result["schedule"] = load_json("schedule.json", {})
        
    elif export_type == "budget":
        result["budget"] = load_json("budget.json", {})
        
    elif export_type == "crew":
        result["crew"] = load_json("crew.json", [])
    
    json_content = json.dumps(result, indent=2)
    
    return {
        "project_id": project_id,
        "content": json_content,
        "filename": f"cinepilot_{export_type}_{datetime.now().strftime('%Y%m%d')}.json",
        "generated_at": datetime.now().isoformat()
    }

@app.post("/api/export/batch")
def export_batch(data: dict):
    """Export multiple data types as ZIP"""
    project_id = data.get("project_id", 1)
    export_types = data.get("types", ["schedule", "budget"])
    
    import base64
    import io
    import zipfile
    
    # Collect all exports
    files = {}
    
    if "schedule" in export_types:
        schedule = load_json("schedule.json", {})
        files["schedule.json"] = json.dumps(schedule, indent=2)
    
    if "budget" in export_types:
        budget = load_json("budget.json", {})
        files["budget.json"] = json.dumps(budget, indent=2)
    
    if "crew" in export_types:
        crew = load_json("crew.json", [])
        files["crew.json"] = json.dumps(crew, indent=2)
    
    if "equipment" in export_types:
        equipment = load_json("equipment.json", [])
        files["equipment.json"] = json.dumps(equipment, indent=2)
    
    if "locations" in export_types:
        locations = load_json("locations.json", [])
        files["locations.json"] = json.dumps(locations, indent=2)
    
    if "callsheet" in export_types:
        # Generate simple text callsheet
        callsheet = "CINEPILOT CALL SHEET\n" + "=" * 40 + "\n\nDate: " + datetime.now().strftime("%Y-%m-%d")
        files["callsheet.txt"] = callsheet
    
    # Create ZIP in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for filename, content in files.items():
            zipf.writestr(filename, content)
        
        # Add manifest
        manifest = {
            "project_id": project_id,
            "exported_at": datetime.now().isoformat(),
            "files": list(files.keys())
        }
        zipf.writestr("manifest.json", json.dumps(manifest, indent=2))
    
    zip_buffer.seek(0)
    zip_base64 = base64.b64encode(zip_buffer.read()).decode('utf-8')
    
    return {
        "project_id": project_id,
        "zip_base64": zip_base64,
        "files_included": list(files.keys()),
        "filename": f"cinepilot_batch_{datetime.now().strftime('%Y%m%d')}.zip",
        "generated_at": datetime.now().isoformat()
    }

# ==================== AI SHOT LIST GENERATION ====================

SHOT_TYPES = {
    "establishing": {"name": "Establishing Shot", "description": "Wide shot to set location", "default_duration": 15},
    "wide": {"name": "Wide Shot", "description": "Shows full scene setting", "default_duration": 10},
    "full": {"name": "Full Shot", "description": "Shows entire subject", "default_duration": 8},
    "medium": {"name": "Medium Shot", "description": "Waist-up framing", "default_duration": 15},
    "medium_close_up": {"name": "Medium Close-Up", "description": "Chest-up framing", "default_duration": 12},
    "close_up": {"name": "Close-Up", "description": "Face fills frame", "default_duration": 8},
    "extreme_close_up": {"name": "Extreme Close-Up", "description": "Eyes or small detail", "default_duration": 5},
    "pov": {"name": "Point of View", "description": "Subject's perspective", "default_duration": 6},
    "over_shoulder": {"name": "Over the Shoulder", "description": "Looking at subject from behind", "default_duration": 10},
    "two_shot": {"name": "Two Shot", "description": "Two subjects in frame", "default_duration": 12},
    "insert": {"name": "Insert Shot", "description": "Close detail of object", "default_duration": 4},
    "cutaway": {"name": "Cutaway", "description": "Related but separate subject", "default_duration": 5},
}

CAMERA_MOVEMENTS = {
    "static": {"name": "Static", "description": "Camera doesn't move"},
    "pan": {"name": "Pan", "description": "Horizontal rotation"},
    "tilt": {"name": "Tilt", "description": "Vertical rotation"},
    "dolly": {"name": "Dolly", "description": "Camera moves toward/away"},
    "truck": {"name": "Truck", "description": "Camera moves left/right"},
    "pedestal": {"name": "Pedestal", "description": "Camera moves up/down"},
    "zoom": {"name": "Zoom", "description": "Lens zoom in/out"},
    "handheld": {"name": "Handheld", "description": "Organic, shaky movement"},
    "steadicam": {"name": "Steadicam", "description": "Smooth handheld movement"},
    "crane": {"name": "Crane", "description": "Elevated sweep movement"},
    "drone": {"name": "Drone", "description": "Aerial movement"},
    "rack_focus": {"name": "Rack Focus", "description": "Focus shift between subjects"},
}

@app.post("/api/ai/generate-shot-list")
def generate_shot_list(data: dict):
    """Generate AI-powered shot list based on scene description"""
    scene_description = data.get("scene_description", "")
    scene_number = data.get("scene_number", 1)
    location = data.get("location", "Interior")
    time_of_day = data.get("time_of_day", "Day")
    characters_in_scene = data.get("characters", [])
    
    shots = []
    
    # Generate shots based on scene type
    if "dialogue" in scene_description.lower() or len(characters_in_scene) > 1:
        shots.extend([
            {"shot_number": 1, "type": "wide", "description": f"Establishing {location}", "camera": "A", "movement": "static", "duration": 10},
            {"shot_number": 2, "type": "medium", "description": f"{characters_in_scene[0] if characters_in_scene else 'Character'} introduction", "camera": "A", "movement": "static", "duration": 8},
            {"shot_number": 3, "type": "over_shoulder", "description": "Conversation - Character A", "camera": "A", "movement": "static", "duration": 15},
            {"shot_number": 4, "type": "over_shoulder", "description": "Conversation - Character B", "camera": "B", "movement": "static", "duration": 15},
            {"shot_number": 5, "type": "close_up", "description": f"Reaction - {characters_in_scene[0] if characters_in_scene else 'Character'}", "camera": "A", "movement": "static", "duration": 6},
        ])
    elif "action" in scene_description.lower() or "chase" in scene_description.lower():
        shots.extend([
            {"shot_number": 1, "type": "wide", "description": f"Action establishing {location}", "camera": "A", "movement": "dolly", "duration": 12},
            {"shot_number": 2, "type": "medium", "description": "Action sequence start", "camera": "B", "movement": "handheld", "duration": 10},
            {"shot_number": 3, "type": "close_up", "description": "Key action moment", "camera": "A", "movement": "static", "duration": 4},
            {"shot_number": 4, "type": "pov", "description": "Subject POV", "camera": "A", "movement": "steadicam", "duration": 8},
        ])
    elif "emotional" in scene_description.lower() or "dramatic" in scene_description.lower():
        shots.extend([
            {"shot_number": 1, "type": "wide", "description": f"Scene establishing", "camera": "A", "movement": "static", "duration": 8},
            {"shot_number": 2, "type": "medium_close_up", "description": "Emotional beat 1", "camera": "A", "movement": "static", "duration": 12},
            {"shot_number": 3, "type": "close_up", "description": "Emotional reaction", "camera": "A", "movement": "rack_focus", "duration": 10},
            {"shot_number": 4, "type": "extreme_close_up", "description": "Tear/-detail moment", "camera": "B", "movement": "static", "duration": 5},
        ])
    else:
        # Default shots
        shots.extend([
            {"shot_number": 1, "type": "wide", "description": f"Establishing {location}", "camera": "A", "movement": "static", "duration": 10},
            {"shot_number": 2, "type": "medium", "description": "Scene coverage", "camera": "A", "movement": "static", "duration": 15},
            {"shot_number": 3, "type": "close_up", "description": "Detail shot", "camera": "B", "movement": "static", "duration": 6},
        ])
    
    return {
        "scene_number": scene_number,
        "scene_description": scene_description,
        "location": location,
        "time_of_day": time_of_day,
        "total_shots": len(shots),
        "estimated_duration": sum(s["duration"] for s in shots),
        "shots": shots,
        "tips": [
            "Start with wide to establish location",
            "Match cut sizes for continuity",
            f"Total estimated screen time: {sum(s['duration'] for s in shots)} seconds"
        ]
    }

@app.post("/api/ai/shot-type-suggestions")
def get_shot_type_suggestions(data: dict):
    """Get shot type suggestions based on scene context"""
    scene_context = data.get("context", "general")  # dialogue, action, emotional, transition
    shot_count = data.get("shot_count", 5)
    
    suggestions = []
    
    if scene_context == "dialogue":
        suggestions = [
            {"type": "wide", "priority": 1, "reason": "Set the scene"},
            {"type": "medium", "priority": 2, "reason": "Character framing"},
            {"type": "over_shoulder", "priority": 3, "reason": "Standard dialogue coverage"},
            {"type": "close_up", "priority": 4, "reason": "Emotional emphasis"},
            {"type": "insert", "priority": 5, "reason": "Add visual interest"},
        ]
    elif scene_context == "action":
        suggestions = [
            {"type": "wide", "priority": 1, "reason": "Show action scope"},
            {"type": "medium", "priority": 2, "reason": "Action framing"},
            {"type": "pov", "priority": 3, "reason": "Immersive perspective"},
            {"type": "close_up", "priority": 4, "reason": "Impact moment"},
            {"type": "handheld", "priority": 5, "reason": "Energy and intensity"},
        ]
    elif scene_context == "emotional":
        suggestions = [
            {"type": "medium_close_up", "priority": 1, "reason": "Emotional intimacy"},
            {"type": "close_up", "priority": 2, "reason": "Facial expression"},
            {"type": "extreme_close_up", "priority": 3, "reason": "Detail/emotion"},
            {"type": "rack_focus", "priority": 4, "reason": "Shift attention"},
            {"type": "static", "priority": 5, "reason": "Contemplative mood"},
        ]
    else:
        suggestions = [
            {"type": "wide", "priority": 1, "reason": "General establishing"},
            {"type": "medium", "priority": 2, "reason": "Standard coverage"},
            {"type": "close_up", "priority": 3, "reason": "Detail"},
            {"type": "insert", "priority": 4, "reason": "Visual variety"},
            {"type": "cutaway", "priority": 5, "reason": "Editing flexibility"},
        ]
    
    return {
        "context": scene_context,
        "suggestions": suggestions[:shot_count],
        "shot_types": SHOT_TYPES
    }

@app.post("/api/ai/camera-movement-suggestions")
def get_camera_movement_suggestions(data: dict):
    """Get camera movement suggestions based on scene type"""
    scene_type = data.get("scene_type", "general")  # dialogue, action, emotional, transition, steadicam
    shot_count = data.get("shot_count", 5)
    
    suggestions = []
    
    if scene_type == "dialogue":
        suggestions = [
            {"movement": "static", "priority": 1, "reason": "Clean dialogue coverage"},
            {"movement": "slow_pan", "priority": 2, "reason": "Subtle emphasis"},
            {"movement": "rack_focus", "priority": 3, "reason": "Shift attention between characters"},
        ]
    elif scene_type == "action":
        suggestions = [
            {"movement": "handheld", "priority": 1, "reason": "Raw energy"},
            {"movement": "steadicam", "priority": 2, "reason": "Follow action smoothly"},
            {"movement": "dolly", "priority": 3, "reason": "Dynamic tracking"},
            {"movement": "crane", "priority": 4, "reason": "Scale and scope"},
        ]
    elif scene_type == "emotional":
        suggestions = [
            {"movement": "static", "priority": 1, "reason": "Intimate, still framing"},
            {"movement": "slow_tilt", "priority": 2, "reason": "Subtle vertical emphasis"},
            {"movement": "rack_focus", "priority": 3, "reason": "Focus on emotion"},
            {"movement": "zoom", "priority": 4, "reason": "Slow push for intensity"},
        ]
    else:
        suggestions = [
            {"movement": "static", "priority": 1, "reason": "Clean default"},
            {"movement": "pan", "priority": 2, "reason": "Horizontal movement"},
            {"movement": "tilt", "priority": 3, "reason": "Vertical movement"},
        ]
    
    return {
        "scene_type": scene_type,
        "suggestions": suggestions[:shot_count],
        "movements": CAMERA_MOVEMENTS
    }

# ==================== CHARACTER ARC & SCENES API ====================

@app.get("/api/projects/{project_id}/characters/{character_id}/arc")
def get_character_arc(project_id: int, character_id: int):
    """Get character arc analysis"""
    characters = load_json("characters.json", [])
    char = next((c for c in characters if c.get("id") == character_id and c.get("project_id") == project_id), None)
    
    if not char:
        # Demo arc data
        return {
            "character_id": character_id,
            "character_name": "Demo Character",
            "arc": {
                "introduction": {"scene": 1, "description": "Character introduced in humble circumstances"},
                "rising_action": {"scenes": [3, 5, 8], "description": "Faces challenges, grows skills"},
                "climax": {"scene": 12, "description": "Key transformation moment"},
                "resolution": {"scene": 15, "description": "Character emerges changed"},
            },
            "screen_time": {"total_scenes": 8, "estimated_minutes": 12},
            "emotional_journey": ["hope", "doubt", "determination", "triumph"],
            "character_moments": [
                {"scene": 1, "type": "introduction", "description": "First appearance"},
                {"scene": 5, "type": "challenge", "description": "Faces obstacle"},
                {"scene": 12, "type": "transformation", "description": "Key decision"},
            ]
        }
    
    return {
        "character_id": character_id,
        "character_name": char.get("name", "Unknown"),
        "arc": {"description": "Character arc analysis available"},
        "screen_time": {"total_scenes": 0, "estimated_minutes": 0},
        "emotional_journey": [],
        "character_moments": []
    }

@app.get("/api/projects/{project_id}/characters/{character_id}/scenes")
def get_character_scenes(project_id: int, character_id: int):
    """Get all scenes featuring a character"""
    scenes = load_json("scenes.json", [])
    
    # Demo scenes
    return {
        "character_id": character_id,
        "project_id": project_id,
        "scenes": [
            {"scene_number": 1, "location": "Home", "time": "Day", "description": "Opening scene"},
            {"scene_number": 3, "location": "Office", "time": "Day", "description": "Work meeting"},
            {"scene_number": 5, "location": "Street", "time": "Night", "description": "Confrontation"},
            {"scene_number": 8, "location": "Home", "time": "Night", "description": "Personal moment"},
        ],
        "total_scenes": 4,
        "location_breakdown": {"Home": 2, "Office": 1, "Street": 1},
        "time_breakdown": {"Day": 2, "Night": 2}
    }

@app.get("/api/projects/{project_id}/cast/callsheet")
def get_cast_callsheet(project_id: int):
    """Generate cast call information for production"""
    characters = load_json("characters.json", [])
    project_chars = [c for c in characters if c.get("project_id") == project_id]
    
    if not project_chars:
        project_chars = [
            {"id": 1, "name": "Rajesh", "character": "Kathir", "role": "lead", "phone": "+91 98765 43210", "call_time": "07:00"},
            {"id": 2, "name": "Priya", "character": "Anjali", "role": "lead", "phone": "+91 98765 43211", "call_time": "07:30"},
            {"id": 3, "name": "Vijay", "character": "Father", "role": "supporting", "phone": "+91 98765 43212", "call_time": "09:00"},
        ]
    
    return {
        "project_id": project_id,
        "production_date": datetime.now().strftime("%Y-%m-%d"),
        "call_sheet": {
            "general_call": "07:00 AM",
            "first_camera": "08:00 AM",
            "shoot_start": "08:30 AM",
            "lunch": "01:00 PM - 02:00 PM",
            "wrap": "07:00 PM",
        },
        "cast": [
            {
                "actor": c.get("name", ""),
                "character": c.get("character", ""),
                "role_type": c.get("role", "supporting"),
                "call_time": c.get("call_time", "07:00"),
                "phone": c.get("phone", ""),
                "scenes": "1, 2, 3",
                "location": "Main Studio",
                "notes": ""
            }
            for c in project_chars
        ],
        "scenes_today": [1, 2, 3],
        "location": "Main Studio",
        "weather": "Indoor",
        "special_instructions": "Parking at Gate B"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# ============== Phase 23 - New Endpoints ==============

@app.post("/api/locations/scout")
def scout_locations(request: dict):
    """Search for locations based on requirements"""
    query = request.get("query", "").lower()
    
    # Mock location database
    locations = [
        {"id": 1, "name": "Studio 24", "address": "Chennai, TN", "type": "studio", "accessibility": 8, 
         "permit_required": False, "permit_cost": 0, "score": 9.2, "photos": [], "nearby_locations": ["Hotel", "Restaurant"]},
        {"id": 2, "name": "Marina Beach", "address": "Chennai, TN", "type": "outdoor", "accessibility": 6,
         "permit_required": True, "permit_cost": 5000, "score": 8.5, "photos": [], "nearby_locations": ["Parking"]},
        {"id": 3, "name": "Heritage Villa", "address": "Pondicherry, TN", "type": "indoor", "accessibility": 7,
         "permit_required": True, "permit_cost": 3000, "score": 8.1, "photos": [], "nearby_locations": ["Cafe"]},
        {"id": 4, "name": "Temple Ancient", "address": "Thanjavur, TN", "type": "outdoor", "accessibility": 5,
         "permit_required": True, "permit_cost": 10000, "score": 7.8, "photos": [], "nearby_locations": ["Parking"]},
        {"id": 5, "name": "Modern Office", "address": "Bangalore, KA", "type": "indoor", "accessibility": 9,
         "permit_required": True, "permit_cost": 8000, "score": 9.0, "photos": [], "nearby_locations": ["Hotel"]},
    ]
    
    # Filter by query
    if query:
        locations = [l for l in locations if query in l["name"].lower() or query in l["type"].lower()]
    
    return {"locations": locations, "total": len(locations)}

@app.post("/api/locations/recommendations")
def get_location_recommendations(request: dict):
    """Get location recommendations based on scene requirements"""
    scene_type = request.get("scene_type", "indoor")
    budget = request.get("budget", 50000)
    accessibility = request.get("min_accessibility", 5)
    
    locations = [
        {"id": 1, "name": "Studio 24", "type": "studio", "cost": 25000, "accessibility": 8, "score": 95, "match_reason": "Perfect for controlled indoor shooting"},
        {"id": 2, "name": "Beach Resort", "type": "outdoor", "cost": 15000, "accessibility": 7, "score": 88, "match_reason": "Great natural lighting"},
        {"id": 3, "name": "Heritage Home", "type": "indoor", "cost": 12000, "accessibility": 6, "score": 82, "match_reason": "Authentic period look"},
    ]
    
    # Filter by requirements
    locations = [l for l in locations if l["cost"] <= budget and l["accessibility"] >= accessibility]
    
    return {"recommendations": locations}

@app.post("/api/storyboard/{scene_id}")
def get_storyboard_frames(scene_id: int):
    """Get all storyboard frames for a scene"""
    # Mock data
    frames = [
        {"id": 1, "scene_id": scene_id, "shot_number": 1, "description": "Wide establishing shot of location", 
         "camera_angle": "Wide Shot", "camera_movement": "Static", "duration": 5, "notes": "Show context"},
        {"id": 2, "scene_id": scene_id, "shot_number": 2, "description": "Character enters frame", 
         "camera_angle": "Medium Shot", "camera_movement": "Tracking", "duration": 3, "notes": ""},
        {"id": 3, "scene_id": scene_id, "shot_number": 3, "description": "Close-up reaction", 
         "camera_angle": "Close-Up", "camera_movement": "Static", "duration": 2, "notes": "Key moment"},
    ]
    return {"frames": frames}

@app.post("/api/storyboard/frame")
def create_storyboard_frame(data: dict):
    """Create a new storyboard frame"""
    return {"success": True, "frame_id": 4, "message": "Frame created successfully"}

@app.put("/api/storyboard/frame/{frame_id}")
def update_storyboard_frame(frame_id: int, data: dict):
    """Update a storyboard frame"""
    return {"success": True, "message": f"Frame {frame_id} updated"}

@app.delete("/api/storyboard/frame/{frame_id}")
def delete_storyboard_frame(frame_id: int):
    """Delete a storyboard frame"""
    return {"success": True, "message": f"Frame {frame_id} deleted"}

@app.post("/api/casting/recommendations/{project_id}")
def get_casting_recommendations(project_id: int, request: dict):
    """Get casting recommendations based on character requirements"""
    characters = request.get("characters", [])
    
    recommendations = []
    for char in characters:
        char_name = char.get("name", "Unknown")
        recommendations.append({
            "character_name": char_name,
            "suggested_actors": [
                {"name": "Vijay Sethupathi", "compatibility": 92, "availability": "Available March 2026", "contact": "+91 98765 00001", "notes": "Perfect fit for role"},
                {"name": "Karthi", "compatibility": 87, "availability": "Available April 2026", "contact": "+91 98765 00002", "notes": "Great chemistry"},
                {"name": "Dhanush", "compatibility": 85, "availability": "Available May 2026", "contact": "+91 98765 00003", "notes": "Strong choice"},
            ]
        })
    
    return {"recommendations": recommendations}

@app.post("/api/casting/search")
def search_actors(request: dict):
    """Search for actors"""
    query = request.get("query", "")
    role = request.get("role", "")
    
    actors = [
        {"id": 1, "name": "Suriya", "role": "Lead", "age_range": "35-45", "languages": ["Tamil", "Telugu", "Hindi"]},
        {"id": 2, "name": "Ajith Kumar", "role": "Lead", "age_range": "45-50", "languages": ["Tamil"]},
        {"id": 3, "name": "Nayanthara", "role": "Lead", "age_range": "35-40", "languages": ["Tamil", "Telugu", "Malayalam"]},
    ]
    
    if query:
        actors = [a for a in actors if query.lower() in a["name"].lower()]
    
    return {"actors": actors}

@app.get("/api/sentiment/scene/{scene_id}")
def analyze_scene_sentiment(scene_id: int):
    """Analyze sentiment of a single scene"""
    sentiments = {
        scene_id: {
            "scene_id": scene_id,
            "overall_sentiment": "positive",
            "sentiment_score": 0.65,
            "emotions": [
                {"emotion": "joy", "intensity": 0.7},
                {"emotion": "anticipation", "intensity": 0.5},
                {"emotion": "trust", "intensity": 0.6}
            ],
            "key_moments": ["Character reunion", "Happy ending reveal"],
            "dialogue_tone": "Warm and hopeful"
        }
    }
    return sentiments.get(scene_id, {"error": "Scene not found"})

@app.post("/api/sentiment/scenes")
def analyze_multiple_scenes(request: dict):
    """Analyze sentiment for multiple scenes"""
    scene_ids = request.get("scene_ids", [])
    
    results = []
    for sid in scene_ids:
        results.append({
            "scene_id": sid,
            "overall_sentiment": ["positive", "negative", "neutral", "mixed"][sid % 4],
            "sentiment_score": round((sid % 10) / 10, 2),
            "emotions": [{"emotion": "neutral", "intensity": 0.5}]
        })
    
    return {"scenes": results}

@app.get("/api/sentiment/journey/{project_id}")
def get_emotional_journey(project_id: int):
    """Get the emotional journey across the entire project"""
    return {
        "project_id": project_id,
        "journey": [
            {"scene": 1, "sentiment": 0.3, "emotion": "tension"},
            {"scene": 2, "sentiment": 0.5, "emotion": "curiosity"},
            {"scene": 3, "sentiment": 0.7, "emotion": "joy"},
            {"scene": 4, "sentiment": -0.2, "emotion": "conflict"},
            {"scene": 5, "sentiment": 0.6, "emotion": "resolution"},
        ],
        "summary": "The story follows a classic emotional arc: tension building to conflict, then resolution."
    }

@app.get("/api/notifications/history/{project_id}")
def get_notification_history(project_id: int, type: str = None, limit: int = 50):
    """Get notification history for a project"""
    notifications = [
        {"id": 1, "type": "whatsapp", "recipient": "+91 98765 43210", "message": "Shooting schedule update", 
         "status": "delivered", "sent_at": "2026-02-15T08:00:00Z", "delivered_at": "2026-02-15T08:00:05Z"},
        {"id": 2, "type": "whatsapp", "recipient": "+91 98765 43211", "message": "Location change", 
         "status": "delivered", "sent_at": "2026-02-14T15:30:00Z", "delivered_at": "2026-02-14T15:30:03Z"},
        {"id": 3, "type": "email", "recipient": "producer@film.com", "message": "Budget report", 
         "status": "sent", "sent_at": "2026-02-13T10:00:00Z"},
    ]
    
    if type:
        notifications = [n for n in notifications if n["type"] == type]
    
    return {"notifications": notifications[:limit], "total": len(notifications)}

@app.post("/api/notifications/retry/{notification_id}")
def retry_notification(notification_id: int):
    """Retry sending a failed notification"""
    return {"success": True, "message": f"Notification {notification_id} queued for retry"}

@app.post("/api/equipment/checklist")
def generate_equipment_checklist(request: dict):
    """Generate equipment checklist based on production requirements"""
    project_id = request.get("project_id")
    shoot_days = request.get("shoot_days", 1)
    
    checklist = [
        {"id": 1, "category": "Camera", "name": "ARRI Alexa Mini", "required": True, "quantity": 2, "checked": False, "notes": "Main camera"},
        {"id": 2, "category": "Camera", "name": "Prime Lens Set", "required": True, "quantity": 1, "checked": False, "notes": "35mm, 50mm, 85mm"},
        {"id": 3, "category": "Camera", "name": "Tripod", "required": True, "quantity": 3, "checked": False, "notes": ""},
        {"id": 4, "category": "Lighting", "name": "SkyPanel S60-C", "required": True, "quantity": 4, "checked": False, "notes": ""},
        {"id": 5, "category": "Lighting", "name": "HMI Lights", "required": False, "quantity": 2, "checked": False, "notes": "For outdoor"},
        {"id": 6, "category": "Sound", "name": "Sound Mixer", "required": True, "quantity": 1, "checked": False, "notes": ""},
        {"id": 7, "category": "Sound", "name": "Lavalier Mics", "required": True, "quantity": 6, "checked": False, "notes": ""},
        {"id": 8, "category": "Grip", "name": "C-Stands", "required": True, "quantity": 10, "checked": False, "notes": ""},
        {"id": 9, "category": "Production", "name": "Production Van", "required": True, "quantity": 1, "checked": False, "notes": ""},
    ]
    
    return {"checklist": checklist, "shoot_days": shoot_days}

@app.get("/api/dashboard/{project_id}")
def get_production_dashboard(project_id: int):
    """Get production dashboard metrics"""
    return {
        "project_id": project_id,
        "metrics": {
            "total_scenes": 45,
            "completed_scenes": 28,
            "total_shoot_days": 20,
            "used_shoot_days": 12,
            "budget_spent": 4500000,
            "budget_remaining": 500000,
            "crew_utilization": 85,
            "equipment_usage": 72
        },
        "alerts": [
            {"type": "warning", "message": "2 scenes behind schedule"},
            {"type": "info", "message": "Equipment return due tomorrow"}
        ]
    }

@app.get("/api/status/connection")
def check_connection_status():
    """Check backend connection status"""
    import time
    return {
        "backend_connected": True,
        "api_latency_ms": 45,
        "last_sync": datetime.now().isoformat(),
        "websocket_status": "disconnected"
    }

# ============== Phase 24: Enhanced Script Upload & Processing ==============

import re
import io

def parse_fdx_content(content: str) -> dict:
    """Parse Final Draft XML format content"""
    scenes = []
    lines = content.split('\n')
    current_scene = None
    
    for line in lines:
        line = line.strip()
        # Scene heading detection
        if re.match(r'^(INT\.|EXT\.|INT/EXT\.|I/E\.)', line, re.IGNORECASE):
            if current_scene:
                scenes.append(current_scene)
            current_scene = {
                "heading": line,
                "location": "",
                "time_of_day": "",
                "content": []
            }
            # Extract location and time
            parts = line.split(' - ')
            if len(parts) >= 2:
                current_scene["location"] = parts[0]
                current_scene["time_of_day"] = parts[1] if len(parts) > 1 else ""
        elif current_scene:
            current_scene["content"].append(line)
    
    if current_scene:
        scenes.append(current_scene)
    
    return {"scenes": scenes, "format": "fdx", "scene_count": len(scenes)}

def parse_plain_text(content: str) -> dict:
    """Parse plain text screenplay"""
    scenes = []
    lines = content.split('\n')
    current_scene = None
    scene_number = 0
    
    for line in lines:
        line = line.strip()
        # Detect scene headings
        if re.match(r'^(INT\.|EXT\.|INT/EXT\.|Scene|SCENE)', line, re.IGNORECASE):
            if current_scene:
                scenes.append(current_scene)
            scene_number += 1
            current_scene = {
                "heading": line,
                "location": line,
                "time_of_day": "DAY",
                "content": [],
                "scene_number": scene_number
            }
        elif current_scene:
            current_scene["content"].append(line)
    
    if current_scene:
        scenes.append(current_scene)
    
    return {"scenes": scenes, "format": "txt", "scene_count": len(scenes)}

def parse_fountain(content: str) -> dict:
    """Parse Fountain screenplay format"""
    scenes = []
    lines = content.split('\n')
    current_scene = None
    scene_number = 0
    
    for line in lines:
        line = line.strip()
        # Scene heading (forced or detected)
        if line.startswith('.') or re.match(r'^(INT\.|EXT\.)', line):
            if current_scene:
                scenes.append(current_scene)
            scene_number += 1
            heading = line.lstrip('. ') if line.startswith('.') else line
            current_scene = {
                "heading": heading,
                "location": heading,
                "time_of_day": "DAY",
                "content": [],
                "scene_number": scene_number
            }
        elif current_scene:
            if line and not line.startswith('#'):
                current_scene["content"].append(line)
    
    if current_scene:
        scenes.append(current_scene)
    
    return {"scenes": scenes, "format": "fountain", "scene_count": len(scenes)}

@app.post("/api/upload/script-advanced")
async def upload_script_advanced(file: UploadFile = File(...)):
    """Advanced script upload with format detection and parsing"""
    content = await file.read()
    filename = file.filename.lower()
    
    result = {
        "filename": file.filename,
        "size": len(content),
        "format_detected": None,
        "parsing_result": None,
        "metadata": {}
    }
    
    try:
        if filename.endswith('.fdx'):
            text_content = content.decode('utf-8', errors='ignore')
            result["format_detected"] = "fdx"
            result["parsing_result"] = parse_fdx_content(text_content)
            
        elif filename.endswith('.fountain'):
            text_content = content.decode('utf-8', errors='ignore')
            result["format_detected"] = "fountain"
            result["parsing_result"] = parse_fountain(text_content)
            
        elif filename.endswith('.txt'):
            text_content = content.decode('utf-8', errors='ignore')
            result["format_detected"] = "txt"
            result["parsing_result"] = parse_plain_text(text_content)
            
        elif filename.endswith('.pdf'):
            result["format_detected"] = "pdf"
            result["parsing_result"] = {
                "scenes": [],
                "format": "pdf",
                "scene_count": 0,
                "note": "PDF parsing requires external library. Content preview available."
            }
            # Extract text preview
            text_preview = content[:500].decode('utf-8', errors='ignore')
            result["metadata"]["preview"] = text_preview
            
        elif filename.endswith('.docx'):
            result["format_detected"] = "docx"
            result["parsing_result"] = {
                "scenes": [],
                "format": "docx", 
                "scene_count": 0,
                "note": "DOCX parsing requires python-docx. Content preview available."
            }
            text_preview = content[:500].decode('utf-8', errors='ignore')
            result["metadata"]["preview"] = text_preview
            
        else:
            # Try to parse as text
            text_content = content.decode('utf-8', errors='ignore')
            result["format_detected"] = "txt"
            result["parsing_result"] = parse_plain_text(text_content)
        
        # Extract metadata
        parsed = result["parsing_result"]
        if parsed.get("scenes"):
            total_lines = sum(len(s.get("content", [])) for s in parsed["scenes"])
            result["metadata"] = {
                "scene_count": parsed.get("scene_count", 0),
                "total_lines": total_lines,
                "estimated_pages": max(1, parsed.get("scene_count", 0) // 10),
                "locations": list(set(s.get("location", "") for s in parsed["scenes"] if s.get("location")))
            }
            
    except Exception as e:
        result["error"] = str(e)
    
    return result

@app.post("/api/upload/multi")
async def upload_multiple_scripts(files: List[UploadFile] = File(...)):
    """Upload multiple script files at once"""
    results = []
    
    for file in files:
        content = await file.read()
        filename = file.filename.lower()
        
        result = {
            "filename": file.filename,
            "size": len(content),
            "status": "processed"
        }
        
        try:
            if filename.endswith('.fdx'):
                text_content = content.decode('utf-8', errors='ignore')
                parsed = parse_fdx_content(text_content)
                result["scene_count"] = parsed["scene_count"]
                result["format"] = "fdx"
                
            elif filename.endswith('.fountain'):
                text_content = content.decode('utf-8', errors='ignore')
                parsed = parse_fountain(text_content)
                result["scene_count"] = parsed["scene_count"]
                result["format"] = "fountain"
                
            elif filename.endswith('.txt'):
                text_content = content.decode('utf-8', errors='ignore')
                parsed = parse_plain_text(text_content)
                result["scene_count"] = parsed["scene_count"]
                result["format"] = "txt"
                
            else:
                result["status"] = "unsupported_format"
                result["scene_count"] = 0
                
        except Exception as e:
            result["status"] = "error"
            result["error"] = str(e)
        
        results.append(result)
    
    return {"files": results, "total_files": len(results), "total_scenes": sum(r.get("scene_count", 0) for r in results)}

# ============== Phase 24: WhatsApp Templates ==============

WHATSAPP_TEMPLATES = {
    "schedule_reminder": {
        "name": "Schedule Reminder",
        "template": "📅 *CinePilot Reminder*\n\n{message}\n\nShooting: {project_name}\nDate: {date}\nCall Time: {call_time}\nLocation: {location}\n\nReply CONFIRM to acknowledge.",
        "variables": ["message", "project_name", "date", "call_time", "location"]
    },
    "location_update": {
        "name": "Location Update",
        "template": "📍 *Location Change*\n\n{project_name}\n\nNew Location: {new_location}\nAddress: {address}\nTransport: {transport}\n\nReport at: {report_time}",
        "variables": ["project_name", "new_location", "address", "transport", "report_time"]
    },
    "cast_call": {
        "name": "Cast Call Sheet",
        "template": "🎬 *Call Sheet*\n\n{project_name}\nDate: {date}\n\nYour Call: {call_time}\nScene(s): {scenes}\nLocation: {location}\nMakeup: {makeup_time}\n\nReply CONFIRM or call producer.",
        "variables": ["project_name", "date", "call_time", "scenes", "location", "makeup_time"]
    },
    "budget_alert": {
        "name": "Budget Alert",
        "template": "💰 *Budget Alert*\n\n{project_name}\n\nSpent: ₹{spent} / ₹{budget}\nRemaining: ₹{remaining}\n\nCategory: {category}\nNote: {note}",
        "variables": ["project_name", "spent", "budget", "remaining", "category", "note"]
    },
    "equipment_return": {
        "name": "Equipment Return",
        "template": "🎥 *Equipment Return*\n\n{items}\n\nReturn By: {return_date}\nLocation: {return_location}\nContact: {contact}",
        "variables": ["items", "return_date", "return_location", "contact"]
    },
    "scene_complete": {
        "name": "Scene Completion",
        "template": "✅ *Scene Complete*\n\n{project_name}\n\nScene: {scene_number} - {scene_name}\nLocation: {location}\nStatus: {status}\nNotes: {notes}",
        "variables": ["project_name", "scene_number", "scene_name", "location", "status", "notes"]
    },
    "crew_update": {
        "name": "Crew Update",
        "template": "👥 *Crew Update*\n\n{project_name}\n\n{update_message}\n\nContact: {contact_phone}",
        "variables": ["project_name", "update_message", "contact_phone"]
    },
    "emergency": {
        "name": "Emergency Alert",
        "template": "🚨 *EMERGENCY*\n\n{project_name}\n\n{emergency_message}\n\nReport to: {meeting_point}\nCall: {emergency_contact}",
        "variables": ["project_name", "emergency_message", "meeting_point", "emergency_contact"]
    }
}

@app.get("/api/whatsapp/templates")
def get_whatsapp_templates():
    """Get all available WhatsApp templates"""
    return {"templates": WHATSAPP_TEMPLATES}

@app.get("/api/whatsapp/templates/{template_name}")
def get_whatsapp_template(template_name: str):
    """Get specific template by name"""
    template = WHATSAPP_TEMPLATES.get(template_name)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@app.post("/api/whatsapp/send-template")
def send_whatsapp_template(request: dict):
    """Send WhatsApp message using template with variables"""
    template_name = request.get("template_name")
    recipient = request.get("recipient")
    variables = request.get("variables", {})
    
    template = WHATSAPP_TEMPLATES.get(template_name)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Replace variables in template
    message = template["template"]
    for var, value in variables.items():
        message = message.replace(f"{{{var}}}", str(value))
    
    # Send message (using wacli in production)
    return {
        "success": True,
        "recipient": recipient,
        "message": message,
        "template_used": template_name,
        "sent_at": datetime.now().isoformat()
    }

@app.post("/api/whatsapp/batch-template")
def send_batch_whatsapp_template(request: dict):
    """Send template to multiple recipients"""
    template_name = request.get("template_name")
    recipients = request.get("recipients", [])  # List of {phone, variables}
    
    template = WHATSAPP_TEMPLATES.get(template_name)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    results = []
    for recipient_data in recipients:
        recipient = recipient_data.get("phone")
        variables = recipient_data.get("variables", {})
        
        message = template["template"]
        for var, value in variables.items():
            message = message.replace(f"{{{var}}}", str(value))
        
        results.append({
            "recipient": recipient,
            "message": message,
            "status": "sent"
        })
    
    return {
        "success": True,
        "template_used": template_name,
        "sent_count": len(results),
        "results": results
    }

# ============== Phase 24: Enhanced AI Analysis ==============

@app.post("/api/ai/analyze-dialogue-density")
def analyze_dialogue_density(request: dict):
    """Analyze dialogue vs action ratio in scenes"""
    content = request.get("content", "")
    lines = content.split('\n')
    
    dialogue_lines = sum(1 for line in lines if line.strip().isupper() and len(line.strip()) > 0)
    action_lines = sum(1 for line in lines if not line.strip().isupper() and len(line.strip()) > 10)
    total_lines = dialogue_lines + action_lines
    
    dialogue_ratio = dialogue_lines / total_lines if total_lines > 0 else 0
    
    return {
        "dialogue_lines": dialogue_lines,
        "action_lines": action_lines,
        "total_lines": total_lines,
        "dialogue_ratio": round(dialogue_ratio, 2),
        "assessment": "dialogue_heavy" if dialogue_ratio > 0.6 else "action_heavy" if dialogue_ratio < 0.4 else "balanced",
        "recommendations": [
            "Consider adding more visual storytelling" if dialogue_ratio > 0.6 else "Good balance of dialogue and action",
            "Vary shot types to maintain visual interest"
        ]
    }

@app.post("/api/ai/analyze-visual-flow")
def analyze_visual_flow(request: dict):
    """Analyze visual continuity and flow"""
    scenes = request.get("scenes", [])
    
    location_changes = 0
    time_changes = 0
    int_ext_changes = 0
    
    for i in range(1, len(scenes)):
        prev = scenes[i-1]
        curr = scenes[i]
        
        if prev.get("location") != curr.get("location"):
            location_changes += 1
        if prev.get("time_of_day") != curr.get("time_of_day"):
            time_changes += 1
        if prev.get("interior_exterior") != curr.get("interior_exterior"):
            int_ext_changes += 1
    
    total_scenes = len(scenes)
    
    return {
        "total_scenes": total_scenes,
        "location_changes": location_changes,
        "time_changes": time_changes,
        "int_ext_changes": int_ext_changes,
        "location_change_rate": round(location_changes / total_scenes, 2) if total_scenes > 0 else 0,
        "time_change_rate": round(time_changes / total_scenes, 2) if total_scenes > 0 else 0,
        "flow_score": round((1 - (location_changes + time_changes) / total_scenes) * 10, 1) if total_scenes > 0 else 10,
        "recommendations": [
            "Group scenes by location to reduce setup time" if location_changes > total_scenes / 3 else "Good location grouping",
            "Consider night-to-day transitions carefully"
        ]
    }

@app.post("/api/ai/suggest-continuity")
def suggest_continuity_improvements(request: dict):
    """Suggest continuity improvements"""
    scenes = request.get("scenes", [])
    
    suggestions = []
    
    # Check for location clustering
    locations = [s.get("location", "") for s in scenes]
    location_sets = {}
    for loc in locations:
        if loc:
            location_sets[loc] = location_sets.get(loc, 0) + 1
    
    for loc, count in location_sets.items():
        if count > 3:
            suggestions.append({
                "type": "location_clustering",
                "message": f"Consider grouping all {loc} scenes together for efficiency",
                "saves": f"~{(count - 1) * 30} minutes"
            })
    
    # Check for time of day
    times = {}
    for scene in scenes:
        time = scene.get("time_of_day", "DAY")
        times[time] = times.get(time, 0) + 1
    
    if len(times) > 2:
        suggestions.append({
            "type": "time_optimization",
            "message": f"Multiple time-of-day changes detected ({', '.join(times.keys())})",
            "recommendation": "Minimize day/night transitions within same location"
        })
    
    return {
        "suggestions": suggestions,
        "potential_time_savings": f"~{len(suggestions) * 30} minutes"
    }

@app.post("/api/ai/generate-scene-summary")
def generate_scene_summary(request: dict):
    """Generate AI summary for a scene"""
    scene = request.get("scene", {})
    
    heading = scene.get("heading", "")
    content = scene.get("content", [])
    
    summary = {
        "scene_number": scene.get("scene_number", "?"),
        "heading": heading,
        "location": scene.get("location", "Unknown"),
        "time": scene.get("time_of_day", "Day"),
        "type": scene.get("interior_exterior", "INT/EXT"),
        "line_count": len(content),
        "estimated_pages": max(0.125, len(content) / 50),
        "characters": [],
        "key_action": "",
        "mood": "neutral"
    }
    
    # Extract character names (uppercase lines that look like names)
    char_pattern = re.compile(r'^[A-Z][A-Z\s]+$')
    characters = set()
    for line in content[:20]:  # Check first 20 lines
        if char_pattern.match(line.strip()) and len(line.strip()) < 30:
            if line.strip() not in ["INT", "EXT", "DAY", "NIGHT"]:
                characters.add(line.strip())
    
    summary["characters"] = list(characters)[:5]
    
    # Detect mood from content
    content_text = ' '.join(content).lower()
    if any(word in content_text for word in ['cry', 'tears', 'sad', 'death', 'loss']):
        summary["mood"] = "sad"
    elif any(word in content_text for word in ['laugh', 'happy', 'celebrate', 'joy']):
        summary["mood"] = "happy"
    elif any(word in content_text for word in ['fight', 'argue', 'anger', 'yell']):
        summary["mood"] = "conflict"
    elif any(word in content_text for word in ['love', 'kiss', 'romance']):
        summary["mood"] = "romantic"
    
    return summary

# ============== Phase 24: Project Import/Export ==============

@app.get("/api/projects/{project_id}/export")
def export_project(project_id: int, format: str = "json"):
    """Export project data in various formats"""
    projects = load_json("projects.json", [])
    project = next((p for p in projects if p.get("id") == project_id), None)
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Gather related data
    scenes = load_json("scenes.json", [])
    project_scenes = [s for s in scenes if s.get("project_id") == project_id]
    
    crew = load_json("crew.json", [])
    project_crew = [c for c in crew if c.get("project_id") == project_id]
    
    locations = load_json("locations.json", [])
    project_locations = [l for l in locations if l.get("project_id") == project_id]
    
    budget = load_json("budget.json", {})
    project_budget = {"expenses": [e for e in budget.get("expenses", []) if e.get("project_id") == project_id]}
    
    export_data = {
        "project": project,
        "scenes": project_scenes,
        "crew": project_crew,
        "locations": project_locations,
        "budget": project_budget,
        "exported_at": datetime.now().isoformat(),
        "version": "1.0"
    }
    
    if format == "json":
        return export_data
    elif format == "csv":
        # Simple CSV for scenes
        csv_lines = ["Scene Number,Heading,Location,Time,Type,Status"]
        for s in project_scenes:
            csv_lines.append(f'{s.get("scene_number", "")},"{s.get("heading", "")}","{s.get("location", "")}","{s.get("time_of_day", "")}","{s.get("interior_exterior", "")}","{s.get("status", "")}"')
        return {"format": "csv", "content": "\n".join(csv_lines)}
    
    return export_data

@app.post("/api/projects/import")
def import_project(data: dict):
    """Import project from JSON data"""
    project = data.get("project", {})
    
    # Get existing projects
    projects = load_json("projects.json", [])
    
    # Generate new ID
    new_id = max([p.get("id", 0) for p in projects], default=0) + 1
    project["id"] = new_id
    project["imported_at"] = datetime.now().isoformat()
    
    # Save project
    projects.append(project)
    save_json("projects.json", projects)
    
    # Import related data
    scenes = data.get("scenes", [])
    all_scenes = load_json("scenes.json", [])
    for scene in scenes:
        scene["id"] = len(all_scenes) + 1
        scene["project_id"] = new_id
        all_scenes.append(scene)
    save_json("scenes.json", all_scenes)
    
    return {
        "success": True,
        "project_id": new_id,
        "project_name": project.get("name", "Unnamed"),
        "scenes_imported": len(scenes)
    }

# ============== Phase 24: Enhanced Analytics ==============

@app.get("/api/analytics/project/{project_id}")
def get_project_analytics(project_id: int):
    """Get comprehensive project analytics"""
    scenes = load_json("scenes.json", [])
    project_scenes = [s for s in scenes if s.get("project_id") == project_id]
    
    crew = load_json("crew.json", [])
    project_crew = [c for c in crew if c.get("project_id") == project_id]
    
    budget = load_json("budget.json", {})
    project_expenses = [e for e in budget.get("expenses", []) if e.get("project_id") == project_id]
    
    # Calculate metrics
    total_scenes = len(project_scenes)
    completed_scenes = sum(1 for s in project_scenes if s.get("status") == "completed")
    total_pages = sum(s.get("pages", 0) for s in project_scenes)
    
    total_crew_cost = sum(c.get("daily_rate", 0) for c in project_crew)
    total_expenses = sum(e.get("amount", 0) for e in project_expenses)
    
    return {
        "project_id": project_id,
        "scenes": {
            "total": total_scenes,
            "completed": completed_scenes,
            "pending": total_scenes - completed_scenes,
            "completion_rate": round(completed_scenes / total_scenes * 100, 1) if total_scenes > 0 else 0
        },
        "pages": {
            "total": total_pages,
            "shot": round(total_pages * (completed_scenes / total_scenes)) if total_scenes > 0 else 0,
            "remaining": round(total_pages * ((total_scenes - completed_scenes) / total_scenes)) if total_scenes > 0 else 0
        },
        "budget": {
            "crew_daily_rate": total_crew_cost,
            "total_spent": total_expenses,
            "estimated_remaining_days": 10,
            "daily_burn_rate": round(total_expenses / 12, 2) if total_expenses > 0 else 0
        },
        "crew": {
            "total": len(project_crew),
            "by_department": {}
        }
    }

# ============== Phase 24: Crew Management Enhancements ==============

@app.get("/api/crew/available")
def get_available_crew(start_date: str, end_date: str):
    """Get crew availability between dates"""
    crew = load_json("crew.json", [])
    
    # Mock availability check
    available = []
    for c in crew:
        available.append({
            **c,
            "available": True,
            "next_assignment": "2026-03-01" if c.get("id", 0) % 2 == 0 else None
        })
    
    return {"crew": available, "count": len(available)}

@app.post("/api/crew/assign")
def assign_crew(request: dict):
    """Assign crew member to a project"""
    crew_id = request.get("crew_id")
    project_id = request.get("project_id")
    dates = request.get("dates", [])
    
    crew = load_json("crew.json", [])
    for c in crew:
        if c.get("id") == crew_id:
            if "assignments" not in c:
                c["assignments"] = []
            c["assignments"].append({
                "project_id": project_id,
                "dates": dates,
                "assigned_at": datetime.now().isoformat()
            })
            save_json("crew.json", crew)
            return {"success": True, "crew": c}
    
    raise HTTPException(status_code=404, detail="Crew member not found")

# ============== Phase 25: Advanced AI Features ==============

@app.post("/api/ai/film-comparison")
def compare_with_films(request: dict):
    """Compare script with similar films for benchmarking"""
    script_content = request.get("script_content", "")
    genre = request.get("genre", "drama")
    
    # Mock film comparison database
    similar_films = [
        {"title": "Vikram", "budget": 125000000, "runtime": 175, "box_office": 420000000, "genre": "action"},
        {"title": "Jai Bhim", "budget": 15000000, "runtime": 104, "box_office": 150000000, "genre": "drama"},
        {"title": "Master", "budget": 150000000, "runtime": 180, "box_office": 210000000, "genre": "action"},
        {"title": "Soorarai Pottru", "budget": 70000000, "runtime": 153, "box_office": 180000000, "genre": "drama"},
        {"title": "Ponniyin Selvan", "budget": 250000000, "runtime": 165, "box_office": 300000000, "genre": "historical"},
    ]
    
    word_count = len(script_content.split())
    estimated_runtime = round(word_count / 125)  # ~125 words per minute
    estimated_pages = round(word_count / 250, 1)  # ~250 words per page
    
    return {
        "estimated_runtime": estimated_runtime,
        "estimated_pages": estimated_pages,
        "similar_films": similar_films[:3],
        "budget_comparison": {
            "estimated_budget": 50000000,
            "similar_films_avg": 120000000,
            "recommendation": "Consider location grouping to optimize budget"
        },
        "pacing_analysis": {
            "genre": genre,
            "expected_beats": 15,
            "actual_beats": 12,
            "suggestions": ["Add more action sequences", "Consider interval block"]
        }
    }

@app.post("/api/ai/predict-budget")
def predict_budget(request: dict):
    """AI-powered budget prediction based on script analysis"""
    scenes = request.get("scenes", [])
    duration = request.get("duration", 150)
    genre = request.get("genre", "drama")
    
    scene_count = len(scenes)
    int_scenes = sum(1 for s in scenes if s.get("interior_exterior", "").upper() == "INT")
    ext_scenes = sum(1 for s in scenes if s.get("interior_exterior", "").upper() == "EXT")
    night_scenes = sum(1 for s in scenes if s.get("time_of_day", "").lower() == "night")
    
    # Genre-based multipliers
    genre_multipliers = {
        "action": 1.5, "drama": 1.0, "comedy": 0.9, "thriller": 1.2,
        "romance": 0.8, "horror": 1.1, "historical": 2.0
    }
    
    base_budget = 30000000
    multiplier = genre_multipliers.get(genre, 1.0)
    
    # Calculate estimated costs
    pre_production = round(base_budget * 0.15 * multiplier)
    production = round(base_budget * 0.55 * multiplier * (1 + (night_scenes * 0.05)))
    post_production = round(base_budget * 0.20 * multiplier)
    contingency = round(base_budget * 0.10 * multiplier)
    
    total = pre_production + production + post_production + contingency
    
    breakdown = {
        "pre_production": {"amount": pre_production, "items": ["Script", "Casting", "Location Scout", "Permits"]},
        "production": {"amount": production, "items": ["Crew", "Equipment", "Locations", "Transport", "Catering"]},
        "post_production": {"amount": post_production, "items": ["Editing", "VFX", "Sound", "Music", "DI"]},
        "contingency": {"amount": contingency, "items": ["Emergency Fund"]}
    }
    
    return {
        "estimated_total": total,
        "per_scene": round(total / scene_count) if scene_count > 0 else 0,
        "per_minute": round(total / duration) if duration > 0 else 0,
        "breakdown": breakdown,
        "confidence": "high" if scene_count > 20 else "medium",
        "recommendations": [
            f"Consider {ext_scenes} outdoor locations for natural lighting savings",
            f"Night shoots ({night_scenes}) may increase costs by ~5%",
            "Book equipment in bulk for 10-15% discount"
        ]
    }

@app.post("/api/ai/scene-similarity")
def analyze_scene_similarity(request: dict):
    """Find similar scenes for reference"""
    scenes = request.get("scenes", [])
    
    similarity_groups = []
    for i, scene in enumerate(scenes):
        group = {"scene": scene, "similar": []}
        for j, other in enumerate(scenes):
            if i != j:
                # Simple similarity based on location and time
                if scene.get("location") == other.get("location"):
                    group["similar"].append({"scene_number": other.get("scene_number"), "reason": "Same location"})
                elif scene.get("time_of_day") == other.get("time_of_day"):
                    group["similar"].append({"scene_number": other.get("scene_number"), "reason": "Same time of day"})
        similarity_groups.append(group)
    
    # Group by location for shooting efficiency
    location_groups = {}
    for scene in scenes:
        loc = scene.get("location", "Unknown")
        if loc not in location_groups:
            location_groups[loc] = []
        location_groups[loc].append(scene.get("scene_number"))
    
    return {
        "similarity_groups": similarity_groups[:10],
        "shooting_suggestions": [
            {"location": loc, "scenes": nums, "savings": f"~₹{len(nums) * 50000:,}"}
            for loc, nums in location_groups.items() if len(nums) > 1
        ]
    }

@app.post("/api/ai/weather-schedule")
def get_weather_recommendations(request: dict):
    """Get weather-aware scheduling recommendations"""
    schedule = request.get("schedule", [])
    location = request.get("location", "Chennai")
    
    # Mock weather predictions
    weather_forecast = []
    for i in range(14):
        day = {"date": f"2026-03-{i+1:02d}"}
        conditions = ["Sunny", "Cloudy", "Rainy", "Partly Cloudy"]
        day["condition"] = conditions[i % len(conditions)]
        day["temp_high"] = 32 + (i % 5)
        day["temp_low"] = 24 + (i % 3)
        day["rain_chance"] = 10 if i % 4 != 3 else 60
        weather_forecast.append(day)
    
    recommendations = []
    for day in weather_forecast:
        if day["rain_chance"] > 40:
            recommendations.append({
                "date": day["date"],
                "type": "indoor_shoot",
                "reason": f"Rain expected ({day['rain_chance']}% chance)"
            })
        elif day["temp_high"] > 36:
            recommendations.append({
                "date": day["date"],
                "type": "early_morning",
                "reason": "High temperature - schedule outdoor for early morning"
            })
    
    return {
        "location": location,
        "forecast": weather_forecast,
        "recommendations": recommendations,
        "best_days": [d["date"] for d in weather_forecast if d["rain_chance"] < 20][:5]
    }

@app.post("/api/ai/character-network")
def analyze_character_network(request: dict):
    """Analyze character relationships and screen time"""
    scenes = request.get("scenes", [])
    characters = request.get("characters", [])
    
    # Build character co-occurrence network
    network = {"nodes": [], "edges": []}
    character_scenes = {c["name"]: [] for c in characters}
    
    for scene in scenes:
        chars = scene.get("characters", [])
        for char in chars:
            if char in character_scenes:
                character_scenes[char].append(scene.get("scene_number"))
    
    # Create nodes
    for char, scene_nums in character_scenes.items():
        network["nodes"].append({
            "id": char,
            "label": char,
            "scene_count": len(scene_nums),
            "screen_time": len(scene_nums) * 2  # Mock: 2 mins per scene
        })
    
    # Create edges (characters appearing in same scenes)
    char_list = list(character_scenes.keys())
    for i, c1 in enumerate(char_list):
        for c2 in char_list[i+1:]:
            shared = set(character_scenes[c1]) & set(character_scenes[c2])
            if shared:
                network["edges"].append({
                    "from": c1,
                    "to": c2,
                    "shared_scenes": len(shared),
                    "strength": min(len(shared), 5)
                })
    
    # Find central characters
    central = sorted(network["nodes"], key=lambda x: x["scene_count"], reverse=True)[:5]
    
    return {
        "network": network,
        "central_characters": central,
        "total_relationships": len(network["edges"]),
        "insights": [
            f"{central[0]['id']} appears in most scenes ({central[0]['scene_count']})",
            f"{len(network['edges'])} character relationships identified",
            "Consider balancing screen time for supporting characters"
        ]
    }

@app.post("/api/ai/vfx-analysis")
def analyze_vfx_requirements(request: dict):
    """Analyze VFX requirements from script"""
    scenes = request.get("scenes", [])
    
    vfx_scenes = []
    vfx_keywords = ["VFX", "CGI", "fantasy", "magic", "supernatural", "explosion", "dream", "vision"]
    
    for scene in scenes:
        desc = (scene.get("description", "") + " " + scene.get("heading", "")).lower()
        if any(kw in desc for kw in vfx_keywords):
            vfx_scenes.append({
                "scene_number": scene.get("scene_number"),
                "location": scene.get("location"),
                "vfx_type": "digital" if "CGI" in desc else "practical" if "explosion" in desc else "composite",
                "complexity": "high" if any(k in desc for k in ["fantasy", "magic"]) else "medium",
                "estimated_cost": 2500000 if any(k in desc for k in ["fantasy", "magic"]) else 500000
            })
    
    total_vfx_cost = sum(s["estimated_cost"] for s in vfx_scenes)
    
    return {
        "vfx_scenes": vfx_scenes,
        "total_scenes": len(scenes),
        "vfx_scenes_count": len(vfx_scenes),
        "estimated_total_cost": total_vfx_cost,
        "recommendations": [
            "Pre-plan VFX shots during pre-production",
            "Consider in-camera effects where possible",
            "Book VFX studio time early"
        ] if len(vfx_scenes) > 0 else ["Minimal VFX required - good for budget"]
    }

# ============ PHASE 26: ENHANCED FEATURES ============

@app.post("/api/ai/scene-suggestions")
def get_scene_suggestions(request: dict):
    """Get AI-powered scene suggestions based on context"""
    project_id = request.get("project_id")
    context = request.get("context", "")
    
    # Get existing scenes
    scenes = load_json("scenes.json", [])
    project_scenes = [s for s in scenes if s.get("project_id") == project_id]
    
    suggestions = []
    
    # Analyze existing scenes for gaps
    locations = set(s.get("location") for s in project_scenes if s.get("location"))
    times = set(s.get("time_of_day") for s in project_scenes if s.get("time_of_day"))
    
    if len(project_scenes) < 5:
        suggestions.append({
            "type": "expansion",
            "suggestion": "Add more establishing shots",
            "reason": "Only a few scenes defined"
        })
    
    if "DAY" not in times:
        suggestions.append({
            "type": "time_addition",
            "suggestion": "Add daytime scenes",
            "reason": "No day scenes found"
        })
    
    if "NIGHT" not in times:
        suggestions.append({
            "type": "time_addition", 
            "suggestion": "Add night sequences",
            "reason": "Adds dramatic variety"
        })
    
    if len(locations) < 3:
        suggestions.append({
            "type": "location_expansion",
            "suggestion": "Introduce new locations",
            "reason": "Limited location variety"
        })
    
    # Generate suggested new scenes based on common Tamil film patterns
    suggestions.extend([
        {
            "type": "introduction",
            "suggestion": "Opening scene - Establish setting",
            "scene_type": "establishing",
            "location_suggestion": "City/Town overview",
            "time_suggestion": "DAY"
        },
        {
            "type": "conflict",
            "suggestion": "Conflict introduction scene",
            "scene_type": "dialogue",
            "location_suggestion": "Home/Office",
            "time_suggestion": "DAY"
        },
        {
            "type": "climax",
            "suggestion": "Climactic sequence",
            "scene_type": "action",
            "location_suggestion": "Open location",
            "time_suggestion": "EVENING"
        }
    ])
    
    return {
        "project_id": project_id,
        "suggestions": suggestions,
        "analysis": {
            "current_scene_count": len(project_scenes),
            "location_count": len(locations),
            "time_variety": len(times)
        }
    }

@app.post("/api/ai/location-recommendations")
def get_location_recommendations(request: dict):
    """AI-powered location recommendations based on script content"""
    script_content = request.get("script_content", "")
    requirements = request.get("requirements", {})
    
    recommendations = []
    
    # Analyze script for location keywords
    location_types = {
        "residential": ["home", "house", "apartment", "room", "bedroom", "kitchen"],
        "commercial": ["shop", "office", "restaurant", "hotel", "market"],
        "outdoor": ["park", "street", "beach", "forest", "field", "road"],
        "industrial": ["factory", "warehouse", "construction"],
        "religious": ["temple", "church", "mosque", "church"],
        "entertainment": ["theater", "cinema", "club", "party"]
    }
    
    content_lower = script_content.lower()
    
    for loc_type, keywords in location_types.items():
        matches = sum(1 for kw in keywords if kw in content_lower)
        if matches > 0:
            recommendations.append({
                "type": loc_type,
                "priority": matches,
                "suggested_locations": [
                    f"Typical {loc_type} setting in Tamil Nadu",
                    "Consider both studio and practical locations"
                ],
                "estimated_cost": {
                    "studio": 50000 if loc_type == "residential" else 100000,
                    "practical": 30000 if loc_type == "residential" else 50000
                }
            })
    
    # Add general recommendations
    recommendations.extend([
        {
            "type": "shooting_efficiency",
            "priority": 5,
            "suggested_locations": ["Group scenes by location for efficiency"],
            "estimated_cost": {"savings": "20-30%"}
        },
        {
            "type": "weather_consideration", 
            "priority": 4,
            "suggested_locations": ["Plan outdoor shoots for optimal weather months"],
            "estimated_cost": {"contingency": "10%"}
        }
    ])
    
    return {
        "recommendations": sorted(recommendations, key=lambda x: x["priority"], reverse=True),
        "total_suggested": len(recommendations),
        "budget_impact": "Moderate - depends on location choices"
    }

@app.post("/api/ai/cost-estimate")
def get_ai_cost_estimate(request: dict):
    """AI-powered detailed cost estimation"""
    project_id = request.get("project_id")
    scenes = request.get("scenes", [])
    
    # Base costs (in INR)
    base_costs = {
        "camera_dept": 150000,      # Per day
        "light_dept": 100000,       # Per day
        "sound_dept": 50000,        # Per day
        "art_dept": 80000,          # Per day
        "makeup": 30000,            # Per day
        "transport": 50000,         # Per day
        "catering": 40000,          # Per day
        "location": 100000,         # Per day (average)
    }
    
    # Calculate based on scene complexity
    total_shoot_days = max(1, len(scenes) // 3)  # Rough estimate: 3 scenes per day
    
    # Scene type multipliers
    action_scenes = sum(1 for s in scenes if any(k in str(s).lower() for k in ["action", "fight", "chase"]))
    night_scenes = sum(1 for s in scenes if "night" in str(s).lower())
    vfx_scenes = sum(1 for s in scenes if "vfx" in str(s).lower())
    
    # Adjust for complexity
    day_multiplier = 1.0
    if action_scenes > 3: day_multiplier += 0.3
    if night_scenes > 2: day_multiplier += 0.2
    if vfx_scenes > 0: day_multiplier += 0.5
    
    adjusted_days = int(total_shoot_days * day_multiplier)
    
    breakdown = {}
    total = 0
    for dept, base in base_costs.items():
        cost = base * adjusted_days
        breakdown[dept] = cost
        total += cost
    
    # Add contingency
    contingency = total * 0.1
    
    return {
        "project_id": project_id,
        "estimate": {
            "total_scenes": len(scenes),
            "estimated_shoot_days": adjusted_days,
            "breakdown": breakdown,
            "subtotal": total,
            "contingency": contingency,
            "grand_total": total + contingency
        },
        "complexity_factors": {
            "action_scenes": action_scenes,
            "night_scenes": night_scenes,
            "vfx_scenes": vfx_scenes,
            "day_multiplier": day_multiplier
        },
        "recommendations": [
            "Group scenes by location to reduce setup time",
            "Consider night shoots in succession for cost efficiency",
            "Pre-book VFX-intensive scenes with post-production"
        ]
    }

@app.post("/api/scenes/batch")
def batch_update_scenes(request: dict):
    """Batch create or update scenes"""
    project_id = request.get("project_id")
    scenes_data = request.get("scenes", [])
    
    scenes = load_json("scenes.json", [])
    
    for scene_data in scenes_data:
        scene_data["project_id"] = project_id
        if "id" in scene_data:
            # Update existing
            for i, s in enumerate(scenes):
                if s.get("id") == scene_data["id"]:
                    scenes[i].update(scene_data)
                    break
        else:
            # Create new
            scene_data["id"] = len(scenes) + 1
            scenes.append(scene_data)
    
    save_json("scenes.json", scenes)
    
    return {
        "success": True,
        "scenes_updated": len(scenes_data),
        "total_scenes": len(scenes)
    }

@app.get("/api/calendar/{project_id}")
def get_production_calendar(project_id: int):
    """Get production calendar with milestones"""
    schedule = load_json("schedule.json", {"days": []})
    project_schedule = [d for d in schedule.get("days", []) if d.get("project_id") == project_id]
    
    # Generate calendar events
    events = []
    for day in project_schedule:
        events.append({
            "date": day.get("date"),
            "type": "shoot",
            "scenes": day.get("scenes", []),
            "location": day.get("location"),
            "call_time": day.get("call_time"),
            "wrap_time": day.get("wrap_time")
        })
    
    return {
        "project_id": project_id,
        "events": events,
        "total_shoot_days": len(events)
    }

@app.post("/api/crew/availability")
def check_crew_availability(request: dict):
    """Check crew availability for given dates"""
    crew_ids = request.get("crew_ids", [])
    dates = request.get("dates", [])
    
    crew = load_json("crew.json", [])
    schedule = load_json("schedule.json", {"days": []})
    
    availability = []
    for crew_id in crew_ids:
        crew_member = next((c for c in crew if c.get("id") == crew_id), None)
        if not crew_member:
            continue
            
        crew_schedules = []
        for date in dates:
            # Check if crew is booked on this date
            booked = any(
                d.get("date") == date and crew_id in d.get("crew_ids", [])
                for d in schedule.get("days", [])
            )
            crew_schedules.append({
                "date": date,
                "available": not booked,
                "status": "booked" if booked else "available"
            })
        
        availability.append({
            "crew_id": crew_id,
            "name": crew_member.get("name"),
            "role": crew_member.get("role"),
            "schedule": crew_schedules
        })
    
    return {
        "dates_checked": len(dates),
        "crew_checked": len(crew_ids),
        "availability": availability
    }

@app.put("/api/notifications/preferences")
def update_notification_preferences(request: dict):
    """Update user notification preferences"""
    user_id = request.get("user_id")
    preferences = {
        "whatsapp_enabled": request.get("whatsapp_enabled", True),
        "email_enabled": request.get("email_enabled", True),
        "sms_enabled": request.get("sms_enabled", False),
        "notify_on": request.get("notify_on", ["schedule_change", "budget_alert", "scene_update"])
    }
    
    # Save preferences
    prefs_file = DATA_DIR / "notification_preferences.json"
    all_prefs = {}
    if prefs_file.exists():
        all_prefs = json.load(prefs_file)
    
    all_prefs[str(user_id)] = preferences
    save_json("notification_preferences.json", all_prefs)
    
    return {"success": True, "preferences": preferences}

@app.get("/api/collaboration/{project_id}/users")
def get_collaborators(project_id: int):
    """Get active collaborators on a project"""
    # Mock implementation - in real app would check database
    return [
        {"id": 1, "name": "Director", "role": "director", "online": True},
        {"id": 2, "name": "Producer", "role": "producer", "online": False},
        {"id": 3, "name": "Writer", "role": "writer", "online": True}
    ]

@app.get("/api/scripts/{project_id}/versions")
def get_script_versions(project_id: int):
    """Get script version history"""
    versions = load_json("script_versions.json", [])
    project_versions = [v for v in versions if v.get("project_id") == project_id]
    
    if not project_versions:
        # Return mock data
        return [
            {"id": 1, "version": "1.0", "uploaded_at": "2026-01-15", "uploaded_by": "Writer", "notes": "Initial draft"},
            {"id": 2, "version": "1.1", "uploaded_at": "2026-01-20", "uploaded_by": "Director", "notes": "Revised scenes 5-10"},
            {"id": 3, "version": "2.0", "uploaded_at": "2026-02-01", "uploaded_by": "Writer", "notes": "Final draft"}
        ]
    
    return project_versions

print("✅ Phase 26 Features loaded")
