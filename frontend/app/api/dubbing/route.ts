import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/ai/service';
import { MODELS } from '@/lib/ai/config';

const SUPPORTED_LANGUAGES = ['telugu', 'hindi', 'malayalam', 'kannada', 'english'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

async function getProjectForScript(scriptId: string): Promise<string> {
  const script = await prisma.script.findUnique({
    where: { id: scriptId },
    select: { projectId: true },
  });
  if (!script) throw new Error(`Script ${scriptId} not found`);
  return script.projectId;
}

export async function GET(req: NextRequest) {
  try {
    const scriptId = req.nextUrl.searchParams.get('scriptId');
    if (!scriptId) {
      return NextResponse.json({ error: 'scriptId query param is required' }, { status: 400 });
    }

    const projectId = await getProjectForScript(scriptId);

    const dubbedScripts = await prisma.script.findMany({
      where: {
        projectId,
        language: { not: 'tamil' },
      },
      select: {
        id: true,
        title: true,
        language: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ scripts: dubbedScripts });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scriptId, targetLanguage } = body as {
      scriptId?: string;
      targetLanguage?: string;
    };

    if (!scriptId || !targetLanguage) {
      return NextResponse.json(
        { error: 'scriptId and targetLanguage are required' },
        { status: 400 },
      );
    }

    if (!SUPPORTED_LANGUAGES.includes(targetLanguage as SupportedLanguage)) {
      return NextResponse.json(
        { error: `Unsupported language. Supported: ${SUPPORTED_LANGUAGES.join(', ')}` },
        { status: 400 },
      );
    }

    const original = await prisma.script.findUnique({
      where: { id: scriptId },
      include: {
        scenes: {
          orderBy: { sceneIndex: 'asc' },
          select: {
            id: true,
            sceneNumber: true,
            headingRaw: true,
            description: true,
            descriptionTamil: true,
            location: true,
            timeOfDay: true,
            intExt: true,
          },
        },
      },
    });

    if (!original) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    const scenes = original.scenes.map((s) => ({
      sceneNumber: s.sceneNumber,
      heading: s.headingRaw,
      description: s.description || s.descriptionTamil || '',
      location: s.location,
      timeOfDay: s.timeOfDay,
      intExt: s.intExt,
    }));

    const translated = await chatCompletion(MODELS.gpt4o, [
      {
        role: 'system',
        content: `You are a film dubbing translator specializing in South Indian cinema. Translate Tamil dialogue to ${targetLanguage} while: 1) Matching lip-sync syllable counts where possible 2) Adapting cultural references 3) Maintaining emotional tone 4) Preserving character voice. Return JSON: { scenes: [{ sceneNumber, translatedDialogue, notes }] }`,
      },
      { role: 'user', content: JSON.stringify(scenes) },
    ], { responseFormat: { type: 'json_object' } });

    let translatedScenes: Array<{
      sceneNumber: string;
      translatedDialogue: string;
      notes?: string;
    }> = [];

    try {
      const parsed = JSON.parse(translated);
      translatedScenes = parsed.scenes || [];
    } catch {
      translatedScenes = [];
    }

    const newScript = await prisma.script.create({
      data: {
        projectId: original.projectId,
        title: `${original.title} (${targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1)})`,
        language: targetLanguage,
        content: JSON.stringify({ originalScriptId: scriptId, translatedScenes }),
        version: 1,
        isActive: true,
      },
    });

    return NextResponse.json({
      scriptId: newScript.id,
      language: targetLanguage,
      scenesTranslated: translatedScenes.length,
      totalOriginalScenes: scenes.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
