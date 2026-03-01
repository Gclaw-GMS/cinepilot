import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const DEMO_PROJECT_ID = 'demo-project'

// In-memory store for demo mode - survives during server runtime
// This allows newly created analyses to persist during the session
let demoSentiments: any[] = [
  {
    id: 'demo-1',
    projectId: DEMO_PROJECT_ID,
    title: 'Kaadhal Enbadhu - Teaser Response',
    platform: 'youtube',
    videoUrl: 'https://youtube.com/watch?v=demo1',
    totalComments: 15420,
    analyzedCount: 500,
    positiveCount: 342,
    negativeCount: 58,
    neutralCount: 100,
    avgSentiment: 0.68,
    topPositive: [
      { text: 'Mass elevation! 🔥', author: 'CinemaLover', likes: 1243 },
      { text: 'BGM ke bunk.', author: 'MusicFan', likes: 987 },
      { text: 'This is going to be a blockbuster!', author: 'TamilCinema', likes: 856 },
    ],
    topNegative: [
      { text: 'Typical formula', author: 'CriticKing', likes: 45 },
      { text: 'Seen this before', author: 'MovieWatcher', likes: 32 },
    ],
    takeaways: [
      'Strong positive reception to lead actors chemistry',
      'Music and BGM receiving exceptional praise',
      'High anticipation for visual grandeur',
      'Rural drama theme resonates well with audience',
    ],
    posterTips: [
      'Emphasize the emotional connect in key frames',
      'Showcase star power prominently',
      'Highlight production values',
    ],
    status: 'completed',
    errorMsg: null,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    _count: { comments: 500 },
  },
  {
    id: 'demo-2',
    projectId: DEMO_PROJECT_ID,
    title: 'Vikram Vedha 2 - First Look',
    platform: 'youtube',
    videoUrl: 'https://youtube.com/watch?v=demo2',
    totalComments: 8932,
    analyzedCount: 300,
    positiveCount: 215,
    negativeCount: 42,
    neutralCount: 43,
    avgSentiment: 0.72,
    topPositive: [
      { text: 'Vijay vs Hrithik - Epic clash!', author: 'ActionFan', likes: 782 },
      { text: 'The intensity is real', author: 'Thalaivar', likes: 654 },
    ],
    topNegative: [
      { text: 'Remake fatigue', author: 'FilmBuff', likes: 28 },
    ],
    takeaways: [
      'Star cast driving majority of excitement',
      'Action sequences highly anticipated',
      'Thriller genre generating interest',
    ],
    posterTips: [
      'Show star power with dynamic poses',
      'Create tension through lighting and composition',
    ],
    status: 'completed',
    errorMsg: null,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    _count: { comments: 300 },
  },
  {
    id: 'demo-3',
    projectId: DEMO_PROJECT_ID,
    title: 'Leo - Trailer Reactions',
    platform: 'instagram',
    videoUrl: 'https://instagram.com/p/demo3',
    totalComments: 45000,
    analyzedCount: 1000,
    positiveCount: 780,
    negativeCount: 120,
    neutralCount: 100,
    avgSentiment: 0.75,
    topPositive: [
      { text: 'Loki delivered! 🐆', author: 'LCF', likes: 5420 },
      { text: 'Vijay at his best', author: 'ThalapathyFC', likes: 3210 },
    ],
    takeaways: [
      'Mass elevation with stylish action',
      'International locations adding grandeur',
      'Loki touch clearly visible',
    ],
    posterTips: [
      'Use bold, high-contrast visuals',
      'Feature Vijay prominently',
    ],
    status: 'completed',
    errorMsg: null,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    _count: { comments: 1000 },
  },
]

let isDbAvailable = false

// Check database connection
async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    isDbAvailable = true
    return true
  } catch (error) {
    console.log('[Audience Sentiment] Database not available, using demo data')
    isDbAvailable = false
    return false
  }
}

// GET /api/audience-sentiment - List all sentiment analyses
export async function GET(request: NextRequest) {
  const dbConnected = await checkDbConnection()
  
  if (!dbConnected) {
    return NextResponse.json({ 
      sentiments: demoSentiments,
      isDemo: true 
    })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
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

    // If no records in DB, return demo data
    if (sentiments.length === 0) {
      return NextResponse.json({ 
        sentiments: demoSentiments,
        isDemo: true 
      })
    }

    return NextResponse.json({ sentiments, isDemo: false })
  } catch (error) {
    console.error('Error fetching sentiments:', error)
    // Fallback to demo data on error
    return NextResponse.json({ 
      sentiments: demoSentiments,
      isDemo: true,
      error: 'Using demo data due to server error' 
    })
  }
}

// POST /api/audience-sentiment - Create new sentiment analysis
export async function POST(request: NextRequest) {
  const dbConnected = await checkDbConnection()
  
  if (!dbConnected) {
    // Create a new demo sentiment in our in-memory store
    const body = await request.json().catch(() => ({}))
    const { title = 'New Analysis', platform = 'youtube', videoUrl = null } = body
    
    const newDemoSentiment = {
      id: `demo-${Date.now()}`,
      projectId: DEMO_PROJECT_ID,
      title,
      platform,
      videoUrl,
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
      status: 'pending',
      errorMsg: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { comments: 0 },
    }
    
    // Add to beginning of demo sentiments
    demoSentiments = [newDemoSentiment, ...demoSentiments]
    
    return NextResponse.json({ 
      sentiment: newDemoSentiment,
      isDemo: true 
    })
  }

  try {
    const body = await request.json()
    const { projectId, title, platform, videoUrl } = body

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

    return NextResponse.json({ sentiment, isDemo: false })
  } catch (error) {
    console.error('Error creating sentiment:', error)
    return NextResponse.json({ error: 'Failed to create sentiment analysis' }, { status: 500 })
  }
}

// PATCH /api/audience-sentiment - Update sentiment analysis
export async function PATCH(request: NextRequest) {
  const dbConnected = await checkDbConnection()
  
  if (!dbConnected) {
    // Update the demo sentiment in our in-memory store
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (id && id.startsWith('demo-')) {
      const body = await request.json().catch(() => ({}))
      const index = demoSentiments.findIndex(s => s.id === id)
      
      if (index !== -1) {
        demoSentiments[index] = {
          ...demoSentiments[index],
          ...body,
          updatedAt: new Date().toISOString()
        }
        return NextResponse.json({ 
          sentiment: demoSentiments[index],
          isDemo: true 
        })
      }
    }
    
    return NextResponse.json({ 
      sentiment: { id: 'demo-update', status: 'completed' },
      isDemo: true 
    })
  }

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
  const dbConnected = await checkDbConnection()
  
  if (!dbConnected) {
    // Remove from demo store
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (id) {
      demoSentiments = demoSentiments.filter(s => s.id !== id)
    }
    
    return NextResponse.json({ success: true, isDemo: true })
  }

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
