import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { LootStatus } from '@prisma/client';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);
    
    const { status } = await request.json();

    if (!Object.values(LootStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const lootItem = await prisma.lootItem.update({
      where: { id: params.id },
      data: { status },
      include: {
        boss: true,
        participations: {
          include: {
            member: true
          }
        }
      }
    });

    return NextResponse.json(lootItem);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}