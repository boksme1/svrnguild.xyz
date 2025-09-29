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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Users, Calendar, TrendingUp, History } from 'lucide-react';
import { toast } from 'sonner';
import { RoleHistoryManager } from '@/components/role-history-manager';

interface Member {
  id: string;
  name: string;
  role: 'GUILD_MASTER' | 'CORE' | 'MEMBER';
  promotionDate: string | null;
  demotionDate: string | null;
  createdAt: string;
  attendances: Array<{
    id: string;
    week: string;
    attended: boolean;
  }>;
  salaries: Array<{
    id: string;
    amount: number;
    lootItem: {
      id: string;
      name: string;
      value: number;
    };
  }>;
}

export default function GuildMembers() {
  const { admin, token } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [roleHistoryMember, setRoleHistoryMember] = useState<Member | null>(null);
  const [isRoleHistoryDialogOpen, setIsRoleHistoryDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: 'MEMBER' as 'GUILD_MASTER' | 'CORE' | 'MEMBER',
    promotionDate: '',
    demotionDate: ''
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members');
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      toast.error('Failed to fetch members');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!admin) {
      toast.error('Admin access required');
      return;
    }

    try {
      const url = editingMember ? `/api/members/${editingMember.id}` : '/api/members';
      const method = editingMember ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          promotionDate: formData.promotionDate || null,
          demotionDate: formData.demotionDate || null
        })
      });

      if (response.ok) {
        toast.success(editingMember ? 'Member updated' : 'Member created');
        fetchMembers();
        resetForm();
      } else {
        toast.error('Failed to save member');
      }
    } catch (error) {
      toast.error('Failed to save member');
    }
  };

  const handleDelete = async (id: string) => {
    if (!admin || !confirm('Are you sure you want to delete this member?')) {
      return;
    }

    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Member deleted');
        fetchMembers();
      } else {
        toast.error('Failed to delete member');
      }
    } catch (error) {
      toast.error('Failed to delete member');
    }
  };

  const handleSyncAttendance = async () => {
    if (!admin) {
      toast.error('Admin access required');
      return;
    }

    try {
      const response = await fetch('/api/members/attendance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Synced attendance for ${result.attendanceRecorded} members`);
        fetchMembers();
      } else {
        toast.error('Failed to sync attendance');
      }
    } catch (error) {
      toast.error('Failed to sync attendance');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', role: 'MEMBER', promotionDate: '', demotionDate: '' });
    setEditingMember(null);
    setIsAddDialogOpen(false);
  };

  const startEdit = (member: Member) => {
    setFormData({
      name: member.name,
      role: member.role,
      promotionDate: member.promotionDate ? member.promotionDate.split('T')[0] : '',
      demotionDate: member.demotionDate ? member.demotionDate.split('T')[0] : ''
    });
    setEditingMember(member);
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

  const getTotalEarnings = (member: Member) => {
    return member.salaries.reduce((total, salary) => total + salary.amount, 0);
  };

  const getAttendanceRate = (member: Member) => {
    if (member.attendances.length === 0) return 0;
    const attended = member.attendances.filter(a => a.attended).length;
    return Math.round((attended / member.attendances.length) * 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };

  const sortMembersByRole = (members: Member[]) => {
    const roleOrder = { 'GUILD_MASTER': 1, 'CORE': 2, 'MEMBER': 3 };
    return [...members].sort((a, b) => {
      const aOrder = roleOrder[a.role] || 4;
      const bOrder = roleOrder[b.role] || 4;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      // If roles are the same, sort by name alphabetically
      return a.name.localeCompare(b.name);
    });
  };

  const sortedMembers = sortMembersByRole(members);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Guild Members</h1>
            <p className="text-gray-600 mt-2">Manage member roster, roles, and track attendance</p>
          </div>
          
          {admin && (
            <div className="flex space-x-3">
              <Button onClick={handleSyncAttendance} variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Sync Attendance
              </Button>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingMember ? 'Edit Member' : 'Add New Member'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Member Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    
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
                      <Label htmlFor="promotionDate">Promotion Date (optional)</Label>
                      <Input
                        id="promotionDate"
                        type="date"
                        value={formData.promotionDate}
                        onChange={(e) => setFormData({ ...formData, promotionDate: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="demotionDate">Demotion Date (optional)</Label>
                      <Input
                        id="demotionDate"
                        type="date"
                        value={formData.demotionDate}
                        onChange={(e) => setFormData({ ...formData, demotionDate: e.target.value })}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingMember ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Loot Earnings</TableHead>
                  <TableHead>Attendance</TableHead>
                  {admin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(getTotalEarnings(member))}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{getAttendanceRate(member)}%</span>
                        <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${getAttendanceRate(member)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    {admin && (
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRoleHistoryMember(member);
                              setIsRoleHistoryDialogOpen(true);
                            }}
                            title="Manage Role History"
                          >
                            <History className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(member)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(member.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {members.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
            <p className="text-gray-500">
              {admin ? 'Add your first guild member to get started.' : 'No guild members are currently registered.'}
            </p>
          </div>
        )}

        {/* Role History Dialog */}
        <Dialog open={isRoleHistoryDialogOpen} onOpenChange={setIsRoleHistoryDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Role Timeline Management</DialogTitle>
            </DialogHeader>
            {roleHistoryMember && token && (
              <RoleHistoryManager
                memberId={roleHistoryMember.id}
                memberName={roleHistoryMember.name}
                token={token}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}