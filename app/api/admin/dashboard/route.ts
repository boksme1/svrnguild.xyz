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

    // Get loot summary by status
    const lootSummary = await prisma.lootItem.groupBy({
      by: ['status'],
      _sum: {
        value: true
      },
      _count: {
        id: true
      }
    });

    // Get top earners
    const topEarners = await prisma.member.findMany({
      include: {
        salaries: {
          include: {
            lootItem: true
          }
        }
      },
      take: 10
    });

    const topEarnersWithTotals = topEarners
      .map(member => ({
        id: member.id,
        name: member.name,
        role: member.role,
        totalEarnings: member.salaries.reduce((sum, salary) => sum + salary.amount, 0),
        lootCount: member.salaries.length
      }))
      .filter(member => member.totalEarnings > 0)
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, 10);

    // Get recent settlements
    const recentSettlements = await prisma.settlement.findMany({
      orderBy: { settledAt: 'desc' },
      take: 5,
      include: {
        salaries: {
          include: {
            member: true,
            lootItem: true
          }
        }
      }
    });

    // Calculate distribution integrity
    const totalLootValue = lootSummary.reduce((sum, item) => sum + (item._sum.value || 0), 0);
    const totalDistributed = await prisma.salary.aggregate({
      _sum: {
        amount: true
      }
    });

    const integrityCheck = {
      totalLootValue,
      totalDistributed: totalDistributed._sum.amount || 0,
      guildFund: financials?.guildFund || 0,
      adminFee: financials?.adminFee || 0,
      isValid: Math.abs(totalLootValue - ((totalDistributed._sum.amount || 0) + (financials?.guildFund || 0) + (financials?.adminFee || 0))) < 0.01
    };

    return NextResponse.json({
      financials: financials || {
        totalLootValue: 0,
        totalDistributed: 0,
        guildFund: 0,
        adminFee: 0
      },
      lootSummary,
      topEarners: topEarnersWithTotals,
      recentSettlements,
      integrityCheck
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}