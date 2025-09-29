import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { LootStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { boss: { name: { contains: search, mode: 'insensitive' } } },
        { participations: { some: { member: { name: { contains: search, mode: 'insensitive' } } } } }
      ];
    }

    const lootItems = await prisma.lootItem.findMany({
      where,
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
      },
      orderBy: { dateAcquired: 'desc' }
    });

    return NextResponse.json(lootItems);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch loot items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { csvData } = await request.json();
    
    if (!csvData || !Array.isArray(csvData)) {
      return NextResponse.json({ error: 'Invalid CSV data' }, { status: 400 });
    }

    const createdItems: any[] = [];
    const errors: string[] = [];

    for (const row of csvData) {
      try {
        const { itemName, bossName, itemValue, dateAcquired, participants } = row;
        
        if (!itemName || !bossName || !itemValue || !dateAcquired) {
          errors.push(`Missing required fields in row: ${JSON.stringify(row)}`);
          continue;
        }

        // Find or create boss
        let boss = await prisma.boss.findUnique({ where: { name: bossName } });
        if (!boss) {
          boss = await prisma.boss.create({
            data: {
              name: bossName,
              type: 'NORMAL',
              respawnTime: 60
            }
          });
        }

        // Parse date (MM/DD/YYYY format)
        const [month, day, year] = dateAcquired.split('/');
        const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        // Create loot item
        const lootItem = await prisma.lootItem.create({
          data: {
            name: itemName,
            value: parseFloat(itemValue),
            dateAcquired: parsedDate,
            bossId: boss.id,
            status: LootStatus.PENDING
          }
        });

        // Handle participants
        if (participants && Array.isArray(participants)) {
          for (const participantName of participants) {
            if (participantName.trim()) {
              // Find or create member
              let member = await prisma.member.findUnique({ where: { name: participantName.trim() } });
              if (!member) {
                member = await prisma.member.create({
                  data: {
                    name: participantName.trim(),
                    role: 'MEMBER'
                  }
                });
              }

              // Create participation
              await prisma.lootParticipation.create({
                data: {
                  memberId: member.id,
                  lootItemId: lootItem.id
                }
              });
            }
          }
        }

        createdItems.push(lootItem);
      } catch (error) {
        errors.push(`Error processing row ${JSON.stringify(row)}: ${String(error)}`);
      }
    }

    return NextResponse.json({
      success: true,
      created: createdItems.length,
      errors
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to process CSV' }, { status: 500 });
  }
}