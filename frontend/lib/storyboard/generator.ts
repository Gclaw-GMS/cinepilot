import { prisma } from '@/lib/db';
import { cacheGet, cacheSet, CACHE_TTL } from '@/lib/redis/cache';
import { generateImage } from '@/lib/ai/service';
import { getImagePrompt, MODELS } from '@/lib/ai/config';
import { uploadFile } from '@/lib/storage';
import crypto from 'crypto';

// =============================================================================
// Storyboard Generator
// Selects key shots per scene, builds image prompts, generates frames
// =============================================================================

export type StoryboardStyle = 'cleanLineArt' | 'pencilSketch' | 'markerLine' | 'blueprint';

interface GenerateFrameInput {
  shotId: string;
  style?: StoryboardStyle;
  regenerate?: boolean;
}

interface GenerateSceneFramesInput {
  sceneId: string;
  style?: StoryboardStyle;
  maxFrames?: number;
}

// -----------------------------------------------------------------------------
// Build Prompt from Shot Data
// -----------------------------------------------------------------------------

function buildScenePrompt(shot: {
  shotText: string;
  shotSize: string | null;
  cameraAngle: string | null;
  cameraMovement: string | null;
  characters: string[];
  scene: {
    intExt: string | null;
    timeOfDay: string | null;
    location: string | null;
    headingRaw: string | null;
  };
}): string {
  const parts: string[] = [];

  if (shot.scene.intExt) parts.push(shot.scene.intExt);
  if (shot.scene.timeOfDay) parts.push(shot.scene.timeOfDay.toLowerCase());
  if (shot.scene.location) parts.push(shot.scene.location);

  if (shot.shotSize) parts.push(`${shot.shotSize} shot`);
  if (shot.cameraAngle) parts.push(`${shot.cameraAngle} angle`);
  if (shot.cameraMovement && shot.cameraMovement !== 'static') {
    parts.push(`${shot.cameraMovement} camera`);
  }

  if (shot.characters.length > 0) {
    const charCount = shot.characters.length;
    parts.push(charCount === 1 ? 'single figure' : `${charCount} figures`);
  }

  parts.push(shot.shotText);

  return parts.join(', ');
}

// -----------------------------------------------------------------------------
// Generate Single Frame
// -----------------------------------------------------------------------------

export async function generateFrame(input: GenerateFrameInput): Promise<{ frameId: string; imageUrl: string | null }> {
  const { shotId, style = 'cleanLineArt', regenerate = false } = input;

  const shot = await prisma.shot.findUnique({
    where: { id: shotId },
    include: {
      scene: {
        select: { intExt: true, timeOfDay: true, location: true, headingRaw: true, scriptId: true },
      },
      storyboardFrames: { where: { style }, take: 1 },
    },
  });

  if (!shot) throw new Error('Shot not found');

  if (!regenerate && shot.storyboardFrames.length > 0 && shot.storyboardFrames[0].imageUrl) {
    return { frameId: shot.storyboardFrames[0].id, imageUrl: shot.storyboardFrames[0].imageUrl };
  }

  const scenePrompt = buildScenePrompt(shot);
  const { positive, negative } = getImagePrompt(style, scenePrompt);
  const promptHash = crypto.createHash('md5').update(positive).digest('hex');

  const cacheKey = `storyboard:${promptHash}:${style}`;
  const cachedUrl = await cacheGet<string>(cacheKey);

  let imageUrl: string | null = cachedUrl || null;

  if (!imageUrl) {
    let frame = shot.storyboardFrames[0];
    if (!frame) {
      frame = await prisma.storyboardFrame.create({
        data: {
          shotId,
          prompt: positive,
          style,
          status: 'generating',
        },
      });
    } else {
      await prisma.storyboardFrame.update({
        where: { id: frame.id },
        data: { status: 'generating', prompt: positive },
      });
    }

    try {
      const urls = await generateImage('dalle3', positive, {
        size: '1792x1024',
        quality: 'standard',
        n: 1,
        negativePrompt: negative,
      });

      imageUrl = urls[0] || null;

      if (imageUrl) {
        try {
          const imgRes = await fetch(imageUrl);
          const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
          const storagePath = `storyboards/${shot.scene.scriptId}/${shot.sceneId}/${shotId}_${style}.png`;
          const result = await uploadFile(storagePath, imgBuffer, 'image/png');
          imageUrl = result.url;
        } catch {
          // Keep the original URL if storage upload fails
        }

        await prisma.storyboardFrame.update({
          where: { id: frame.id },
          data: { imageUrl, status: 'done' },
        });

        await cacheSet(cacheKey, imageUrl, CACHE_TTL.ai);
      } else {
        await prisma.storyboardFrame.update({
          where: { id: frame.id },
          data: { status: 'failed' },
        });
      }

      return { frameId: frame.id, imageUrl };
    } catch (err) {
      await prisma.storyboardFrame.update({
        where: { id: frame.id },
        data: { status: 'failed' },
      });
      console.error('[Storyboard] Generation failed:', err);
      return { frameId: frame.id, imageUrl: null };
    }
  }

  return { frameId: shot.storyboardFrames[0]?.id || '', imageUrl };
}

// -----------------------------------------------------------------------------
// Generate Key Frames for a Scene
// -----------------------------------------------------------------------------

export async function generateSceneFrames(input: GenerateSceneFramesInput) {
  const { sceneId, style = 'cleanLineArt', maxFrames = 3 } = input;

  const shots = await prisma.shot.findMany({
    where: { sceneId },
    orderBy: [{ importance: 'desc' }, { shotIndex: 'asc' }],
  });

  if (shots.length === 0) throw new Error('No shots found for this scene');

  const keyShots = shots.slice(0, maxFrames);

  const results: { shotId: string; shotIndex: number; frameId: string; imageUrl: string | null }[] = [];

  for (const shot of keyShots) {
    const result = await generateFrame({ shotId: shot.id, style });
    results.push({
      shotId: shot.id,
      shotIndex: shot.shotIndex,
      frameId: result.frameId,
      imageUrl: result.imageUrl,
    });
  }

  return results;
}

// -----------------------------------------------------------------------------
// Get Frames for a Script/Scene
// -----------------------------------------------------------------------------

export async function getFrames(scriptId?: string, sceneId?: string) {
  const where = sceneId
    ? { shot: { sceneId } }
    : scriptId
      ? { shot: { scene: { scriptId } } }
      : {};

  return prisma.storyboardFrame.findMany({
    where,
    include: {
      shot: {
        select: {
          id: true,
          shotIndex: true,
          shotText: true,
          shotSize: true,
          characters: true,
          scene: {
            select: {
              id: true,
              sceneNumber: true,
              headingRaw: true,
              intExt: true,
              timeOfDay: true,
            },
          },
        },
      },
    },
    orderBy: [{ shot: { scene: { sceneIndex: 'asc' } } }, { shot: { shotIndex: 'asc' } }],
  });
}
