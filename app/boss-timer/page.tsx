"use client";

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Clock, Skull } from 'lucide-react';
import { toast } from 'sonner';

interface Boss {
  id: string;
  name: string;
  type: 'NORMAL' | 'FIXED';
  respawnTime: number;
  lastKilled: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function BossTimer() {
  const { admin, token } = useAuth();
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBoss, setEditingBoss] = useState<Boss | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'NORMAL' as 'NORMAL' | 'FIXED',
    respawnTime: ''
  });

  useEffect(() => {
    fetchBosses();
  }, []);

  const fetchBosses = async () => {
    try {
      const response = await fetch('/api/bosses');
      if (response.ok) {
        const data = await response.json();
        setBosses(data);
      }
    } catch (error) {
      toast.error('Failed to fetch bosses');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!admin) {
      toast.error('Admin access required');
      return;
    }

    try {
      const url = editingBoss ? `/api/bosses/${editingBoss.id}` : '/api/bosses';
      const method = editingBoss ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingBoss ? 'Boss updated' : 'Boss created');
        fetchBosses();
        resetForm();
      } else {
        toast.error('Failed to save boss');
      }
    } catch (error) {
      toast.error('Failed to save boss');
    }
  };

  const handleDelete = async (id: string) => {
    if (!admin || !confirm('Are you sure you want to delete this boss?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bosses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Boss deleted');
        fetchBosses();
      } else {
        toast.error('Failed to delete boss');
      }
    } catch (error) {
      toast.error('Failed to delete boss');
    }
  };

  const handleMarkKilled = async (boss: Boss) => {
    if (!admin) {
      toast.error('Admin access required');
      return;
    }

    try {
      const response = await fetch(`/api/bosses/${boss.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lastKilled: new Date().toISOString()
        })
      });

      if (response.ok) {
        toast.success('Boss marked as killed');
        fetchBosses();
      } else {
        toast.error('Failed to update boss');
      }
    } catch (error) {
      toast.error('Failed to update boss');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'NORMAL', respawnTime: '' });
    setEditingBoss(null);
    setIsAddDialogOpen(false);
  };

  const startEdit = (boss: Boss) => {
    setFormData({
      name: boss.name,
      type: boss.type,
      respawnTime: boss.respawnTime.toString()
    });
    setEditingBoss(boss);
    setIsAddDialogOpen(true);
  };

  const getNextSpawnTime = (boss: Boss) => {
    if (!boss.lastKilled) return 'Unknown';
    
    const lastKilled = new Date(boss.lastKilled);
    const nextSpawn = new Date(lastKilled.getTime() + boss.respawnTime * 60 * 1000);
    const now = new Date();
    
    if (nextSpawn <= now) {
      return 'Available Now';
    }
    
    const diff = nextSpawn.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Boss Timer</h1>
            <p className="text-gray-600 mt-2">Track boss respawn times and availability</p>
          </div>
          
          {admin && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Boss
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBoss ? 'Edit Boss' : 'Add New Boss'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Boss Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="type">Boss Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: 'NORMAL' | 'FIXED') => 
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="FIXED">Fixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="respawnTime">Respawn Time (minutes)</Label>
                    <Input
                      id="respawnTime"
                      type="number"
                      value={formData.respawnTime}
                      onChange={(e) => setFormData({ ...formData, respawnTime: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingBoss ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bosses.map((boss) => (
            <Card key={boss.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{boss.name}</CardTitle>
                    <Badge variant={boss.type === 'FIXED' ? 'default' : 'secondary'}>
                      {boss.type}
                    </Badge>
                  </div>
                  
                  {admin && (
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(boss)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(boss.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Respawn: {boss.respawnTime} minutes
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Next Spawn:</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {getNextSpawnTime(boss)}
                    </span>
                  </div>
                  
                  {boss.lastKilled && (
                    <div className="text-xs text-gray-500">
                      Last killed: {formatDateTime(boss.lastKilled)}
                    </div>
                  )}
                  
                  {admin && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkKilled(boss)}
                      className="w-full"
                    >
                      <Skull className="h-3 w-3 mr-1" />
                      Mark as Killed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {bosses.length === 0 && (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bosses configured</h3>
            <p className="text-gray-500">
              {admin ? 'Add your first boss to start tracking timers.' : 'No boss timers are currently available.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}