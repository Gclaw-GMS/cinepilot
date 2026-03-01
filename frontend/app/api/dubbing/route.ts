import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/ai/service';
import { MODELS } from '@/lib/ai/config';

const SUPPORTED_LANGUAGES = ['telugu', 'hindi', 'malayalam', 'kannada', 'english'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const DEFAULT_PROJECT_ID = 'default-project';

// Demo data for fallback when database is not connected
const DEMO_SCRIPTS = [
  { id: 'demo-1', title: 'Kaadhal Enbadhu (Tamil)', language: 'tamil', createdAt: '2026-02-15T10:00:00Z' },
];

const DEMO_DUBBED_VERSIONS = {
  'demo-1': [
    { id: 'dub-1', title: 'Kaadhal Enbadhu (Telugu)', language: 'telugu', createdAt: '2026-02-20T14:30:00Z' },
    { id: 'dub-2', title: 'Kaadhal Enbadhu (Hindi)', language: 'hindi', createdAt: '2026-02-21T09:15:00Z' },
  ],
};

const DEMO_TRANSLATED_SCENES = {
  telugu: [
    { sceneNumber: '1', translatedDialogue: 'INT. COLLEGE CAMPUS - DAY\n\nPREMA enters the campus with excitement. Her eyes scan the bustling environment.\n\nPREMA\n(softly)\nIdhe naa first day...', notes: 'Lip-sync adapted' },
    { sceneNumber: '2', translatedDialogue: 'INT. CLASSROOM - DAY\n\nPrema takes a seat. Her neighbor ARJUN smiles at her.\n\nARJUN\nHi! I\'m Arjun. Are you new?', notes: null },
    { sceneNumber: '3', translatedDialogue: 'EXT. CANTEEN - EVENING\n\nPrema and Arjun share a meal. Laughter echoes.\n\nPREMA\n(costing)\nThis place is amazing!', notes: 'Cultural adaptation: "shaa" changed to "amazing"' },
  ],
  hindi: [
    { sceneNumber: '1', translatedDialogue: 'INT. COLLEGE CAMPUS - DAY\n\nPREMA enters the campus with excitement. Her eyes scan the bustling environment.\n\nPREMA\n(softly)\nYeh mera pehla din hai...', notes: 'Lip-sync adapted' },
    { sceneNumber: '2', translatedDialogue: 'INT. CLASSROOM - DAY\n\nPrema takes a seat. Her neighbor ARJUN smiles at her.\n\nARJUN\nNamaste! Main Arjun hoon. Kya tum nayi ho?', notes: null },
    { sceneNumber: '3', translatedDialogue: 'EXT. CANTEEN - EVENING\n\nPrema and Arjun share a meal. Laughter echoes.\n\nPREMA\n(laughing)\nYeh jagah bahut badhiya hai!', notes: 'Cultural adaptation' },
  ],
};

// Demo translation for generation
async function generateDemoTranslation(targetLanguage: string): Promise<{ 
  scriptId: string; 
  language: string; 
  scenesTranslated: number; 
  totalOriginalScenes: number;
  translatedScenes: typeof DEMO_TRANSLATED_SCENES.telugu;
}> {
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
  
  return {
    scriptId: 'demo-generated',
    language: targetLanguage,
    scenesTranslated: 3,
    totalOriginalScenes: 3,
    translatedScenes: DEMO_TRANSLATED_SCENES[targetLanguage as keyof typeof DEMO_TRANSLATED_SCENES] || DEMO_TRANSLATED_SCENES.telugu,
  };
}

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
    const demo = req.nextUrl.searchParams.get('demo') === 'true';
    
    // Check for demo mode
    if (demo || !scriptId) {
      // Return demo scripts for dropdown
      return NextResponse.json({ 
        scripts: DEMO_SCRIPTS,
        dubbedVersions: DEMO_DUBBED_VERSIONS,
        isDemoMode: true 
      });
    }

    // Try to get project from script
    let projectId: string;
    try {
      projectId = await getProjectForScript(scriptId);
    } catch {
      // If script not found in DB, return demo data
      return NextResponse.json({ 
        scripts: DEMO_SCRIPTS,
        dubbedVersions: DEMO_DUBBED_VERSIONS[scriptId as keyof typeof DEMO_DUBBED_VERSIONS] || [],
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

    return NextResponse.json({ scripts: dubbedScripts, isDemoMode: false });
  } catch (err) {
    // Return demo data on any error
    return NextResponse.json({ 
      scripts: DEMO_SCRIPTS,
      dubbedVersions: DEMO_DUBBED_VERSIONS,
      isDemoMode: true,
      error: 'Using demo data' 
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scriptId, targetLanguage, demo } = body as {
      scriptId?: string;
      targetLanguage?: string;
      demo?: boolean;
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

    // Demo mode - return simulated translation
    if (demo || scriptId.startsWith('demo-')) {
      const demoResult = await generateDemoTranslation(targetLanguage);
      return NextResponse.json({
        ...demoResult,
        isDemoMode: true,
      });
    }

    // Try database mode
    let original;
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
    } catch {
      // DB not connected, use demo
      const demoResult = await generateDemoTranslation(targetLanguage);
      return NextResponse.json({
        ...demoResult,
        isDemoMode: true,
      });
    }

    if (!original) {
      // Script not found, use demo
      const demoResult = await generateDemoTranslation(targetLanguage);
      return NextResponse.json({
        ...demoResult,
        isDemoMode: true,
      });
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
      isDemoMode: false,
    });
  } catch (err) {
    // On any error, try to return demo data
    try {
      const demoResult = await generateDemoTranslation('telugu');
      return NextResponse.json({
        ...demoResult,
        isDemoMode: true,
        error: 'Using demo data due to error',
      });
    } catch {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
}
