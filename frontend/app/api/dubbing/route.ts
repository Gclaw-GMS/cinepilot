import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/ai/service';
import { MODELS } from '@/lib/ai/config';

const SUPPORTED_LANGUAGES = ['telugu', 'hindi', 'malayalam', 'kannada', 'english'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const DEFAULT_PROJECT_ID = 'default-project';

// Demo data for when database is not connected
const DEMO_DUBBED_VERSIONS = [
  { id: 'demo-dub-1', title: 'Kaadhal Enbadhu (Telugu)', language: 'telugu', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'demo-dub-2', title: 'Kaadhal Enbadhu (Hindi)', language: 'hindi', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'demo-dub-3', title: 'Kaadhal Enbadhu (Malayalam)', language: 'malayalam', createdAt: new Date().toISOString() },
];

const DEMO_TRANSLATED_SCENES = [
  { sceneNumber: '1', translatedDialogue: 'ARJUN walks along the beach, watching the waves. PRIYA joins him with ice cream.\n\nARJUN\n(softly)\nThe sea never changes, does it?\n\nPRIYA\nNo. But we do.', notes: 'Cultural adaptation: beach scene resonates with coastal audience' },
  { sceneNumber: '2', translatedDialogue: 'INT. RESTAURANT - NIGHT\n\nRomantic lighting. ARJUN and RAHUL sit at a corner table.\n\nRAHUL\nSo, did you tell her?\n\nARJUN\n(nervous)\nNot yet. I will.\n\nRAHUL\n(laughs)\nYou never change, brother.', notes: 'Lip-sync optimized for "brother" suffix' },
  { sceneNumber: '3', translatedDialogue: 'INT. APARTMENT - DAY\n\nARJUN paces, looking at his phone. He finally decides to call.\n\nARJUN\n(determined)\nHello? Priya? We need to talk.', notes: 'Direct translation preserves urgency' },
  { sceneNumber: '4', translatedDialogue: 'EXT. TEMPLE - EVENING\n\nTraditional festival. Colors everywhere. ARJUN finds PRIYA among the crowd.\n\nARJUN\n(shouting over noise)\nPriya!\n\nPRIYA\nturns around, smiling through tears.\n\nPRIYA\nYou came.', notes: 'Emotional beat maintained' },
  { sceneNumber: '5', translatedDialogue: 'INT. CAR - NIGHT\n\nARJUN drives. PRIKA sits beside him. Silence, then music.\n\nARJUN\n(smiling)\nYou know what? This is our story.\n\nPRIYA\n(nods)\nAnd it\'s just beginning.', notes: 'Romantic finale - cultural nuance added' },
];

function isPrismaError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('prisma');
}

async function getProjectForScript(scriptId: string): Promise<string | null> {
  const script = await prisma.script.findUnique({
    where: { id: scriptId },
    select: { projectId: true },
  });
  if (!script) return null;
  return script.projectId;
}

export async function GET(req: NextRequest) {
  try {
    const scriptId = req.nextUrl.searchParams.get('scriptId');
    
    if (!scriptId) {
      return NextResponse.json({ error: 'scriptId query param is required' }, { status: 400 });
    }

    // Try database first
    try {
      const projectId = await getProjectForScript(scriptId);
      
      // If script not found in database, use demo data
      if (!projectId) {
        console.log('[dubbing API] Script not found, using demo data');
        return NextResponse.json({ 
          scripts: DEMO_DUBBED_VERSIONS,
          translatedScenes: DEMO_TRANSLATED_SCENES,
          isDemoMode: true 
        });
      }

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
    } catch (dbError) {
      // Fallback to demo data if database fails
      if (isPrismaError(dbError)) {
        console.log('[dubbing API] Using demo data - database not connected');
        return NextResponse.json({ 
          scripts: DEMO_DUBBED_VERSIONS,
          translatedScenes: DEMO_TRANSLATED_SCENES,
          isDemoMode: true 
        });
      }
      throw dbError;
    }
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

    // Try database first
    let original: any = null;
    let useDemo = false;

    try {
      original = await prisma.script.findUnique({
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
    } catch (dbError) {
      if (isPrismaError(dbError)) {
        console.log('[dubbing API] Using demo data - database not connected');
        useDemo = true;
      } else {
        throw dbError;
      }
    }

    // Use demo data if database not connected
    if (useDemo || !original) {
      // Simulate generation delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newId = `demo-dub-${Date.now()}`;
      const newDub = {
        id: newId,
        title: `Kaadhal Enbadhu (${targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1)})`,
        language: targetLanguage,
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json({
        scriptId: newId,
        language: targetLanguage,
        scenesTranslated: DEMO_TRANSLATED_SCENES.length,
        totalOriginalScenes: 5,
        isDemoMode: true,
        translatedScenes: DEMO_TRANSLATED_SCENES,
        message: 'Generated using demo data - database not connected'
      });
    }

    const scenes = original.scenes.map((s: any) => ({
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
