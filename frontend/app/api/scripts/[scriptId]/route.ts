import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/scripts/[scriptId] — full script data
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scriptId: string }> }
) {
  try {
    const { scriptId } = await params;

    const script = await prisma.script.findUnique({
      where: { id: scriptId },
      include: {
        scriptVersions: { orderBy: { versionNumber: 'desc' } },
        textBlocks: { orderBy: { lineStart: 'asc' } },
        scenes: {
          orderBy: { sceneIndex: 'asc' },
          include: {
            sceneCharacters: { include: { character: true } },
            sceneLocations: true,
            sceneProps: { include: { prop: true } },
            vfxNotes: true,
            warnings: true,
          },
        },
      },
    });

    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    const analyses = await prisma.aiAnalysis.findMany({
      where: { projectId: script.projectId },
      orderBy: { createdAt: 'desc' },
    });

    const characters = await prisma.character.findMany({
      where: { projectId: script.projectId },
      include: {
        sceneCharacters: {
          include: { scene: { select: { sceneNumber: true, sceneIndex: true } } },
        },
      },
    });

    return NextResponse.json({ script, analyses, characters });
  } catch (error) {
    console.error('[GET /api/scripts/[scriptId]]', error);
    return NextResponse.json({ error: 'Failed to fetch script' }, { status: 500 });
  }
}

// DELETE /api/scripts/[scriptId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ scriptId: string }> }
) {
  try {
    const { scriptId } = await params;

    await prisma.script.delete({ where: { id: scriptId } });

    return NextResponse.json({ message: 'Script deleted' });
  } catch (error) {
    console.error('[DELETE /api/scripts/[scriptId]]', error);
    return NextResponse.json({ error: 'Failed to delete script' }, { status: 500 });
  }
}
