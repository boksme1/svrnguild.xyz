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
import { Textarea } from '@/components/ui/textarea';
import { Upload, Search, Calculator, FileText, Coins, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface LootItem {
  id: string;
  name: string;
  value: number;
  dateAcquired: string;
  status: 'PENDING' | 'SOLD' | 'SETTLED';
  boss: {
    id: string;
    name: string;
  };
  participations: Array<{
    id: string;
    member: {
      id: string;
      name: string;
    };
  }>;
  salaries: Array<{
    id: string;
    amount: number;
    member: {
      id: string;
      name: string;
    };
  }>;
}

export default function MarketExchange() {
  const { admin, token } = useAuth();
  const [lootItems, setLootItems] = useState<LootItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LootItem | null>(null);
  const [bosses, setBosses] = useState<Array<{ id: string; name: string }>>([]);
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [formData, setFormData] = useState({
    name: '',
    bossId: '',
    value: '',
    dateAcquired: '',
    status: 'PENDING' as 'PENDING' | 'SOLD' | 'SETTLED',
    participants: [] as string[]
  });

  useEffect(() => {
    fetchLootItems();
    fetchBossesAndMembers();
  }, [searchTerm]);

  const fetchLootItems = async () => {
    try {
      const url = searchTerm 
        ? `/api/loot?search=${encodeURIComponent(searchTerm)}`
        : '/api/loot';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLootItems(data);
      }
    } catch (error) {
      toast.error('Failed to fetch loot items');
    }
  };

  const fetchBossesAndMembers = async () => {
    try {
      const [bossesResponse, membersResponse] = await Promise.all([
        fetch('/api/bosses'),
        fetch('/api/members')
      ]);
      
      if (bossesResponse.ok) {
        const bossesData = await bossesResponse.json();
        setBosses(bossesData);
      }
      
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setMembers(membersData);
      }
    } catch (error) {
      toast.error('Failed to fetch reference data');
    }
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!admin) {
      toast.error('Admin access required');
      return;
    }

    if (!csvData.trim()) {
      toast.error('Please enter CSV data');
      return;
    }

    setIsLoading(true);
    
    try {
      // Parse CSV data
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const parsedData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        
        headers.forEach((header, index) => {
          const key = header.toLowerCase().replace(/\s+/g, '');
          if (key.includes('item') && key.includes('name')) {
            row.itemName = values[index];
          } else if (key.includes('boss') && key.includes('name')) {
            row.bossName = values[index];
          } else if (key.includes('value') || key.includes('price')) {
            row.itemValue = values[index];
          } else if (key.includes('date')) {
            row.dateAcquired = values[index];
          } else if (key.includes('participant')) {
            row.participants = values[index] ? values[index].split(';').map(p => p.trim()) : [];
          }
        });
        
        return row;
      });

      const response = await fetch('/api/loot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ csvData: parsedData })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Created ${result.created} loot items`);
        if (result.errors.length > 0) {
          console.warn('CSV Upload errors:', result.errors);
        }
        fetchLootItems();
        setCsvData('');
        setIsUploadDialogOpen(false);
      } else {
        toast.error('Failed to upload CSV');
      }
    } catch (error) {
      toast.error('Failed to process CSV data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (lootId: string, status: string) => {
    if (!admin) {
      toast.error('Admin access required');
      return;
    }

    try {
      const response = await fetch(`/api/loot/${lootId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast.success('Status updated');
        fetchLootItems();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleRecalculate = async () => {
    if (!admin) {
      toast.error('Admin access required');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/loot/recalculate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Recalculated ${result.itemsProcessed} items, created ${result.salariesCreated} salaries`);
        fetchLootItems();
      } else {
        toast.error('Failed to recalculate');
      }
    } catch (error) {
      toast.error('Failed to recalculate');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!admin) {
      toast.error('Admin access required');
      return;
    }

    try {
      const url = editingItem ? `/api/loot/${editingItem.id}` : '/api/loot/single';
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          bossId: formData.bossId,
          value: parseFloat(formData.value),
          dateAcquired: formData.dateAcquired,
          status: formData.status,
          participants: formData.participants
        })
      });

      if (response.ok) {
        toast.success(editingItem ? 'Loot item updated' : 'Loot item created');
        fetchLootItems();
        resetForm();
      } else {
        toast.error('Failed to save loot item');
      }
    } catch (error) {
      toast.error('Failed to save loot item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!admin || !confirm('Are you sure you want to delete this loot item?')) {
      return;
    }

    try {
      const response = await fetch(`/api/loot/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Loot item deleted');
        fetchLootItems();
      } else {
        toast.error('Failed to delete loot item');
      }
    } catch (error) {
      toast.error('Failed to delete loot item');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', bossId: '', value: '', dateAcquired: '', status: 'PENDING', participants: [] });
    setEditingItem(null);
    setIsAddDialogOpen(false);
  };

  const startEdit = (item: LootItem) => {
    setFormData({
      name: item.name,
      bossId: item.boss.id,
      value: item.value.toString(),
      dateAcquired: item.dateAcquired.split('T')[0],
      status: item.status,
      participants: item.participations.map(p => p.member.id)
    });
    setEditingItem(item);
    setIsAddDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PENDING': return 'secondary';
      case 'SOLD': return 'default';
      case 'SETTLED': return 'outline';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Market Exchange</h1>
            <p className="text-gray-600 mt-2">Track loot items, sales status, and salary distributions</p>
          </div>
          
          {admin && (
            <div className="flex space-x-3">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingItem ? 'Edit Loot Item' : 'Add New Loot Item'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Item Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="boss">Boss</Label>
                      <Select
                        value={formData.bossId}
                        onValueChange={(value) => setFormData({ ...formData, bossId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select boss" />
                        </SelectTrigger>
                        <SelectContent>
                          {bosses.map((boss) => (
                            <SelectItem key={boss.id} value={boss.id}>{boss.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="value">Item Value</Label>
                      <Input
                        id="value"
                        type="number"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="dateAcquired">Date Acquired</Label>
                      <Input
                        id="dateAcquired"
                        type="date"
                        value={formData.dateAcquired}
                        onChange={(e) => setFormData({ ...formData, dateAcquired: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'PENDING' | 'SOLD' | 'SETTLED') => 
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="SOLD">Sold</SelectItem>
                          <SelectItem value="SETTLED">Settled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="participants">Participants</Label>
                      <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                        {members.map((member) => (
                          <div key={member.id} className="flex items-center space-x-2 py-1">
                            <input
                              type="checkbox"
                              id={`participant-${member.id}`}
                              checked={formData.participants.includes(member.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ 
                                    ...formData, 
                                    participants: [...formData.participants, member.id] 
                                  });
                                } else {
                                  setFormData({ 
                                    ...formData, 
                                    participants: formData.participants.filter(id => id !== member.id) 
                                  });
                                }
                              }}
                            />
                            <label htmlFor={`participant-${member.id}`} className="text-sm">
                              {member.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingItem ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Upload Loot CSV</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCsvUpload} className="space-y-4">
                    <div>
                      <Label htmlFor="csvData">CSV Data</Label>
                      <Textarea
                        id="csvData"
                        value={csvData}
                        onChange={(e) => setCsvData(e.target.value)}
                        placeholder="Item Name, Boss Name, Item Value, Date Acquired, Participants&#10;Example:&#10;Sword of Power, Dragon King, 1000, 12/25/2023, Player1;Player2;Player3"
                        rows={10}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Format: Item Name, Boss Name, Item Value, Date Acquired (MM/DD/YYYY), Participants (semicolon separated)
                      </p>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Processing...' : 'Upload'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              
              <Button
                onClick={handleRecalculate}
                disabled={isLoading}
                variant="outline"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Recalculate All Sold
              </Button>
            </div>
          )}
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by item name, boss name, or player name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Boss Name</TableHead>
                  <TableHead>Item Value</TableHead>
                  <TableHead>Date Acquired</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Participants</TableHead>
                  {admin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lootItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.boss.name}</TableCell>
                    <TableCell>{formatCurrency(item.value)}</TableCell>
                    <TableCell>{formatDate(item.dateAcquired)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(item.status)}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.participations.map((p) => (
                          <Badge key={p.id} variant="outline" className="text-xs">
                            {p.member.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    {admin && (
                      <TableCell>
                        <div className="flex space-x-2">
                          <Select
                            value={item.status}
                            onValueChange={(status) => handleStatusUpdate(item.id, status)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="SOLD">Sold</SelectItem>
                              <SelectItem value="SETTLED">Settled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(item)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(item.id)}
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

        {lootItems.length === 0 && (
          <div className="text-center py-12">
            <Coins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No loot items found</h3>
            <p className="text-gray-500">
              {admin ? 'Upload your first CSV to start tracking loot.' : 'No loot items are currently available.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}