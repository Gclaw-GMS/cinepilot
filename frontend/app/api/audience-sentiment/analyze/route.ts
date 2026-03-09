import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Check if database is available
let dbAvailable = true
try {
  await prisma.$connect()
  await prisma.$disconnect()
} catch {
  dbAvailable = false
}

// Sample comments for demo (in production, this would scrape from YouTube/Social media)
const DEMO_COMMENTS = [
  { author: "MovieLoverChennai", text: "First look looks amazing! The visuals are stunning 🔥", likes: 234 },
  { author: "TamilCinemaFan", text: "BGM itself is a blockbuster! Can't wait for the release", likes: 189 },
  { author: "KollywoodWatch", text: "This is going to be the biggest hit of 2026!", likes: 156 },
  { author: "CinemaLover22", text: "Not impressed with the VFX in some scenes", likes: 45 },
  { author: "SuriyaFan", text: "Suriya's expression in the climax is mind-blowing!", likes: 312 },
  { author: "FilmCriticTN", text: "The story seems predictable, but performances look top-notch", likes: 78 },
  { author: "MadhavanTR", text: "This will shatter all box office records! 💰", likes: 267 },
  { author: "RegionalCinema", text: "Great to see our regional cinema reaching new heights", likes: 145 },
  { author: "BollywoodToTamil", text: "The cinematography is world-class!", likes: 198 },
  { author: "SkepticalViewer", text: "Too many slow-motion shots, hope they cut it in final", likes: 34 },
  { author: "ThalaAjithF", text: "Ajith looking fresh! This role is perfect for him", likes: 223 },
  { author: "MusicDirector", text: "Anirudh never disappoints! The songs are already on repeat", likes: 445 },
  { author: "JuniorHTamil", text: "Vijay's entry scene gave me goosebumps!", likes: 378 },
  { author: "NGL", text: "The dialogues sound repetitive from previous movies", likes: 56 },
  { author: "TheRealCritic", text: "Great production value, but screenplay might be weak", likes: 67 },
  { author: "TamilNaduBoxOffice", text: "100 Days guarantee! This will be a massive blockbuster", likes: 289 },
  { author: "DubbedFilmFan", text: "Can't wait for the Hindi dubbed version!", likes: 112 },
  { author: "CinematicVibes", text: "The color grading is perfect for this genre", likes: 167 },
  { author: "PrakashRajFan", text: "Prakash Raj's villain role is going to be iconic!", likes: 234 },
  { author: "FirstWeekend", text: "Already booked tickets for opening day!", likes: 445 },
  { author: "PragmaticCinephile", text: "Let's wait for the actual movie before judging", likes: 89 },
  { author: "YashFan", text: "Pan-India presence confirmed with this trailer!", likes: 356 },
  { author: "SamanthaFan", text: "Samantha's role might be small but impactful!", likes: 278 },
  { author: "TrollPolice", text: "Copy paste from some Hollywood movie", likes: 23 },
  { author: "TamilPride", text: "Our industry is giving tough competition to Bollywood now!", likes: 189 }
]

// Simple sentiment analysis function
function analyzeSentiment(text: string): { sentiment: string; score: number; emotions: string[] } {
  const positiveWords = ['amazing', 'stunning', 'best', 'great', 'love', 'excellent', 'fantastic', 'awesome', 'brilliant', 'blockbuster', 'fresh', 'impressed', 'perfect', 'iconic', 'massive', 'world-class', 'goosebumps', 'repeat', 'tough competition']
  const negativeWords = ['not impressed', 'weak', 'predictable', 'repetitive', 'copy', 'slow', 'bad', 'poor', 'disappointed', 'boring', 'waste', 'overrated']
  const excitedEmotions = ['amazing', 'stunning', 'blockbuster', 'cant wait', 'goosebumps', 'fresh', 'massive', 'iconic']
  const disappointedEmotions = ['not impressed', 'predictable', 'repetitive', 'weak', 'copy', 'slow']

  const lowerText = text.toLowerCase()
  
  let score = 0
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score += 0.2
  })
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 0.2
  })
  
  score = Math.max(-1, Math.min(1, score))
  
  let sentiment = 'neutral'
  if (score > 0.2) sentiment = 'positive'
  else if (score < -0.2) sentiment = 'negative'
  
  const emotions: string[] = []
  excitedEmotions.forEach(word => {
    if (lowerText.includes(word)) emotions.push('excited')
  })
  disappointedEmotions.forEach(word => {
    if (lowerText.includes(word)) emotions.push('disappointed')
  })
  if (emotions.length === 0) emotions.push('neutral')
  
  return { sentiment, score, emotions: [...new Set(emotions)] }
}

// POST /api/audience-sentiment/analyze - Run sentiment analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sentimentId } = body

    if (!sentimentId) {
      return NextResponse.json({ error: 'Missing sentiment ID' }, { status: 400 })
    }

    // Demo mode fallback - simulate analysis without database
    if (!dbAvailable || sentimentId.startsWith('demo-')) {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Analyze demo comments
      let positiveCount = 0
      let negativeCount = 0
      let neutralCount = 0
      let totalScore = 0

      const analyzedComments = DEMO_COMMENTS.map((comment) => {
        const analysis = analyzeSentiment(comment.text)
        
        if (analysis.sentiment === 'positive') positiveCount++
        else if (analysis.sentiment === 'negative') negativeCount++
        else neutralCount++
        
        totalScore += analysis.score

        return {
          sentimentId,
          commentText: comment.text,
          author: comment.author,
          sentiment: analysis.sentiment,
          sentimentScore: analysis.score,
          emotions: analysis.emotions,
          language: 'en',
          likes: comment.likes,
          replies: Math.floor(comment.likes * 0.2),
        }
      })

      const total = analyzedComments.length
      const avgSentiment = totalScore / total

      // Get top positive and negative comments
      const sortedByLikes = [...analyzedComments].sort((a, b) => b.likes - a.likes)
      const topPositive = sortedByLikes.filter(c => c.sentiment === 'positive').slice(0, 5).map(c => ({
        text: c.commentText,
        author: c.author,
        likes: c.likes
      }))
      const topNegative = sortedByLikes.filter(c => c.sentiment === 'negative').slice(0, 3).map(c => ({
        text: c.commentText,
        author: c.author,
        likes: c.likes
      }))

      // Generate takeaways and poster tips
      const takeaways = [
        positiveCount > total * 0.6 ? "Strong positive reception - audiences are excited about the content" : "Mixed reception - consider addressing concerns in marketing",
        "Music and BGM receiving high praise - emphasize in promotions",
        "Lead actors' performances generating buzz - feature prominently in posters",
        avgSentiment > 0.3 ? "High enthusiasm levels - capitalize with early bookings" : "Moderate interest - increase promotional activities"
      ]

      const posterTips = [
        "Feature lead actor in dynamic pose - receiving most engagement",
        "Highlight music/composer name prominently - BGM is a major draw",
        "Use vibrant colors - positive sentiment correlates with visual appeal",
        "Include key action moments - audiences respond to dynamic imagery",
        "Consider regional language elements in poster design",
        negativeCount > total * 0.2 ? "Address VFX concerns - consider improving in final cut" : "VFX quality not a major concern"
      ]

      return NextResponse.json({ 
        sentiment: {
          id: sentimentId,
          status: 'completed',
          totalComments: total,
          analyzedCount: total,
          positiveCount,
          negativeCount,
          neutralCount,
          avgSentiment,
          topPositive,
          topNegative,
          takeaways,
          posterTips
        },
        comments: analyzedComments,
        _demo: true
      })
    }

    // Database mode - update status to analyzing
    await prisma.audienceSentiment.update({
      where: { id: sentimentId },
      data: { status: 'analyzing' }
    })

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500))
    await prisma.audienceSentiment.update({
      where: { id: sentimentId },
      data: { status: 'analyzing' }
    })

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Analyze each comment
    let positiveCount = 0
    let negativeCount = 0
    let neutralCount = 0
    let totalScore = 0

    const analyzedComments = DEMO_COMMENTS.map((comment, index) => {
      const analysis = analyzeSentiment(comment.text)
      
      if (analysis.sentiment === 'positive') positiveCount++
      else if (analysis.sentiment === 'negative') negativeCount++
      else neutralCount++
      
      totalScore += analysis.score

      return {
        sentimentId,
        commentText: comment.text,
        author: comment.author,
        sentiment: analysis.sentiment,
        sentimentScore: analysis.score,
        emotions: analysis.emotions,
        language: 'en',
        likes: comment.likes,
        replies: Math.floor(comment.likes * 0.2),
        postedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      }
    })

    // Insert comments
    await prisma.sentimentComment.createMany({
      data: analyzedComments
    })

    const total = analyzedComments.length
    const avgSentiment = totalScore / total

    // Get top positive and negative comments
    const sortedByLikes = [...analyzedComments].sort((a, b) => b.likes - a.likes)
    const topPositive = sortedByLikes.filter(c => c.sentiment === 'positive').slice(0, 5).map(c => ({
      text: c.commentText,
      author: c.author,
      likes: c.likes
    }))
    const topNegative = sortedByLikes.filter(c => c.sentiment === 'negative').slice(0, 3).map(c => ({
      text: c.commentText,
      author: c.author,
      likes: c.likes
    }))

    // Generate takeaways and poster tips based on analysis
    const takeaways = [
      positiveCount > total * 0.6 ? "Strong positive reception - audiences are excited about the content" : "Mixed reception - consider addressing concerns in marketing",
      "Music and BGM receiving high praise - emphasize in promotions",
      "Lead actors' performances generating buzz - feature prominently in posters",
      avgSentiment > 0.3 ? "High enthusiasm levels - capitalize with early bookings" : "Moderate interest - increase promotional activities"
    ]

    const posterTips = [
      "Feature lead actor in dynamic pose - receiving most engagement",
      "Highlight music/composer name prominently - BGM is a major draw",
      "Use vibrant colors - positive sentiment correlates with visual appeal",
      "Include key action moments - audiences respond to dynamic imagery",
      "Consider regional language elements in poster design",
      negativeCount > total * 0.2 ? "Address VFX concerns - consider improving in final cut" : "VFX quality not a major concern"
    ]

    // Update sentiment analysis with results
    const updatedSentiment = await prisma.audienceSentiment.update({
      where: { id: sentimentId },
      data: {
        status: 'completed',
        totalComments: total,
        analyzedCount: total,
        positiveCount,
        negativeCount,
        neutralCount,
        avgSentiment,
        topPositive,
        topNegative,
        takeaways,
        posterTips
      }
    })

    return NextResponse.json({ sentiment: updatedSentiment, comments: analyzedComments })
  } catch (error) {
    console.error('Error analyzing sentiment:', error)
    return NextResponse.json({ error: 'Failed to analyze sentiment' }, { status: 500 })
  }
}
