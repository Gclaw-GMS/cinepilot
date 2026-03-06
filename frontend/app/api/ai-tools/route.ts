import { NextRequest, NextResponse } from 'next/server';

// AI Tool definitions
const AI_TOOLS = [
  { 
    id: 'script-analyzer', 
    name: 'Script Intelligence', 
    desc: 'Deep analysis of your script with scene breakdown',
    icon: 'FileText', 
    color: 'indigo',
    category: 'Script',
    endpoint: '/api/scripts'
  },
  { 
    id: 'budget-forecast', 
    name: 'Budget Forecast', 
    desc: 'AI-powered cost estimation and breakdown',
    icon: 'DollarSign', 
    color: 'emerald',
    category: 'Finance',
    endpoint: '/api/budget?action=forecast'
  },
  { 
    id: 'shot-suggest', 
    name: 'Shot Recommender', 
    desc: 'Cinematography suggestions per scene',
    icon: 'Clapperboard', 
    color: 'violet',
    category: 'Production',
    endpoint: '/api/shots'
  },
  { 
    id: 'schedule-optimizer', 
    name: 'Schedule Optimizer', 
    desc: 'Optimize shooting schedule by location',
    icon: 'Calendar', 
    color: 'amber',
    category: 'Planning',
    endpoint: '/api/schedule'
  },
  { 
    id: 'risk-detector', 
    name: 'Risk Detector', 
    desc: 'Identify potential production risks',
    icon: 'AlertTriangle', 
    color: 'rose',
    category: 'Management',
    endpoint: '/api/mission-control'
  },
  { 
    id: 'sentiment-analyzer', 
    name: 'Audience Sentiment', 
    desc: 'Analyze audience reaction from social media',
    icon: 'MessageSquare', 
    color: 'cyan',
    category: 'Marketing',
    endpoint: '/api/audience-sentiment'
  },
  { 
    id: 'continuity-check', 
    name: 'Continuity Checker', 
    desc: 'Detect potential continuity issues',
    icon: 'CheckCircle', 
    color: 'blue',
    category: 'Quality',
    endpoint: '/api/continuity'
  },
  { 
    id: 'vfx-breakdown', 
    name: 'VFX Breakdown', 
    desc: 'AI-powered VFX shot identification',
    icon: 'Sparkles', 
    color: 'purple',
    category: 'Post-Production',
    endpoint: '/api/vfx'
  },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const toolId = searchParams.get('id');
  const action = searchParams.get('action');

  // Return list of all AI tools
  if (!toolId) {
    return NextResponse.json({
      tools: AI_TOOLS,
      categories: [...new Set(AI_TOOLS.map(t => t.category))],
    });
  }

  // Get specific tool
  const tool = AI_TOOLS.find(t => t.id === toolId);
  if (!tool) {
    return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
  }

  // Run analysis based on action
  if (action === 'analyze') {
    try {
      // Fetch related data from other APIs
      const responses = await Promise.allSettled([
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${tool.endpoint}`),
      ]);
      
      const data = responses[0].status === 'fulfilled' 
        ? await responses[0].value.json() 
        : null;

      return NextResponse.json({
        tool,
        analysis: {
          timestamp: new Date().toISOString(),
          source: tool.endpoint,
          data,
        },
      });
    } catch (error) {
      return NextResponse.json({
        tool,
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 });
    }
  }

  // Return tool details
  return NextResponse.json({ tool });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toolId, prompt, context } = body;

    const tool = AI_TOOLS.find(t => t.id === toolId);
    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Simulate AI analysis response
    const analysisResult = {
      tool: tool.name,
      prompt,
      context,
      result: {
        insights: [
          `Analysis based on ${tool.category} data`,
          `Endpoint: ${tool.endpoint}`,
          `Context provided: ${context ? 'Yes' : 'No'}`,
        ],
        recommendations: [
          'Review the generated insights',
          'Cross-reference with manual analysis',
          'Adjust parameters for more precise results',
        ],
        confidence: 0.85,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(analysisResult);
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
