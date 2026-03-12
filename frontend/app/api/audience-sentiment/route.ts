import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Demo data for when database is unavailable
const DEMO_SENTIMENTS = [
  {
    id: 'demo-1',
    projectId: 'demo-project',
    title: 'Thunivu Teaser Reaction',
    platform: 'youtube',
    videoUrl: 'https://youtube.com/watch?v=abc123',
    totalComments: 15420,
    analyzedCount: 2500,
    positiveCount: 1875,
    negativeCount: 125,
    neutralCount: 500,
    avgSentiment: 0.78,
    topPositive: [
      { text: 'Ajith sir mass scene! 🔥', author: 'TamilCinemaFan', likes: 2453 },
      { text: 'The interval block is electrifying', author: 'MovieBuff2024', likes: 1892 },
      { text: 'Vijay sethupathi + Ajith combo is pure gold', author: 'KollywoodLover', likes: 1654 },
    ],
    topNegative: [
      { text: 'Same old formula, nothing new', author: 'FilmCritic', likes: 89 },
      { text: 'BGM is too loud', author: 'AudioEngineer', likes: 67 },
    ],
    takeaways: [
      'Strong positive reception for Ajith\'s performance',
      'Interval block generating most excitement',
      'VS2 pairing received exceptionally well',
    ],
    posterTips: [
      'Feature Ajith in dominant pose center-frame',
      'Include VS2 in key art for actor synergy',
      'Emphasize action elements over romance',
    ],
    status: 'completed',
    errorMsg: null,
    createdAt: '2024-02-15T10:00:00Z',
  },
  {
    id: 'demo-2',
    projectId: 'demo-project',
    title: 'Jawan Trailer - First Reaction',
    platform: 'youtube',
    videoUrl: 'https://youtube.com/watch?v=xyz789',
    totalComments: 28950,
    analyzedCount: 5000,
    positiveCount: 4200,
    negativeCount: 300,
    neutralCount: 500,
    avgSentiment: 0.82,
    topPositive: [
      { text: 'SRK is unstoppable! Legend', author: 'BollywoodKing', likes: 4521 },
      { text: 'Action sequences are top notch', author: 'StuntMaster', likes: 3210 },
      { text: 'Nayanthara looks stunning', author: 'StyleIcon', likes: 2890 },
    ],
    topNegative: [
      { text: 'Too many cuts in action scenes', author: 'EditorReview', likes: 123 },
      { text: 'Dialogues seem forced', author: 'ScriptAnalyst', likes: 98 },
    ],
    takeaways: [
      'SRH starpower driving major engagement',
      'Action genre resonates strongly',
      'Female lead receiving positive attention',
    ],
    posterTips: [
      'Lead with SRK in heroic stance',
      'Include ensemble cast in key art',
      'Use high-contrast action imagery',
    ],
    status: 'completed',
    errorMsg: null,
    createdAt: '2024-01-20T08:30:00Z',
  },
  {
    id: 'demo-3',
    projectId: 'demo-project',
    title: 'Leo First Look - Twitter Buzz',
    platform: 'twitter',
    videoUrl: null,
    totalComments: 45200,
    analyzedCount: 8000,
    positiveCount: 6400,
    negativeCount: 800,
    neutralCount: 800,
    avgSentiment: 0.75,
    topPositive: [
      { text: 'Lokesh Kanvaraj style 💥', author: 'CinemaLover', likes: 5678 },
      { text: 'Vijay in a realistic role finally!', author: 'ActorFan', likes: 4321 },
      { text: 'The styling is next level', author: 'FashionTrend', likes: 3456 },
    ],
    topNegative: [
      { text: 'Not convinced about the look', author: 'DoubtingThomas', likes: 234 },
      { text: 'Another Mass Mahesh clone', author: 'CriticEye', likes: 187 },
    ],
    takeaways: [
      'LOK style direction highly anticipated',
      'Vijay\'s realistic avatar praised',
      'Styling receiving significant positive buzz',
    ],
    posterTips: [
      'Capture raw, realistic aesthetic',
      'Emphasize gritty urban tone',
      'Minimalist approach - less is more',
    ],
    status: 'completed',
    errorMsg: null,
    createdAt: '2023-12-10T14:00:00Z',
  },
]

function getDemoSentiments(projectId: string) {
  return {
    sentiments: DEMO_SENTIMENTS.map(s => ({
      ...s,
      projectId,
      _count: { comments: s.analyzedCount },
    })),
    _demo: true,
    isDemoMode: true,
  }
}

// GET /api/audience-sentiment - List all sentiment analyses
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get('projectId') || 'demo-project'
  const useDemo = searchParams.get('demo') === 'true'
  const id = searchParams.get('id')
  const platform = searchParams.get('platform')

  // Return demo data if explicitly requested or if no projectId
  if (useDemo || !projectId || projectId === 'demo-project') {
    const demo = getDemoSentiments(projectId);
    // Filter by platform if provided
    let sentiments = demo.sentiments;
    if (platform) {
      sentiments = sentiments.filter(s => s.platform === platform);
    }
    // If id is provided, return single sentiment
    if (id) {
      const sentiment = sentiments.find(s => s.id === id);
      if (sentiment) {
        return NextResponse.json(sentiment);
      }
      return NextResponse.json({ error: 'Sentiment not found' }, { status: 404 });
    }
    return NextResponse.json({ ...demo, sentiments });
  }

  // If id is provided, return single sentiment from DB
  if (id) {
    try {
      const sentiment = await prisma.audienceSentiment.findUnique({
        where: { id },
        include: {
          _count: {
            select: { comments: true }
          }
        }
      });
      if (sentiment) {
        return NextResponse.json(sentiment);
      }
      return NextResponse.json({ error: 'Sentiment not found' }, { status: 404 });
    } catch (error) {
      return NextResponse.json(getDemoSentiments(projectId));
    }
  }

  try {
    const status = searchParams.get('status')

    const where: any = {}
    if (projectId) where.projectId = projectId
    if (status) where.status = status

    const sentiments = await prisma.audienceSentiment.findMany({
      where,
      include: {
        _count: {
          select: { comments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ sentiments, _demo: false })
  } catch (error) {
    console.error('Error fetching sentiments:', error)
    // Fallback to demo data on error
    return NextResponse.json(getDemoSentiments(projectId))
  }
}

// POST /api/audience-sentiment - Create new sentiment analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, title, platform, videoUrl, useDemo } = body

    // Support demo mode
    if (useDemo || !projectId || projectId === 'demo-project') {
      const demoSentiment = {
        id: `demo-${Date.now()}`,
        projectId: projectId || 'demo-project',
        title,
        platform,
        videoUrl: videoUrl || null,
        totalComments: 0,
        analyzedCount: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        avgSentiment: 0,
        topPositive: [],
        topNegative: [],
        takeaways: [],
        posterTips: [],
        status: 'completed',
        errorMsg: null,
        createdAt: new Date().toISOString(),
        _count: { comments: 0 },
      }
      return NextResponse.json({ sentiment: demoSentiment, _demo: true })
    }

    if (!projectId || !title || !platform) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const sentiment = await prisma.audienceSentiment.create({
      data: {
        projectId,
        title,
        platform,
        videoUrl: videoUrl || null,
        status: 'pending'
      }
    })

    return NextResponse.json({ sentiment, _demo: false })
  } catch (error) {
    console.error('Error creating sentiment:', error)
    // Return demo sentiment on error
    return NextResponse.json({
      sentiment: {
        id: `demo-${Date.now()}`,
        projectId: 'demo-project',
        title: 'Demo Analysis',
        platform: 'youtube',
        status: 'completed',
        createdAt: new Date().toISOString(),
      },
      _demo: true
    })
  }
}

// PATCH /api/audience-sentiment - Update sentiment analysis
export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing sentiment ID' }, { status: 400 })
    }

    const body = await request.json()

    const sentiment = await prisma.audienceSentiment.update({
      where: { id },
      data: body
    })

    return NextResponse.json({ sentiment })
  } catch (error) {
    console.error('Error updating sentiment:', error)
    return NextResponse.json({ error: 'Failed to update sentiment' }, { status: 500 })
  }
}

// DELETE /api/audience-sentiment - Delete sentiment analysis
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing sentiment ID' }, { status: 400 })
    }

    await prisma.audienceSentiment.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting sentiment:', error)
    return NextResponse.json({ error: 'Failed to delete sentiment' }, { status: 500 })
  }
}
