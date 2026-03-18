import React, { useState, useEffect } from 'react';
import { adminV2 } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Star, TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface VIPTier {
  id?: number;
  name: string;
  minDeposits: number;
  benefits: string[];
  members?: number;
  monthlyRevenue?: number;
}

export const VIPManagement = () => {
  const [vipTiers, setVipTiers] = useState<VIPTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTier, setNewTier] = useState<VIPTier>({
    name: '',
    minDeposits: 0,
    benefits: []
  });

  useEffect(() => {
    fetchVIPTiers();
  }, []);

  const fetchVIPTiers = async () => {
    try {
      setIsLoading(true);
      const response = await adminV2.vip.tiers.list();
      const data = Array.isArray(response) ? response : (response?.data || []);
      setVipTiers(data);
    } catch (error: any) {
      console.error('Failed to fetch VIP tiers:', error);
      toast.error('Failed to load VIP tiers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTier = async () => {
    if (!newTier.name || newTier.minDeposits === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      await adminV2.vip.tiers.create(newTier);
      toast.success('VIP tier created successfully');
      setShowCreateDialog(false);
      setNewTier({ name: '', minDeposits: 0, benefits: [] });
      fetchVIPTiers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create VIP tier');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalMembers = vipTiers.reduce((sum, tier) => sum + (tier.members || 0), 0);
  const totalRevenue = vipTiers.reduce((sum, tier) => {
    const monthlyRev = typeof tier.monthlyRevenue === 'string'
      ? parseFloat(tier.monthlyRevenue.replace(/[^0-9.-]+/g,''))
      : (tier.monthlyRevenue || 0);
    return sum + monthlyRev;
  }, 0);

  return (
    <div className="space-y-6">
      {/* VIP Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Total VIP Members</p>
            <p className="text-3xl font-black">{totalMembers}</p>
            <p className="text-xs text-green-500 mt-2">Active members</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">VIP Revenue</p>
            <p className="text-3xl font-black">${totalRevenue.toFixed(0)}</p>
            <p className="text-xs text-green-500 mt-2">Monthly</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Tier Count</p>
            <p className="text-3xl font-black">{vipTiers.length}</p>
            <p className="text-xs text-muted-foreground mt-2">Configured tiers</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Avg Value</p>
            <p className="text-3xl font-black">${totalMembers > 0 ? (totalRevenue / totalMembers).toFixed(0) : 0}</p>
            <p className="text-xs text-muted-foreground mt-2">Per member</p>
          </CardContent>
        </Card>
      </div>

      {/* VIP Tiers */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>VIP Tier Management</CardTitle>
              <CardDescription>Configure tiers and member benefits</CardDescription>
            </div>
            <Button className="font-bold" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Tier
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vipTiers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No VIP tiers configured yet</p>
            ) : (
              vipTiers.map((tier) => (
                <div key={tier.id} className="p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <div>
                        <h4 className="font-bold text-lg">{tier.name}</h4>
                        <p className="text-sm text-muted-foreground">Min: ${tier.minDeposits}</p>
                      </div>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-none">{tier.members || 0} Members</Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">Members</p>
                      <p className="text-lg font-black">{tier.members || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">Monthly Rev</p>
                      <p className="text-lg font-black">${typeof tier.monthlyRevenue === 'number' ? tier.monthlyRevenue.toFixed(0) : 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">Benefits</p>
                      <p className="text-lg font-black">{tier.benefits?.length || 0}</p>
                    </div>
                  </div>

                  {tier.benefits && tier.benefits.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-bold mb-2">Benefits:</p>
                      <div className="flex flex-wrap gap-2">
                        {tier.benefits.map((benefit) => (
                          <Badge key={benefit} className="bg-muted/50 border-none text-xs">{benefit}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-8">
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="h-8">View Members</Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Tier Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create VIP Tier</DialogTitle>
            <DialogDescription>Add a new VIP tier with benefits</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tier Name</Label>
              <Input
                placeholder="e.g., Platinum VIP"
                value={newTier.name}
                onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Minimum Deposits ($)</Label>
              <Input
                type="number"
                placeholder="e.g., 10000"
                value={newTier.minDeposits}
                onChange={(e) => setNewTier({ ...newTier, minDeposits: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Benefits (comma-separated)</Label>
              <Textarea
                placeholder="e.g., 10% Cashback, Personal Manager, Monthly Bonus $500"
                value={newTier.benefits?.join(', ') || ''}
                onChange={(e) => setNewTier({ ...newTier, benefits: e.target.value.split(',').map(b => b.trim()) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateTier} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
