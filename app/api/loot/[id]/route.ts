import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { LootStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';
interface RouteParams {
  params: { id: string };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    requireAdmin(request);
    
    const { name, bossId, value, dateAcquired, status, participants } = await request.json();

    if (!name || !bossId || !value || !dateAcquired) {
      return NextResponse.json({ error: 'Name, boss, value, and date are required' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // Update loot item
      await tx.lootItem.update({
        where: { id: params.id },
        data: {
          name,
          value,
          dateAcquired: new Date(dateAcquired),
          bossId,
          status: status as LootStatus
        }
      });

      // Delete existing participations
      await tx.lootParticipation.deleteMany({
        where: { lootItemId: params.id }
      });

      // Add new participants
      if (participants && Array.isArray(participants)) {
        for (const participantId of participants) {
          if (participantId) {
            await tx.lootParticipation.create({
              data: {
                memberId: participantId,
                lootItemId: params.id
              }
            });
          }
        }
      }
    });

    // Fetch the updated item with all relations
    const updatedItem = await prisma.lootItem.findUnique({
      where: { id: params.id },
      include: {
        boss: true,
        participations: {
          include: {
            member: true
          }
        },
        salaries: {
          include: {
            member: true
          }
        }
      }
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update loot item' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    requireAdmin(request);
    
    await prisma.lootItem.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to delete loot item' }, { status: 500 });
  }
}