# CinePilot AI Features Plan - IMPLEMENTATION

## Current Status: IN PROGRESS

### Features to Build (Priority Order)

---

## Feature 1: Script Intelligence API
**Status**: Ready to build
**Endpoint**: `/api/ai/script-analyze`

```python
# Input: Script text
# Processing:
#   - Count INT/EXT scenes
#   - Extract locations
#   - Identify characters
#   - Calculate complexity score (dialogue density, scene length)
#   - Generate emotional arc
# Output: JSON with all extracted data
```

## Feature 2: Budget Forecaster API
**Status**: Ready to build  
**Endpoint**: `/api/ai/budget-forecast`

```python
# Input: Script analysis, location count, cast size
# Processing:
#   - Historical data patterns
#   - Category-based estimation
#   - Risk factor calculation
# Output: Budget breakdown by category
```

## Feature 3: Schedule Optimizer
**Status**: Ready to build
**Endpoint**: `/api/ai/optimize-schedule`

```python
# Input: Scenes, locations, cast availability
# Processing:
#   - Group by location
#   - Minimize travel
#   - Group cast call times
# Output: Day-by-day schedule
```

## Feature 4: Risk Detector
**Status**: Ready to build
**Endpoint**: `/api/ai/risk-detect`

```python
# Input: Full production plan
# Processing:
#   - Pattern matching against known risks
#   - Weather/location analysis
#   - Budget overrun predictions
# Output: Risk score, specific factors, mitigations
```

## Feature 5: Shot Recommender
**Status**: Ready to build
**Endpoint**: `/api/ai/shot-suggest`

```python
# Input: Scene description, emotional context
# Processing:
#   - Match scene type to shot vocabulary
#   - Recommend camera movement
#   - Suggest lens
# Output: Array of shot suggestions
```

## Implementation Tasks

### Backend (Python/FastAPI)
- [ ] Create `/backend/routers/ai.py`
- [ ] Implement script analyzer
- [ ] Implement budget forecaster
- [ ] Implement schedule optimizer
- [ ] Add to main.py router

### Frontend (Next.js)
- [ ] Create `/src/app/api/ai/` routes
- [ ] Connect AI Tools page to backend
- [ ] Add loading states
- [ ] Add result caching

### Integration
- [ ] Add API key for OpenAI (optional enhancement)
- [ ] Add fallback to rule-based analysis
- [ ] Add to build verification

