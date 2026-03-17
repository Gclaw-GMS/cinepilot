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
// Includes Tamil, English, Telugu, Hindi comments for South Indian cinema focus
const DEMO_COMMENTS = [
  // Tamil comments
  { author: "MovieLoverChennai", text: "First look looks amazing! The visuals are stunning 🔥", likes: 234, language: "tamil" },
  { author: "TamilCinemaFan", text: "BGM itself is a blockbuster! Can't wait for the release", likes: 189, language: "tamil" },
  { author: "KollywoodWatch", text: "This is going to be the biggest hit of 2026!", likes: 156, language: "tamil" },
  { author: "SuriyaFan", text: "Suriya's expression in the climax is mind-blowing!", likes: 312, language: "tamil" },
  { author: "FilmCriticTN", text: "The story seems predictable, but performances look top-notch", likes: 78, language: "tamil" },
  { author: "MadhavanTR", text: "This will shatter all box office records! 💰", likes: 267, language: "tamil" },
  { author: "ThalaAjithF", text: "Ajith looking fresh! This role is perfect for him", likes: 223, language: "tamil" },
  { author: "JuniorHTamil", text: "Vijay's entry scene gave me goosebumps!", likes: 378, language: "tamil" },
  { author: "TamilNaduBoxOffice", text: "100 Days guarantee! This will be a massive blockbuster", likes: 289, language: "tamil" },
  { author: "PrakashRajFan", text: "Prakash Raj's villain role is going to be iconic!", likes: 234, language: "tamil" },
  { author: "FirstWeekend", text: "Already booked tickets for opening day!", likes: 445, language: "tamil" },
  { author: "TamilPride", text: "Our industry is giving tough competition to Bollywood now!", likes: 189, language: "tamil" },
  { author: "ChennaiSuperKing", text: "Super star entry anna! 🔥🔥", likes: 567, language: "tamil" },
  { author: "VijayFanatic", text: "Thalapathy power full mass scene!", likes: 432, language: "tamil" },
  
  // English comments
  { author: "CinemaLover22", text: "Not impressed with the VFX in some scenes", likes: 45, language: "english" },
  { author: "RegionalCinema", text: "Great to see our regional cinema reaching new heights", likes: 145, language: "english" },
  { author: "BollywoodToTamil", text: "The cinematography is world-class!", likes: 198, language: "english" },
  { author: "SkepticalViewer", text: "Too many slow-motion shots, hope they cut it in final", likes: 34, language: "english" },
  { author: "MusicDirector", text: "Anirudh never disappoints! The songs are already on repeat", likes: 445, language: "english" },
  { author: "TheRealCritic", text: "Great production value, but screenplay might be weak", likes: 67, language: "english" },
  { author: "DubbedFilmFan", text: "Can't wait for the Hindi dubbed version!", likes: 112, language: "english" },
  { author: "CinematicVibes", text: "The color grading is perfect for this genre", likes: 167, language: "english" },
  { author: "PragmaticCinephile", text: "Let's wait for the actual movie before judging", likes: 89, language: "english" },
  { author: "YashFan", text: "Pan-India presence confirmed with this trailer!", likes: 356, language: "english" },
  { author: "SamanthaFan", text: "Samantha's role might be small but impactful!", likes: 278, language: "english" },
  
  // Telugu comments
  { author: "TeluguCinemaLover", text: "Naa Peru MS Dhoni! Mega star power 🔥", likes: 345, language: "telugu" },
  { author: "TollywoodFan", text: "Industry hit ankam! All the best bro!", likes: 234, language: "telugu" },
  { author: "PrabhasRaOne", text: "Saaho was just warmup, this is main course!", likes: 567, language: "telugu" },
  { author: "MaheshBabuFan", text: "Sarkaru Vaari Paata combo is fire!", likes: 289, language: "telugu" },
  { author: "AlluArjunStyle", text: "Pushpa style mass entry! 🔥", likes: 678, language: "telugu" },
  
  // Hindi comments  
  { author: "BollywoodBuff", text: "SRK's star power is unmatched!", likes: 456, language: "hindi" },
  { author: "MumbaiFilmCity", text: "South Indian cinema dominating Bollywood now!", likes: 234, language: "hindi" },
  { author: "HindiHeartland", text: "Dubbed version maza aaega!", likes: 123, language: "hindi" },
  { author: "BhaiFan", text: "Salman bhai ka swag hai 🔥", likes: 345, language: "hindi" },
  
  // Negative comments
  { author: "NGL", text: "The dialogues sound repetitive from previous movies", likes: 56, language: "english" },
  { author: "TrollPolice", text: "Copy paste from some Hollywood movie", likes: 23, language: "english" },
  { author: "CritiqueKing", text: "Story is weak, bgm carry kar raha hai", likes: 45, language: "hindi" },
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
    const { sentimentId, regionalCinema } = body

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

      // Language breakdown
      const languageBreakdown = {
        tamil: 0,
        english: 0,
        telugu: 0,
        hindi: 0,
        malayalam: 0,
        kannada: 0,
        other: 0
      }

      const analyzedComments = DEMO_COMMENTS.map((comment) => {
        const analysis = analyzeSentiment(comment.text)
        
        if (analysis.sentiment === 'positive') positiveCount++
        else if (analysis.sentiment === 'negative') negativeCount++
        else neutralCount++
        
        totalScore += analysis.score

        // Track language breakdown
        const lang = comment.language || 'other'
        if (lang in languageBreakdown) {
          (languageBreakdown as any)[lang]++
        } else {
          languageBreakdown.other++
        }

        return {
          sentimentId,
          commentText: comment.text,
          author: comment.author,
          sentiment: analysis.sentiment,
          sentimentScore: analysis.score,
          emotions: analysis.emotions,
          language: comment.language || 'en',
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
        likes: c.likes,
        language: c.language
      }))
      const topNegative = sortedByLikes.filter(c => c.sentiment === 'negative').slice(0, 3).map(c => ({
        text: c.commentText,
        author: c.author,
        likes: c.likes,
        language: c.language
      }))

      // Regional cinema specific takeaways
      const region = regionalCinema || 'tamil'
      const regionName = region.charAt(0).toUpperCase() + region.slice(1)
      
      // Generate takeaways and poster tips
      const takeaways = [
        positiveCount > total * 0.6 ? `Strong positive reception for ${regionName} cinema - audiences are excited` : `Mixed reception for ${regionName} market - consider addressing concerns`,
        "Music and BGM receiving high praise - emphasize in promotions",
        "Lead actors' performances generating buzz - feature prominently in posters",
        avgSentiment > 0.3 ? "High enthusiasm levels - capitalize with early bookings" : "Moderate interest - increase promotional activities",
        languageBreakdown.tamil > languageBreakdown.english ? "Tamil audience is highly engaged - consider Tamil-specific marketing" : "English comments show pan-India appeal"
      ]

      // Regional cinema specific poster tips
      const posterTips = [
        "Feature lead actor in dynamic pose - receiving most engagement",
        "Highlight music/composer name prominently - BGM is a major draw",
        "Use vibrant colors - positive sentiment correlates with visual appeal",
        "Include key action moments - audiences respond to dynamic imagery",
      ]

      // Add regional-specific tips
      if (region === 'tamil') {
        posterTips.push(
          "Include Thala/Thalapathy reference if applicable - brand power in TN",
          "Feature villain prominently if popular - negative buzz still drives curiosity",
          "Consider Tamil title font/styles for authentic feel"
        )
      } else if (region === 'telugu') {
        posterTips.push(
          "Mass elevation shots resonate strongly with Telugu audiences",
          "Include mega star/power star elements for brand recognition",
          "Use bold, high-contrast typography popular in Telugu posters"
        )
      } else {
        posterTips.push("Consider regional language elements in poster design")
      }

      posterTips.push(negativeCount > total * 0.2 ? "Address VFX concerns - consider improving in final cut" : "VFX quality not a major concern")

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
          posterTips,
          regionalCinema: region,
          languageBreakdown
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
