import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const lootItems = await prisma.lootItem.findMany({
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

    const report = lootItems.map(item => {
      const participants = item.participations.map(p => p.member.name);
      const salaryBreakdown = item.salaries.map(salary => ({
        memberName: salary.member.name,
        memberRole: salary.member.role,
        salaryAmount: salary.amount
      }));

      const totalSalariesPaid = item.salaries.reduce((sum, salary) => sum + salary.amount, 0);

      return {
        itemName: item.name,
        bossName: item.boss.name,
        itemValue: item.value,
        dateAcquired: item.dateAcquired,
        status: item.status,
        participants,
        participantCount: participants.length,
        salaryBreakdown,
        totalSalariesPaid,
        remainderToGuildFund: item.value - totalSalariesPaid
      };
    });

    // Summary statistics
    const summary = {
      totalItems: report.length,
      totalValue: report.reduce((sum, item) => sum + item.itemValue, 0),
      totalDistributed: report.reduce((sum, item) => sum + item.totalSalariesPaid, 0),
      totalToGuildFund: report.reduce((sum, item) => sum + item.remainderToGuildFund, 0),
      itemsByStatus: {
        pending: report.filter(item => item.status === 'PENDING').length,
        sold: report.filter(item => item.status === 'SOLD').length,
        settled: report.filter(item => item.status === 'SETTLED').length
      },
      valueByStatus: {
        pending: report.filter(item => item.status === 'PENDING').reduce((sum, item) => sum + item.itemValue, 0),
        sold: report.filter(item => item.status === 'SOLD').reduce((sum, item) => sum + item.itemValue, 0),
        settled: report.filter(item => item.status === 'SETTLED').reduce((sum, item) => sum + item.itemValue, 0)
      }
    };

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      summary,
      report
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to generate market exchange report' }, { status: 500 });
  }
}