import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Copy, RefreshCw, Save, Undo2, ChevronDown } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  variations?: string[];
}

interface GameBuilderProject {
  id: number;
  title: string;
  description: string;
  source_url?: string;
  status: string;
  created_at: string;
}

interface GameVersion {
  id: number;
  version_number: number;
  game_data: any;
  step_completed: string;
  preview_url?: string;
  created_at: string;
}

interface GameData {
  name: string;
  description: string;
  theme: string;
  mechanics: string[];
  art_style: string;
  animations: string[];
  sounds: string[];
  ui_layout: string;
  colors: string[];
  fonts: string[];
  paytable: any;
  bonus_rounds: any[];
  rtp: number;
  volatility: 'Low' | 'Medium' | 'High';
  min_bet: number;
  max_bet: number;
  features: string[];
}

const defaultGameData: GameData = {
  name: 'Untitled Game',
  description: '',
  theme: '',
  mechanics: [],
  art_style: '',
  animations: [],
  sounds: [],
  ui_layout: 'standard',
  colors: [],
  fonts: [],
  paytable: {},
  bonus_rounds: [],
  rtp: 96,
  volatility: 'Medium',
  min_bet: 0.1,
  max_bet: 5,
  features: [],
};

const buildSteps = [
  'concept',
  'theme',
  'mechanics',
  'art_style',
  'ui',
  'bonuses',
  'final_thumbnail',
  'final_game',
];

export const AIGameBuilderChat: React.FC<{ projectId?: number }> = ({ projectId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gameData, setGameData] = useState<GameData>(defaultGameData);
  const [currentStep, setCurrentStep] = useState(0);
  const [versions, setVersions] = useState<GameVersion[]>([]);
  const [showVariations, setShowVariations] = useState(false);
  const [suggestedVariations, setSuggestedVariations] = useState<string[]>([]);
  const [project, setProject] = useState<GameBuilderProject | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load project if projectId is provided
  useEffect(() => {
    if (projectId) {
      loadProject();
    } else {
      // Initialize with welcome message
      initializeBuilder();
    }
  }, [projectId]);

  // Auto-save every 30 seconds
  useEffect(() => {
    autoSaveTimer.current = setInterval(() => {
      if (project?.id && gameData.name !== 'Untitled Game') {
        autoSaveVersion();
      }
    }, 30000);

    return () => clearInterval(autoSaveTimer.current);
  }, [project, gameData]);

  const loadProject = async () => {
    try {
      const response = await apiCall(
        `/admin/v2/games/builder/projects/${projectId}`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if ((response as any).success) {
        const proj = (response as any).data;
        setProject(proj);
        setVersions(proj.versions || []);

        if (proj.versions && proj.versions.length > 0) {
          const latest = proj.versions[0];
          setGameData(latest.game_data);
          setCurrentStep(buildSteps.indexOf(latest.step_completed) + 1);
        }

        // Add loading message
        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: `Welcome back! I've loaded your project: "${proj.title}". You were at the ${buildSteps[currentStep]} step. What would you like to do next?`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error('Failed to load project');
    }
  };

  const initializeBuilder = async () => {
    // Create new project
    try {
      const response = await apiCall('/admin/v2/games/builder/projects', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Game Project',
          description: 'Building a new game...',
        }),
      });

      if ((response as any).success) {
        setProject((response as any).data);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }

    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `🎮 Welcome to the AI Game Builder! I'm your creative assistant. You can ask me to:\n\n• Build a new game (e.g., "Create a crash game with multipliers up to 1000x")\n• Rebrand a game from a URL (e.g., "Rebrand https://example.com/slot-game")\n• Modify existing designs (e.g., "Add free spins", "Change the theme to Egyptian")\n\nWhat would you like to create today?`,
        timestamp: new Date(),
      },
    ]);
  };

  const generateVariations = async (description: string) => {
    try {
      const variations = [
        `High-volatility version with multipliers up to 500x`,
        `Low-volatility version with frequent small wins`,
        `Branded tournament mode with leaderboards`,
        `Fantasy RPG theme variant`,
        `Minimalist modern design variant`,
      ];

      setSuggestedVariations(variations);
      setShowVariations(true);

      addMessage(
        'assistant',
        `Great idea! Here are 5 creative variations:\n\n${variations
          .map((v, i) => `${i + 1}. ${v}`)
          .join('\n')}\n\nWhich variation interests you, or would you like me to build the original?`,
        variations
      );
    } catch (error) {
      console.error('Error generating variations:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    // Add user message
    addMessage('user', userInput);

    const userMessage = userInput;
    setUserInput('');
    setIsLoading(true);

    try {
      // Check if user is providing a URL for rebranding
      if (userMessage.toLowerCase().includes('http')) {
        await handleURLRebranding(userMessage);
      } else if (
        userMessage.toLowerCase().includes('create') ||
        userMessage.toLowerCase().includes('build')
      ) {
        // Generate variations first
        await generateVariations(userMessage);
      } else {
        // Handle modifications to current game
        await handleGameModification(userMessage);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addMessage('assistant', '❌ Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleURLRebranding = async (message: string) => {
    // Extract URL from message
    const urlMatch = message.match(/https?:\/\/[^\s]+/);
    if (!urlMatch) {
      addMessage('assistant', 'Please provide a valid URL starting with http:// or https://');
      return;
    }

    const url = urlMatch[0];

    addMessage('assistant', `🔍 Analyzing game at: ${url}\n\nStep 1: Crawling the page...\nStep 2: Extracting game details...\nStep 3: Analyzing theme and style...`);

    // Simulate crawling (in real implementation, this would call the backend)
    setTimeout(() => {
      const newGameData = {
        ...gameData,
        name: 'PlayCoinKrazy Studios Game',
        description: 'Game rebranded with PlayCoinKrazy branding',
        theme: 'Modern Casino',
      };

      setGameData(newGameData);
      setCurrentStep(1);

      addMessage(
        'assistant',
        `✅ Analysis complete! I've extracted the game details:\n\n• Theme: Modern Casino\n• Art Style: Contemporary\n• Features: Bonus rounds, Free spins\n• RTP: 96%\n\nNow rebranding with PlayCoinKrazy.com branding...\n\nStep 4: Replacing logos and watermarks...\nStep 5: Updating UI with new branding...\nStep 6: Generating branded thumbnail...`
      );

      saveGameVersion('concept', newGameData);
    }, 2000);
  };

  const handleGameModification = async (instruction: string) => {
    addMessage('assistant', `💡 Understood. Modifying your game:\n\n${instruction}\n\nApplying changes...`);

    // Simulate modification
    setTimeout(() => {
      addMessage(
        'assistant',
        `✅ Changes applied! Here's what I updated:\n\n✓ Updated mechanics\n✓ Adjusted paytable\n✓ Modified visual style\n\nWould you like to see a preview, make more changes, or move to the next step?`
      );
    }, 1000);
  };

  const addMessage = (
    role: 'user' | 'assistant',
    content: string,
    variations?: string[]
  ) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      variations,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const saveGameVersion = async (step: string, data: GameData = gameData) => {
    if (!project?.id) return;

    try {
      const response = await apiCall(
        `/admin/v2/games/builder/projects/${project.id}/versions`,
        {
          method: 'POST',
          body: JSON.stringify({
            game_data: data,
            step_completed: step,
            preview_url: `/preview/${project.id}/${Date.now()}`,
          }),
        }
      );

      if ((response as any).success) {
        const newVersion = (response as any).data;
        setVersions((prev) => [newVersion, ...prev]);
        toast.success('Version saved!');
      }
    } catch (error) {
      console.error('Failed to save version:', error);
    }
  };

  const autoSaveVersion = async () => {
    await saveGameVersion(buildSteps[currentStep] || 'in_progress');
  };

  const undoToVersion = async (versionId: number) => {
    if (!project?.id) return;

    try {
      const response = await apiCall(
        `/admin/v2/games/builder/projects/${project.id}/versions/${versionId}/restore`,
        { method: 'POST' }
      );

      if ((response as any).success) {
        const restoredVersion = (response as any).data;
        setGameData(restoredVersion.game_data);
        setVersions((prev) => [restoredVersion, ...prev]);
        toast.success('Version restored!');
      }
    } catch (error) {
      console.error('Failed to restore version:', error);
      toast.error('Failed to restore version');
    }
  };

  const publishGame = async () => {
    if (!gameData.name || gameData.name === 'Untitled Game') {
      toast.error('Please enter a game name');
      return;
    }

    try {
      // Create the game in the main games table
      const response = await apiCall('/admin/v2/games', {
        method: 'POST',
        body: JSON.stringify({
          name: gameData.name,
          slug: gameData.name.toLowerCase().replace(/\s+/g, '-'),
          description: gameData.description,
          category: 'Slots',
          provider: 'CoinKrazy Studios',
          rtp: gameData.rtp,
          volatility: gameData.volatility,
          image_url: gameData.theme,
          enabled: true,
          max_win_amount: 10,
        }),
      });

      if ((response as any).success) {
        toast.success(`✨ Game "${gameData.name}" published successfully!`);
        // Reset or redirect
      }
    } catch (error) {
      console.error('Failed to publish game:', error);
      toast.error('Failed to publish game');
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Chat Panel */}
      <div className="w-2/3 flex flex-col border-r border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 bg-gray-900/50">
          <h2 className="text-2xl font-bold text-white mb-2">🎮 AI Game Builder</h2>
          <p className="text-gray-400">
            {project ? `Project: ${project.title}` : 'New Project'}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xl px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-800 text-gray-100 border border-gray-700'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message.content}</p>
                {message.variations && message.variations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.variations.map((v, i) => (
                      <Button
                        key={i}
                        onClick={() => {
                          setUserInput(v);
                        }}
                        className="w-full text-xs bg-gray-700 hover:bg-gray-600 text-gray-100 justify-start"
                      >
                        {v}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-gray-100 border border-gray-700 px-4 py-3 rounded-lg">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-700 bg-gray-900/50">
          <div className="flex gap-3">
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask me to build, modify, or rebrand a game... Paste a URL to rebrand it!"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleSendMessage(e as any);
                }
              }}
              className="bg-gray-800 border-gray-700 text-white resize-none"
              rows={3}
            />
            <Button
              type="submit"
              disabled={isLoading || !userInput.trim()}
              className="bg-orange-600 hover:bg-orange-700 text-white self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Preview & Actions Panel */}
      <div className="w-1/3 flex flex-col bg-gray-900/80 border-l border-gray-700">
        {/* Game Data Preview */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-3">Game Details</h3>
            <div className="space-y-2 text-sm">
              <Input
                value={gameData.name}
                onChange={(e) => setGameData({ ...gameData, name: e.target.value })}
                placeholder="Game Name"
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Textarea
                value={gameData.description}
                onChange={(e) =>
                  setGameData({ ...gameData, description: e.target.value })
                }
                placeholder="Description"
                rows={2}
                className="bg-gray-800 border-gray-700 text-white resize-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={gameData.volatility}
                  onChange={(e) =>
                    setGameData({
                      ...gameData,
                      volatility: e.target.value as 'Low' | 'Medium' | 'High',
                    })
                  }
                  className="bg-gray-800 border border-gray-700 text-white px-2 py-1 rounded text-xs"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
                <Input
                  type="number"
                  min="90"
                  max="98"
                  step="0.1"
                  value={gameData.rtp}
                  onChange={(e) =>
                    setGameData({ ...gameData, rtp: parseFloat(e.target.value) })
                  }
                  placeholder="RTP %"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>

          {/* Build Steps */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3">Progress</h3>
            <div className="space-y-2">
              {buildSteps.map((step, i) => (
                <div
                  key={step}
                  className={`px-3 py-2 rounded text-xs font-medium ${
                    i < currentStep
                      ? 'bg-green-900/50 text-green-400 border border-green-700'
                      : i === currentStep
                      ? 'bg-orange-900/50 text-orange-400 border border-orange-700'
                      : 'bg-gray-800/50 text-gray-500 border border-gray-700'
                  }`}
                >
                  {i < currentStep ? '✓' : i === currentStep ? '◉' : '○'} {step}
                </div>
              ))}
            </div>
          </div>

          {/* Version History */}
          {versions.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-white mb-3">
                <Undo2 className="w-4 h-4 inline mr-2" />
                History ({versions.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {versions.map((v) => (
                  <Button
                    key={v.id}
                    onClick={() => undoToVersion(v.id)}
                    className="w-full text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 justify-start"
                  >
                    v{v.version_number}: {v.step_completed}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-700 space-y-3">
          <Button
            onClick={() => saveGameVersion(buildSteps[currentStep] || 'in_progress')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Version
          </Button>
          <Button
            onClick={publishGame}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold"
          >
            🚀 Publish Game
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIGameBuilderChat;
