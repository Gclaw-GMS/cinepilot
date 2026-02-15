// CinePilot - Shot List Generator Component
// Generates shot suggestions based on scene analysis

interface ShotSuggestion {
  shot_type: string;
  description: string;
  camera_movement: string;
  notes: string;
}

interface SceneShotListProps {
  sceneHeading: string;
  characters: string[];
  location: string;
  onShotsGenerated?: (shots: ShotSuggestion[]) => void;
}

export function generateShotList(sceneHeading: string, characters: string[], location: string): ShotSuggestion[] {
  const shots: ShotSuggestion[] = [];
  const charCount = characters.length;
  
  // Opening shot - establish location
  shots.push({
    shot_type: "Establishing Shot",
    description: `Wide shot of ${location} to establish setting`,
    camera_movement: "Dolly out or aerial",
    notes: "Sets the tone and location context"
  });
  
  // Character coverage
  if (charCount === 1) {
    shots.push({
      shot_type: "Medium Close-Up",
      description: `Single character intro - ${characters[0]}`,
      camera_movement: "Static or subtle push",
      notes: "Focus on character emotion"
    });
    shots.push({
      shot_type: "Over the Shoulder",
      description: "Reaction shot setup",
      camera_movement: "Cut to POV",
      notes: "For dialogue setup"
    });
  } else if (charCount === 2) {
    shots.push({
      shot_type: "Two-Shot",
      description: `Both ${characters[0]} and ${characters[1]} together`,
      camera_movement: "Static or slow pan",
      notes: "Shows relationship between characters"
    });
    shots.push({
      shot_type: "Single - Character 1",
      description: `${characters[0]} reaction`,
      camera_movement: "Cut to medium",
      notes: "Close coverage"
    });
    shots.push({
      shot_type: "Single - Character 2",
      description: `${characters[1]} reaction`,
      camera_movement: "Cut to medium",
      notes: "Close coverage"
    });
  } else {
    // Multiple characters
    shots.push({
      shot_type: "Group Shot",
      description: `All ${charCount} characters together`,
      camera_movement: "Wide to capture all",
      notes: "Establish group dynamics"
    });
    shots.push({
      shot_type: "Medium Shots",
      description: "Individual close-ups on key characters",
      camera_movement: "Cut between characters",
      notes: "Coverage for each principal"
    });
  }
  
  // Scene-specific additions
  const headingLower = sceneHeading.toLowerCase();
  
  if (headingLower.includes('action') || headingLower.includes('fight')) {
    shots.push({
      shot_type: "Action Coverage",
      description: "Dynamic shots with movement",
      camera_movement: "Handheld, rapid cuts",
      notes: "Coordinate with stunt team"
    });
  }
  
  if (headingLower.includes('emotional') || headingLower.includes('cry')) {
    shots.push({
      shot_type: "Emotional Beat",
      description: "Close-up on reaction",
      camera_movement: "Push in slowly",
      notes: "Hold on emotion"
    });
  }
  
  // Closing shot
  shots.push({
    shot_type: "Closing Shot",
    description: "Final beat or transition",
    camera_movement: "Pull out or cut to next scene",
    notes: "End on note or transition"
  });
  
  return shots;
}

interface ShotListViewerProps {
  shots: ShotSuggestion[];
  sceneHeading: string;
}

export function ShotListViewer({ shots, sceneHeading }: ShotListViewerProps) {
  return (
    <div className="shot-list-viewer bg-gray-900 rounded-lg p-4">
      <h3 className="text-lg font-bold text-white mb-4">
        🎬 Shot List: {sceneHeading}
      </h3>
      
      <div className="shots space-y-3">
        {shots.map((shot, index) => (
          <div key={index} className="shot-item bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="flex justify-between items-start mb-2">
              <span className="shot-number text-indigo-400 font-bold">
                Shot {index + 1}
              </span>
              <span className="shot-type bg-indigo-900 text-indigo-200 px-2 py-1 rounded text-xs">
                {shot.shot_type}
              </span>
            </div>
            
            <p className="description text-gray-300 text-sm mb-2">
              {shot.description}
            </p>
            
            <div className="meta text-xs text-gray-500">
              <span className="camera mr-3">
                📷 {shot.camera_movement}
              </span>
              <span className="notes">
                💡 {shot.notes}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="summary mt-4 pt-4 border-t border-gray-700">
        <span className="text-gray-400 text-sm">
          Total Shots: <strong className="text-white">{shots.length}</strong>
        </span>
      </div>
    </div>
  );
}

export default ShotListViewer;
