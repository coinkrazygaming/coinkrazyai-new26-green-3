import React, { useState, useEffect } from 'react';
import { adminV2, games } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Search, Plus, Edit, Trash2, Layout, Image, Link as LinkIcon, Save, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface GameForm {
  id?: number;
  name: string;
  slug: string;
  category: string;
  provider: string;
  image_url: string;
  thumbnail: string;
  embed_url: string;
  is_branded_popup: boolean;
  branding_config: any;
}

const initialForm: GameForm = {
  name: '',
  slug: '',
  category: 'Slots',
  provider: '',
  image_url: '',
  thumbnail: '',
  embed_url: '',
  is_branded_popup: true,
  branding_config: {}
};

export default function AdminGamesManagement() {
  const [gamesList, setGamesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<GameForm>(initialForm);
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchGames = async () => {
    setIsLoading(true);
    try {
      const response = await adminV2.games.list();
      setGamesList(response.data || []);
    } catch (err) {
      toast.error("Failed to fetch games");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleEdit = (game: any) => {
    setForm({
      id: game.id,
      name: game.name || '',
      slug: game.slug || '',
      category: game.category || 'Slots',
      provider: game.provider || '',
      image_url: game.image_url || '',
      thumbnail: game.thumbnail || '',
      embed_url: game.embed_url || game.launch_url || '',
      is_branded_popup: game.is_branded_popup ?? true,
      branding_config: game.branding_config || {}
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setForm(initialForm);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (isEditing && form.id) {
        await adminV2.games.update(form.id, form);
        toast.success("Game updated successfully");
      } else {
        await adminV2.games.create(form);
        toast.success("Game created successfully");
      }
      fetchGames();
      setIsDialogOpen(false);
    } catch (err) {
      toast.error("Failed to save game");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this game?")) return;
    try {
      await adminV2.games.delete(id);
      toast.success("Game deleted successfully");
      fetchGames();
    } catch (err) {
      toast.error("Failed to delete game");
    }
  };

  const filteredGames = gamesList.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.provider.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white">Games Management</h1>
          <p className="text-zinc-500 font-medium">Add, edit, and configure your slot games.</p>
        </div>
        <Button onClick={handleCreate} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-12 px-6">
          <Plus className="w-5 h-5 mr-2" />
          Add New Game
        </Button>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input 
                placeholder="Search games by name or provider..." 
                className="pl-10 bg-black border-zinc-800 h-11"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={fetchGames} className="border-zinc-800 h-11">
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
              <p className="text-zinc-500 font-medium">Loading your game catalog...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider">Game</TableHead>
                  <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider">Provider</TableHead>
                  <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider">Category</TableHead>
                  <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider">Branded Popup</TableHead>
                  <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGames.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-zinc-600">
                      No games found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGames.map((game) => (
                    <TableRow key={game.id} className="border-zinc-800 hover:bg-zinc-800/30 transition-colors group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-16 bg-black rounded-lg border border-zinc-800 overflow-hidden shrink-0">
                            <img 
                              src={game.thumbnail || game.image_url} 
                              alt={game.name} 
                              className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                              onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/000000/F59E0B?text=Slot'; }}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-white">{game.name}</p>
                            <p className="text-[10px] font-medium text-zinc-500 truncate max-w-[150px]">{game.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-zinc-400">{game.provider}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-zinc-700 text-zinc-400 font-bold uppercase text-[9px] px-2">
                          {game.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {game.is_branded_popup ? (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20 font-bold uppercase text-[9px]">ENABLED</Badge>
                        ) : (
                          <Badge variant="outline" className="border-zinc-800 text-zinc-600 font-bold uppercase text-[9px]">DISABLED</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700"
                            onClick={() => handleEdit(game)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => handleDelete(game.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-zinc-900 border-b border-zinc-800">
            <DialogTitle className="text-2xl font-black text-white">
              {isEditing ? "Edit Game" : "Add New Game"}
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              Configure the slot game parameters and branded popup settings.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 grid grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-zinc-500">Game Name</Label>
                <Input 
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="bg-black border-zinc-800"
                  placeholder="e.g. Sweet Bonanza"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-zinc-500">Slug</Label>
                <Input 
                  value={form.slug}
                  onChange={e => setForm({...form, slug: e.target.value})}
                  className="bg-black border-zinc-800"
                  placeholder="e.g. sweet-bonanza"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-zinc-500">Provider</Label>
                <Input 
                  value={form.provider}
                  onChange={e => setForm({...form, provider: e.target.value})}
                  className="bg-black border-zinc-800"
                  placeholder="e.g. Pragmatic Play"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-zinc-500">Embed URL</Label>
                <div className="flex gap-2">
                  <Input 
                    value={form.embed_url}
                    onChange={e => setForm({...form, embed_url: e.target.value})}
                    className="bg-black border-zinc-800"
                    placeholder="https://..."
                  />
                  <Button variant="outline" size="icon" className="border-zinc-800 shrink-0">
                    <LinkIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-zinc-500">Thumbnail Image</Label>
                <div className="flex gap-2">
                  <Input 
                    value={form.thumbnail}
                    onChange={e => setForm({...form, thumbnail: e.target.value})}
                    className="bg-black border-zinc-800"
                    placeholder="https://..."
                  />
                  <Button variant="outline" size="icon" className="border-zinc-800 shrink-0">
                    <Image className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800 mt-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-white">Branded Popup Mode</Label>
                  <p className="text-[10px] text-zinc-500 font-medium">Use full-screen branded overlay</p>
                </div>
                <Switch 
                  checked={form.is_branded_popup}
                  onCheckedChange={checked => setForm({...form, is_branded_popup: checked})}
                  className="data-[state=checked]:bg-yellow-500"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between gap-4">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-zinc-500 font-bold hover:text-white">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-8">
              <Save className="w-4 h-4 mr-2" />
              Save Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
