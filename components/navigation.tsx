"use client";

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Shield, Timer, Coins, Users, LayoutDashboard, LogOut } from 'lucide-react';

export function Navigation() {
  const { admin, logout } = useAuth();

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-xl">Guild Manager</span>
            </Link>
            
            <div className="hidden md:flex space-x-6">
              <Link 
                href="/boss-timer" 
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                <Timer className="h-4 w-4" />
                <span>Boss Timer</span>
              </Link>
              
              <Link 
                href="/market-exchange" 
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                <Coins className="h-4 w-4" />
                <span>Market Exchange</span>
              </Link>
              
              <Link 
                href="/guild-members" 
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                <Users className="h-4 w-4" />
                <span>Guild Members</span>
              </Link>
              
              {admin && (
                <Link 
                  href="/admin" 
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Admin Dashboard</span>
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {admin ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">Welcome, {admin.username}</span>
                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Admin Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}