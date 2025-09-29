"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface RolePeriod {
  id: string;
  role: 'GUILD_MASTER' | 'CORE' | 'MEMBER';
  startDate: string;
  endDate: string | null;
  reason?: string;
}

interface RoleHistoryManagerProps {
  memberId: string;
  memberName: string;
  token: string;
}

export function RoleHistoryManager({ memberId, memberName, token }: RoleHistoryManagerProps) {
  const [roleHistory, setRoleHistory] = useState<RolePeriod[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<RolePeriod | null>(null);
  const [formData, setFormData] = useState({
    role: 'MEMBER' as 'GUILD_MASTER' | 'CORE' | 'MEMBER',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    fetchRoleHistory();
  }, [memberId]);

  const fetchRoleHistory = async () => {
    try {
      const response = await fetch(`/api/members/${memberId}/role-history`);
      if (response.ok) {
        const data = await response.json();
        setRoleHistory(data);
      }
    } catch (error) {
      toast.error('Failed to fetch role history');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let response;
      
      if (editingPeriod) {
        // Update existing period
        response = await fetch(`/api/members/role-history/${editingPeriod.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            endDate: formData.endDate || null
          })
        });
      } else {
        // Add new period
        response = await fetch(`/api/members/${memberId}/role-history`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            endDate: formData.endDate || null
          })
        });
      }

      if (response.ok) {
        toast.success(editingPeriod ? 'Role period updated' : 'Role period added');
        fetchRoleHistory();
        resetForm();
      } else {
        toast.error('Failed to save role period');
      }
    } catch (error) {
      toast.error('Failed to save role period');
    }
  };

  const handleDelete = async (periodId: string) => {
    if (!confirm('Are you sure you want to delete this role period?')) {
      return;
    }

    try {
      const response = await fetch(`/api/members/role-history/${periodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Role period deleted');
        fetchRoleHistory();
      } else {
        toast.error('Failed to delete role period');
      }
    } catch (error) {
      toast.error('Failed to delete role period');
    }
  };

  const resetForm = () => {
    setFormData({ role: 'MEMBER', startDate: '', endDate: '', reason: '' });
    setEditingPeriod(null);
    setIsAddDialogOpen(false);
  };

  const startEdit = (period: RolePeriod) => {
    setFormData({
      role: period.role,
      startDate: new Date(period.startDate).toISOString().split('T')[0],
      endDate: period.endDate ? new Date(period.endDate).toISOString().split('T')[0] : '',
      reason: period.reason || ''
    });
    setEditingPeriod(period);
    setIsAddDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'GUILD_MASTER': return 'default';
      case 'CORE': return 'secondary';
      case 'MEMBER': return 'outline';
      default: return 'outline';
    }
  };

  const formatDateRange = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate).toLocaleDateString();
    if (!endDate) {
      return `${start} → ongoing`;
    }
    const end = new Date(endDate).toLocaleDateString();
    return `${start} → ${end}`;
  };

  const getCurrentRole = () => {
    const activePeriod = roleHistory.find(period => !period.endDate);
    return activePeriod?.role || 'MEMBER';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Role History - {memberName}</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={getRoleBadgeVariant(getCurrentRole())}>
              Current: {getCurrentRole().replace('_', ' ')}
            </Badge>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Period
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingPeriod ? 'Edit Role Period' : 'Add Role Period'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: 'GUILD_MASTER' | 'CORE' | 'MEMBER') => 
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GUILD_MASTER">Guild Master</SelectItem>
                        <SelectItem value="CORE">Core</SelectItem>
                        <SelectItem value="MEMBER">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate">End Date (optional - leave empty for ongoing)</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="reason">Reason (optional)</Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Promotion, demotion, temporary suspension, etc."
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingPeriod ? 'Update' : 'Add'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roleHistory.map((period) => (
              <TableRow key={period.id}>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(period.role)}>
                    {period.role.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>{formatDateRange(period.startDate, period.endDate)}</TableCell>
                <TableCell>{period.reason || '-'}</TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(period)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(period.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {roleHistory.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No role history found. Add the first role period to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
}