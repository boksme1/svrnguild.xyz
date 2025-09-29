import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { LootStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { name, bossId, value, dateAcquired, status, participants } = await request.json();

    if (!name || !bossId || !value || !dateAcquired) {
      return NextResponse.json({ error: 'Name, boss, value, and date are required' }, { status: 400 });
    }

    // Create loot item
    const lootItem = await prisma.lootItem.create({
      data: {
        name,
        value,
        dateAcquired: new Date(dateAcquired),
        bossId,
        status: status as LootStatus || LootStatus.PENDING
      }
    });

    // Handle participants
    if (participants && Array.isArray(participants)) {
      for (const participantId of participants) {
        if (participantId) {
          await prisma.lootParticipation.create({
            data: {
              memberId: participantId,
              lootItemId: lootItem.id
            }
          });
        }
      }
    }

    // Fetch the created item with all relations
    const createdItem = await prisma.lootItem.findUnique({
      where: { id: lootItem.id },
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

    return NextResponse.json(createdItem);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create loot item' }, { status: 500 });
  }
}