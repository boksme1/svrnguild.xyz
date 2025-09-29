import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  // Handle build-time execution when database isn't available
  if (typeof window === 'undefined' && !process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Service not available during build' }, { status: 503 });
  }

  try {
    requireAdmin(request);

    const members = await prisma.member.findMany({
      include: {
        salaries: {
          include: {
            lootItem: {
              include: {
                boss: true
              }
            }
          }
        },
        attendances: {
          orderBy: { week: 'desc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    const report = members.map(member => {
      const totalEarnings = member.salaries.reduce((sum, salary) => sum + salary.amount, 0);
      const attendanceRate = member.attendances.length > 0 
        ? Math.round((member.attendances.filter(a => a.attended).length / member.attendances.length) * 100)
        : 0;

      return {
        memberName: member.name,
        role: member.role,
        totalEarnings,
        totalLootItems: member.salaries.length,
        attendanceRate,
        joinDate: member.createdAt,
        promotionDate: member.promotionDate,
        demotionDate: member.demotionDate,
        lootBreakdown: member.salaries.map(salary => ({
          itemName: salary.lootItem.name,
          bossName: salary.lootItem.boss.name,
          itemValue: salary.lootItem.value,
          salaryAmount: salary.amount,
          dateAcquired: salary.lootItem.dateAcquired
        })),
        weeklyAttendance: member.attendances.map(attendance => ({
          week: attendance.week,
          attended: attendance.attended
        }))
      };
    });

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      totalMembers: report.length,
      report
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to generate member report' }, { status: 500 });
  }
}