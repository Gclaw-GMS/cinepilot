// CinePilot - Scene Card Component
// Displays individual scene information with breakdown

interface SceneCardProps {
  scene: {
    heading: string;
    location: string;
    time_of_day: string;
    characters: string[];
    page_number?: number;
  };
  sceneNumber: number;
  onSelect?: (scene: {
    heading: string;
    location: string;
    time_of_day: string;
    characters: string[];
  }) => void;
}

export function SceneCard({ scene, sceneNumber, onSelect }: SceneCardProps) {
  const isInterior = scene.heading.toUpperCase().startsWith('INT');
  const isExterior = scene.heading.toUpperCase().startsWith('EXT');
  const isNight = scene.time_of_day.toLowerCase().includes('night') || 
                  scene.time_of_day.toLowerCase().includes('dark') ||
                  scene.time_of_day.toLowerCase().includes('evening');

  return (
    <div 
      className="scene-card bg-gray-800 rounded-lg p-4 border-l-4 cursor-pointer hover:bg-gray-700 transition-colors"
      style={{ borderLeftColor: isNight ? '#6366f1' : isExterior ? '#22c55e' : '#f59e0b' }}
      onClick={() => onSelect?.(scene)}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="scene-number text-lg font-bold text-indigo-400">
          #{sceneNumber}
        </span>
        <span className={`scene-type px-2 py-1 rounded text-xs ${
          isNight ? 'bg-indigo-900 text-indigo-200' : 
          isExterior ? 'bg-green-900 text-green-200' : 
          'bg-amber-900 text-amber-200'
        }`}>
          {isNight ? '🌙 Night' : isExterior ? '🌳 EXT' : '🏠 INT'}
        </span>
      </div>
      
      <h3 className="scene-heading text-white font-medium mb-1 text-sm">
        {scene.heading}
      </h3>
      
      <div className="scene-meta text-gray-400 text-xs mb-2">
        <span className="location">📍 {scene.location}</span>
        {scene.time_of_day && (
          <span className="time ml-2">⏰ {scene.time_of_day}</span>
        )}
      </div>
      
      {scene.characters && scene.characters.length > 0 && (
        <div className="characters mt-2">
          <span className="text-gray-500 text-xs">Cast: </span>
          <div className="flex flex-wrap gap-1 mt-1">
            {scene.characters.slice(0, 5).map((char, i) => (
              <span key={i} className="character-tag bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs">
                {char}
              </span>
            ))}
            {scene.characters.length > 5 && (
              <span className="more-chars text-gray-500 text-xs">
                +{scene.characters.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface SceneListProps {
  scenes: Array<{
    heading: string;
    location: string;
    time_of_day: string;
    characters: string[];
  }>;
  onSceneSelect?: (scene: any, index: number) => void;
}

export function SceneList({ scenes, onSceneSelect }: SceneListProps) {
  return (
    <div className="scene-list space-y-3">
      {scenes.map((scene, index) => (
        <SceneCard 
          key={index} 
          scene={scene} 
          sceneNumber={index + 1}
          onSelect={(s) => onSceneSelect?.(s, index)}
        />
      ))}
    </div>
  );
}

export default SceneCard;
