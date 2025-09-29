import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    // Get financial overview
    const financials = await prisma.guildFinancials.findFirst({
      where: { id: 'main' }
    });

    // Get all loot items with salaries
    const lootItems = await prisma.lootItem.findMany({
      include: {
        salaries: {
          include: {
            member: true
          }
        },
        boss: true
      }
    });

    // Calculate totals
    const totalLootValue = lootItems.reduce((sum, item) => sum + item.value, 0);
    const totalDistributed = lootItems.reduce((sum, item) => 
      sum + item.salaries.reduce((salarySum, salary) => salarySum + salary.amount, 0), 0
    );

    // Guild fund calculation (remainder from uneven distributions)
    const guildFund = totalLootValue - totalDistributed;

    // Member earnings breakdown
    const memberEarnings = await prisma.member.findMany({
      include: {
        salaries: {
          include: {
            lootItem: {
              include: {
                boss: true
              }
            }
          }
        }
      }
    });

    const memberBreakdown = memberEarnings.map(member => ({
      memberName: member.name,
      role: member.role,
      totalEarnings: member.salaries.reduce((sum, salary) => sum + salary.amount, 0),
      itemCount: member.salaries.length,
      averagePerItem: member.salaries.length > 0 
        ? member.salaries.reduce((sum, salary) => sum + salary.amount, 0) / member.salaries.length 
        : 0
    })).filter(member => member.totalEarnings > 0)
      .sort((a, b) => b.totalEarnings - a.totalEarnings);

    // Boss performance breakdown
    const bossBreakdown = await prisma.boss.findMany({
      include: {
        lootItems: {
          include: {
            salaries: true
          }
        }
      }
    });

    const bossPerformance = bossBreakdown.map(boss => ({
      bossName: boss.name,
      totalLootValue: boss.lootItems.reduce((sum, item) => sum + item.value, 0),
      totalDistributed: boss.lootItems.reduce((sum, item) => 
        sum + item.salaries.reduce((salarySum, salary) => salarySum + salary.amount, 0), 0
      ),
      itemCount: boss.lootItems.length,
      averageItemValue: boss.lootItems.length > 0 
        ? boss.lootItems.reduce((sum, item) => sum + item.value, 0) / boss.lootItems.length 
        : 0
    })).filter(boss => boss.itemCount > 0)
      .sort((a, b) => b.totalLootValue - a.totalLootValue);

    // Distribution integrity check
    const integrityCheck = {
      totalLootValue,
      totalDistributed,
      guildFund,
      adminFee: financials?.adminFee || 0,
      calculatedTotal: totalDistributed + guildFund + (financials?.adminFee || 0),
      isValid: Math.abs(totalLootValue - (totalDistributed + guildFund + (financials?.adminFee || 0))) < 0.01
    };

    // Status breakdown
    const statusBreakdown = await prisma.lootItem.groupBy({
      by: ['status'],
      _sum: { value: true },
      _count: { id: true }
    });

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      summary: {
        totalLootValue,
        totalDistributed,
        guildFund,
        adminFee: financials?.adminFee || 0,
        totalMembers: memberBreakdown.length,
        totalBosses: bossPerformance.length,
        totalItems: lootItems.length
      },
      integrityCheck,
      memberBreakdown,
      bossPerformance,
      statusBreakdown: statusBreakdown.map(status => ({
        status: status.status,
        itemCount: status._count.id,
        totalValue: status._sum.value || 0
      }))
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to generate financial report' }, { status: 500 });
  }
}