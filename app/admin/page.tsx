"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2, Users, Coins } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardData {
  financials: {
    totalLootValue: number;
    totalDistributed: number;
    guildFund: number;
    adminFee: number;
  };
  lootSummary: Array<{
    status: string;
    _sum: { value: number };
    _count: { id: number };
  }>;
  topEarners: Array<{
    id: string;
    name: string;
    role: string;
    totalEarnings: number;
    lootCount: number;
  }>;
  recentSettlements: Array<{
    id: string;
    totalLootValue: number;
    totalDistributed: number;
    guildFund: number;
    adminFee: number;
    settledAt: string;
  }>;
  integrityCheck: {
    totalLootValue: number;
    totalDistributed: number;
    guildFund: number;
    adminFee: number;
    isValid: boolean;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const { admin, token } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!admin) {
      router.push('/login');
      return;
    }
    
    fetchDashboardData();
  }, [admin, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        toast.error('Failed to fetch dashboard data');
      }
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PENDING': return 'secondary';
      case 'SOLD': return 'default';
      case 'SETTLED': return 'outline';
      default: return 'secondary';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'GUILD_MASTER': return 'default';
      case 'CORE': return 'secondary';
      case 'MEMBER': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Failed to load dashboard data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Financial overview and guild management</p>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Loot Value</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dashboardData.financials.totalLootValue)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Distributed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dashboardData.financials.totalDistributed)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Guild Fund</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dashboardData.financials.guildFund)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Fee</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dashboardData.financials.adminFee)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Distribution Integrity Check */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {dashboardData.integrityCheck.isValid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span>Distribution Integrity Check</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Loot Value</p>
                <p className="font-semibold">{formatCurrency(dashboardData.integrityCheck.totalLootValue)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Distributed</p>
                <p className="font-semibold">{formatCurrency(dashboardData.integrityCheck.totalDistributed)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Guild Fund</p>
                <p className="font-semibold">{formatCurrency(dashboardData.integrityCheck.guildFund)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge variant={dashboardData.integrityCheck.isValid ? 'default' : 'destructive'}>
                  {dashboardData.integrityCheck.isValid ? 'Valid' : 'Invalid'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loot Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Loot Summary by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.lootSummary.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusBadgeVariant(item.status)}>
                      {item.status}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {item._count.id} items
                    </span>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(item._sum.value || 0)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>


      </main>
    </div>
  );
}