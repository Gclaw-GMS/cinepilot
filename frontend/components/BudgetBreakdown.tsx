// CinePilot - Budget Breakdown Component
// Detailed budget estimation and tracking

interface BudgetCategory {
  name: string;
  amount: number;
  percentage: number;
  items: BudgetItem[];
}

interface BudgetItem {
  name: string;
  cost: number;
  notes?: string;
}

interface BudgetBreakdownProps {
  totalBudget: number;
  sceneCount: number;
  shootingDays: number;
  locationCount: number;
  characterCount: number;
}

export function generateBudgetBreakdown(
  totalBudget: number, 
  sceneCount: number, 
  shootingDays: number,
  locationCount: number,
  characterCount: number
): BudgetCategory[] {
  // Industry standard percentages for film production
  const categories: BudgetCategory[] = [
    {
      name: "Production",
      amount: 0,
      percentage: 35,
      items: [
        { name: "Director & Creative Team", cost: 0, notes: "Director, Asst Directors" },
        { name: "Camera Department", cost: 0, notes: "Cameras, operators, ACs" },
        { name: "Lighting & Grip", cost: 0, notes: "Gaffers, grips, equipment" },
        { name: "Sound Department", cost: 0, notes: "Sound mixer, boom operators" },
        { name: "Art Department", cost: 0, notes: "Production design, sets" },
        { name: "Location Expenses", cost: 0, notes: "Permits, location fees" }
      ]
    },
    {
      name: "Cast & Crew",
      amount: 0,
      percentage: 25,
      items: [
        { name: "Lead Actors", cost: 0, notes: "Principal cast fees" },
        { name: "Supporting Cast", cost: 0, notes: "Supporting actors" },
        { name: "Extras", cost: 0, notes: "Background actors" },
        { name: "Production Staff", cost: 0, notes: "PA, coordinators" },
        { name: "Technical Crew", cost: 0, notes: "Technicians, operators" }
      ]
    },
    {
      name: "Post-Production",
      amount: 0,
      percentage: 20,
      items: [
        { name: "Editing", cost: 0, notes: "Editor, assistant editor" },
        { name: "VFX & CGI", cost: 0, notes: "Visual effects, graphics" },
        { name: "Color Grading", cost: 0, notes: "Colorist, DI" },
        { name: "Sound Design", cost: 0, notes: "Sound design, mixing" },
        { name: "Music & Background Score", cost: 0, notes: "Composer, musicians" },
        { name: "Foley & ADR", cost: 0, notes: "Foley artists, dubbing" }
      ]
    },
    {
      name: "Music & Rights",
      amount: 0,
      percentage: 8,
      items: [
        { name: "Song Recording", cost: 0, notes: "Singing, musicians" },
        { name: "Music Rights", cost: 0, notes: "Licensing, royalties" },
        { name: "Background Score", cost: 0, notes: "Orchestra, production" }
      ]
    },
    {
      name: "Marketing & Distribution",
      amount: 0,
      percentage: 7,
      items: [
        { name: "Promotions", cost: 0, notes: "Publicity, promotions" },
        { name: "Trailer & Poster", cost: 0, notes: "Marketing materials" },
        { name: "Distribution Fees", cost: 0, notes: "Theatrical, OTT" }
      ]
    },
    {
      name: "Contingency",
      amount: 0,
      percentage: 5,
      items: [
        { name: "Emergency Fund", cost: 0, notes: "Unforeseen expenses" }
      ]
    }
  ];
  
  // Calculate amounts
  categories.forEach(cat => {
    cat.amount = Math.round(totalBudget * cat.percentage / 100);
    
    // Distribute within category
    const itemCount = cat.items.length;
    const baseAmount = cat.amount / itemCount;
    cat.items.forEach((item, i) => {
      // Last item gets remainder
      if (i === itemCount - 1) {
        item.cost = cat.amount - cat.items.slice(0, -1).reduce((sum, it) => sum + it.cost, 0);
      } else {
        item.cost = Math.round(baseAmount * (0.8 + Math.random() * 0.4));
      }
    });
  });
  
  return categories;
}

export function BudgetBreakdown({ 
  totalBudget, 
  sceneCount, 
  shootingDays,
  locationCount,
  characterCount 
}: BudgetBreakdownProps) {
  const breakdown = generateBudgetBreakdown(totalBudget, sceneCount, shootingDays, locationCount, characterCount);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="budget-breakdown bg-gray-900 rounded-lg p-6">
      <div className="header mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          💰 Budget Breakdown
        </h2>
        <div className="stats flex gap-4 text-sm">
          <span className="text-gray-400">
            Total: <strong className="text-green-400">{formatCurrency(totalBudget)}</strong>
          </span>
          <span className="text-gray-400">
            Scenes: <strong className="text-white">{sceneCount}</strong>
          </span>
          <span className="text-gray-400">
            Days: <strong className="text-white">{shootingDays}</strong>
          </span>
        </div>
      </div>
      
      <div className="categories space-y-4">
        {breakdown.map((category, catIndex) => (
          <div key={catIndex} className="category bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-white">
                {category.name}
              </h3>
              <div className="text-right">
                <span className="text-green-400 font-bold">
                  {formatCurrency(category.amount)}
                </span>
                <span className="text-gray-500 text-sm ml-2">
                  ({category.percentage}%)
                </span>
              </div>
            </div>
            
            <div className="progress-bar bg-gray-700 h-2 rounded-full mb-3 overflow-hidden">
              <div 
                className="progress h-full bg-gradient-to-r from-green-500 to-emerald-400"
                style={{ width: `${category.percentage}%` }}
              />
            </div>
            
            <div className="items space-y-2">
              {category.items.map((item, itemIndex) => (
                <div key={itemIndex} className="item flex justify-between text-sm">
                  <span className="text-gray-400">
                    {item.name}
                    {item.notes && <span className="text-gray-600 ml-1">({item.notes})</span>}
                  </span>
                  <span className="text-gray-300">
                    {formatCurrency(item.cost)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BudgetBreakdown;
