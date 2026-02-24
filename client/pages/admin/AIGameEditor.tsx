import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiCall } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Game {
  id: number;
  name: string;
  slug: string;
  category: string;
  provider: string;
  rtp: number;
  volatility: string;
  description: string;
  enabled: boolean;
  image_url?: string;
  created_at: string;
}

interface GameFormData {
  name: string;
  slug: string;
  category: string;
  type: string;
  provider: string;
  rtp: number;
  volatility: string;
  description: string;
  image_url: string;
  enabled: boolean;
  max_bet: number;
  min_bet: number;
}

const initialFormData: GameFormData = {
  name: '',
  slug: '',
  category: 'Slots',
  type: 'slots',
  provider: 'CoinKrazy Studios',
  rtp: 96.0,
  volatility: 'Medium',
  description: '',
  image_url: '',
  enabled: true,
  max_bet: 5,
  min_bet: 0.1,
};

export const AIGameEditor: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<GameFormData>(initialFormData);

  // Fetch games on mount
  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall('/api/admin/v2/games', {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.success) {
        setGames(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch games:', error);
      toast.error('Failed to load games');
    } finally {
      setIsLoading(false);
    }
  };

  const generateGameWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a game description prompt');
      return;
    }

    try {
      setIsGenerating(true);
      // Call Google Generative AI endpoint via backend
      const response = await apiCall('/api/admin/v2/games/generate-with-ai', {
        method: 'POST',
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (response.success && response.data) {
        const generatedGame = response.data;
        setFormData({
          name: generatedGame.name || '',
          slug: generatedGame.slug || generatedGame.name?.toLowerCase().replace(/\s+/g, '-') || '',
          category: generatedGame.category || 'Slots',
          type: generatedGame.type || 'slots',
          provider: 'CoinKrazy Studios',
          rtp: generatedGame.rtp || 96.0,
          volatility: generatedGame.volatility || 'Medium',
          description: generatedGame.description || '',
          image_url: generatedGame.image_url || '',
          enabled: true,
          max_bet: generatedGame.max_bet || 5,
          min_bet: generatedGame.min_bet || 0.1,
        });
        toast.success('Game generated! Review and submit below');
      }
    } catch (error: any) {
      console.error('AI generation failed:', error);
      const errorMsg = error.message || 'Failed to generate game with AI';
      const details = error.details?.details || error.details?.error || '';
      const fullMsg = details ? `${errorMsg}: ${details}` : errorMsg;
      toast.error(fullMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const createGameFromAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a game description prompt');
      return;
    }

    try {
      setIsGenerating(true);
      // Call one-click AI game creation endpoint
      const response = await apiCall('/api/admin/v2/games/create-from-ai', {
        method: 'POST',
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (response.success) {
        toast.success(`✨ Game "${response.data.name}" created automatically!`);
        await fetchGames();
        setAiPrompt('');
      }
    } catch (error: any) {
      console.error('AI game creation failed:', error);
      const errorMsg = error.message || 'Failed to create game with AI';
      const details = error.details?.details || error.details?.error || '';

      // Show suggested slug if available
      if (error.details?.suggestedSlug) {
        toast.error(`${errorMsg}. Try: ${error.details.suggestedSlug}`);
      } else {
        const fullMsg = details ? `${errorMsg}: ${details}` : errorMsg;
        toast.error(fullMsg);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFormChange = (field: keyof GameFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerateSlug = () => {
    const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    handleFormChange('slug', slug);
  };

  const submitGame = async () => {
    // Validation
    if (!formData.name || !formData.slug) {
      toast.error('Game name and slug are required');
      return;
    }

    try {
      const url = selectedGame
        ? `/api/admin/v2/games/${selectedGame.id}`
        : '/api/admin/v2/games';
      const method = selectedGame ? 'PUT' : 'POST';

      const response = await apiCall(url, {
        method,
        body: JSON.stringify({
          ...formData,
          max_win_amount: 10, // Enforce 10 SC cap
        }),
      });

      if (response.success) {
        toast.success(selectedGame ? 'Game updated!' : 'Game created!');
        await fetchGames();
        resetForm();
      }
    } catch (error: any) {
      console.error('Failed to save game:', error);
      const errorMsg = error.message || 'Failed to save game';
      const details = error.details?.details || error.details?.error || '';
      const fullMsg = details ? `${errorMsg}: ${details}` : errorMsg;
      toast.error(fullMsg);
    }
  };

  const deleteGame = async (gameId: number) => {
    if (!confirm('Are you sure you want to delete this game?')) return;

    try {
      await apiCall(`/api/admin/v2/games/${gameId}`, { method: 'DELETE' });
      toast.success('Game deleted successfully');
      await fetchGames();
    } catch (error: any) {
      console.error('Failed to delete game:', error);
      const errorMsg = error.message || 'Failed to delete game';
      const details = error.details?.details || error.details?.error || '';
      const fullMsg = details ? `${errorMsg}: ${details}` : errorMsg;
      toast.error(fullMsg);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedGame(null);
    setShowCreateForm(false);
    setAiPrompt('');
  };

  const openEditForm = (game: Game) => {
    setSelectedGame(game);
    setFormData({
      name: game.name,
      slug: game.slug,
      category: game.category,
      type: game.category.toLowerCase(),
      provider: game.provider,
      rtp: game.rtp,
      volatility: game.volatility,
      description: game.description,
      image_url: game.image_url || '',
      enabled: game.enabled,
      max_bet: 5,
      min_bet: 0.1,
    });
    setShowCreateForm(true);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400">Loading games...</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen">
      <h1 className="text-4xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
        🎮 AI Game Editor & Maker
      </h1>

      {/* AI Game Generator */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-b from-orange-950/40 to-red-950/40 border-2 border-orange-500 rounded-lg p-6 mb-8"
      >
        <h2 className="text-2xl font-bold text-orange-400 mb-4">✨ Generate Game with AI</h2>
        <p className="text-gray-300 mb-4">
          Describe the game you want to create, and AI will generate the details for you!
        </p>

        <Textarea
          placeholder="Example: Create a fire-themed slot game with dragons, lava backgrounds, and explosive animations. Max bet 5 SC with high volatility."
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          className="w-full mb-4 bg-gray-900 border-orange-400 text-white"
          rows={4}
        />

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={generateGameWithAI}
            disabled={isGenerating || !aiPrompt.trim()}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2 rounded-lg disabled:opacity-50"
          >
            {isGenerating ? '🔄 Generating...' : '📋 Review First'}
          </Button>
          <Button
            onClick={createGameFromAI}
            disabled={isGenerating || !aiPrompt.trim()}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 rounded-lg disabled:opacity-50"
          >
            {isGenerating ? '⚡ Creating...' : '⚡ Create Now'}
          </Button>
        </div>
      </motion.div>

      {/* Games List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Games Library</h2>
          <Button
            onClick={() => {
              resetForm();
              setShowCreateForm(true);
            }}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold px-6 py-2 rounded-lg"
          >
            + New Game
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <motion.div
              key={game.id}
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-orange-500 transition-colors"
            >
              <div className="mb-3">
                {game.image_url && (
                  <img
                    src={game.image_url}
                    alt={game.name}
                    className="w-full h-32 object-cover rounded mb-3"
                  />
                )}
              </div>

              <h3 className="font-bold text-white mb-1 truncate">{game.name}</h3>
              <p className="text-xs text-gray-400 mb-3">{game.slug}</p>

              <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-300">
                <div>
                  <span className="text-gray-500">Category:</span> {game.category}
                </div>
                <div>
                  <span className="text-gray-500">RTP:</span> {game.rtp}%
                </div>
                <div>
                  <span className="text-gray-500">Volatility:</span> {game.volatility}
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>{' '}
                  <span className={game.enabled ? 'text-green-400' : 'text-red-400'}>
                    {game.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => openEditForm(game)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 rounded"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => deleteGame(game.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-1 rounded"
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Game Form Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-900 border-2 border-orange-500 rounded-lg p-6 max-h-[90vh] overflow-y-auto w-full max-w-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                {selectedGame ? '✏️ Edit Game' : '➕ Create New Game'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Game Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="e.g., Fire Dragon Slots"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Slug *
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.slug}
                      onChange={(e) => handleFormChange('slug', e.target.value)}
                      placeholder="fire-dragon-slots"
                      className="bg-gray-800 border-gray-700 text-white flex-1"
                    />
                    <Button
                      onClick={handleGenerateSlug}
                      className="bg-gray-700 hover:bg-gray-600 text-white"
                    >
                      Auto
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                  >
                    <option>Slots</option>
                    <option>Poker</option>
                    <option>Bingo</option>
                    <option>Sportsbook</option>
                    <option>Mini Games</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Provider
                  </label>
                  <Input
                    value={formData.provider}
                    onChange={(e) => handleFormChange('provider', e.target.value)}
                    placeholder="CoinKrazy Studios"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    RTP (%) - 90-98
                  </label>
                  <Input
                    type="number"
                    min="90"
                    max="98"
                    step="0.1"
                    value={formData.rtp}
                    onChange={(e) => handleFormChange('rtp', parseFloat(e.target.value))}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Volatility
                  </label>
                  <select
                    value={formData.volatility}
                    onChange={(e) => handleFormChange('volatility', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Min Bet (SC)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.min_bet}
                    onChange={(e) => handleFormChange('min_bet', parseFloat(e.target.value))}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Bet (SC) - Capped at 5
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    max="5"
                    value={Math.min(formData.max_bet, 5)}
                    onChange={(e) => handleFormChange('max_bet', Math.min(parseFloat(e.target.value), 5))}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Describe the game..."
                  rows={4}
                  className="w-full bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Image URL
                </label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => handleFormChange('image_url', e.target.value)}
                  placeholder="https://..."
                  className="bg-gray-800 border-gray-700 text-white"
                />
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="preview"
                    className="w-full h-32 object-cover rounded mt-2"
                  />
                )}
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => handleFormChange('enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  Enabled
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={submitGame}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 rounded-lg"
                >
                  {selectedGame ? '💾 Update Game' : '✅ Create Game'}
                </Button>
                <Button
                  onClick={resetForm}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIGameEditor;
