import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { BossType } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET() {
  // Handle build-time execution when database isn't available
  if (typeof window === 'undefined' && !process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Service not available during build' }, { status: 503 });
  }

  try {
    const bosses = await prisma.boss.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(bosses);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bosses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { name, type, respawnTime } = await request.json();

    if (!name || !type || !respawnTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const boss = await prisma.boss.create({
      data: {
        name,
        type: type as BossType,
        respawnTime: parseInt(respawnTime)
      }
    });

    return NextResponse.json(boss);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create boss' }, { status: 500 });
  }
}