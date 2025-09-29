import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Return minimal data during build
    return NextResponse.json({
      financials: {
        totalLootValue: 0,
        totalDistributed: 0,
        guildFund: 0,
        adminFee: 0
      },
      lootSummary: [],
      topEarners: [],
      recentSettlements: [],
      integrityCheck: {
        totalLootValue: 0,
        totalDistributed: 0,
        guildFund: 0,
        adminFee: 0,
        isValid: true
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
