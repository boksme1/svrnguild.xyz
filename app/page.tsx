import Link from 'next/link';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Timer, Coins, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Timer className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Boss Timer</CardTitle>
              <CardDescription>
                Track respawn times for normal and fixed bosses with countdown timers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/boss-timer">
                <Button className="w-full">View Timers</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Coins className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Market Exchange</CardTitle>
              <CardDescription>
                Manage loot items, track sales status, and view salary distributions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/market-exchange">
                <Button className="w-full">View Market</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Guild Members</CardTitle>
              <CardDescription>
                View member roster, track attendance, and monitor member earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/guild-members">
                <Button className="w-full">View Members</Button>
              </Link>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
