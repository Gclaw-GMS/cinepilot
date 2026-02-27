import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/audience-sentiment - List all sentiment analyses
export async function GET(request: NextRequest) {
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

    return NextResponse.json({ sentiments })
  } catch (error) {
    console.error('Error fetching sentiments:', error)
    return NextResponse.json({ error: 'Failed to fetch sentiments' }, { status: 500 })
  }
}

// POST /api/audience-sentiment - Create new sentiment analysis
export async function POST(request: NextRequest) {
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

    return NextResponse.json({ sentiment })
  } catch (error) {
    console.error('Error creating sentiment:', error)
    return NextResponse.json({ error: 'Failed to create sentiment analysis' }, { status: 500 })
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
