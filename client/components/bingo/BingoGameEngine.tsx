import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Volume2, VolumeX, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import confetti from 'canvas-confetti';

interface BingoGameEngineProps {
  gameId?: number;
  gameName?: string;
  roomName?: string;
  players?: number;
  jackpot?: number;
}

interface BingoCard {
  id: string;
  numbers: number[][];
  marked: boolean[][];
  cardId: string;
}

interface GameState {
  balance: number;
  gameStatus: 'waiting' | 'playing' | 'won' | 'lost';
  calledNumbers: number[];
  card: BingoCard | null;
  winnings: number;
  totalWinnings: number;
  soundEnabled: boolean;
  gameCount: number;
  winCount: number;
}

const BingoGameEngine: React.FC<BingoGameEngineProps> = ({
  gameId,
  gameName = 'Bingo Bonanza',
  roomName = 'Main Hall',
  players = 42,
  jackpot = 1500,
}) => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>({
    balance: 1000,
    gameStatus: 'waiting',
    calledNumbers: [],
    card: null,
    winnings: 0,
    totalWinnings: 0,
    soundEnabled: true,
    gameCount: 0,
    winCount: 0,
  });

  // Load user balance on mount
  useEffect(() => {
    if (user) {
      setGameState(prev => ({
        ...prev,
        balance: (user as any).sc_balance || 1000,
      }));
    }
    // Generate initial card
    generateNewCard();
  }, [user]);

  const generateCard = (): number[][] => {
    const card: number[][] = [];
    for (let col = 0; col < 5; col++) {
      const colNumbers: number[] = [];
      const start = col * 15 + 1;
      const end = col * 15 + 15;

      while (colNumbers.length < 5) {
        const num = Math.floor(Math.random() * (end - start + 1)) + start;
        if (!colNumbers.includes(num)) {
          colNumbers.push(num);
        }
      }

      // Middle cell is always FREE
      if (col === 2) {
        colNumbers[2] = 0; // 0 represents FREE space
      }

      card.push(colNumbers);
    }

    return card;
  };

  const generateNewCard = () => {
    const numbers = generateCard();
    setGameState(prev => ({
      ...prev,
      card: {
        id: `card-${Date.now()}`,
        numbers,
        marked: numbers.map((col, colIdx) =>
          col.map((num, rowIdx) => colIdx === 2 && rowIdx === 2) // Mark FREE space
        ),
        cardId: `card-${Math.random().toString(36).substr(2, 9)}`,
      },
      gameStatus: 'waiting',
      calledNumbers: [],
    }));
  };

  const callNumber = () => {
    const newNumber = Math.floor(Math.random() * 75) + 1;

    if (gameState.calledNumbers.includes(newNumber)) {
      toast.info('Number already called, trying another...');
      callNumber();
      return;
    }

    setGameState(prev => ({
      ...prev,
      gameStatus: 'playing',
      calledNumbers: [...prev.calledNumbers, newNumber],
    }));

    if (gameState.card) {
      checkBingo();
    }
  };

  const toggleNumber = (colIdx: number, rowIdx: number) => {
    if (!gameState.card) return;

    const newCard = { ...gameState.card };
    newCard.marked[colIdx][rowIdx] = !newCard.marked[colIdx][rowIdx];

    setGameState(prev => ({
      ...prev,
      card: newCard,
    }));

    checkBingo();
  };

  const checkBingo = () => {
    if (!gameState.card) return;

    const marked = gameState.card.marked;

    // Check rows
    for (let row = 0; row < 5; row++) {
      if (marked.every((col) => col[row])) {
        declareWinner('5-LINE');
        return;
      }
    }

    // Check columns
    for (let col = 0; col < 5; col++) {
      if (marked[col].every(m => m)) {
        declareWinner('5-LINE');
        return;
      }
    }

    // Check diagonals
    const diag1 = marked.every((col, idx) => col[idx]);
    const diag2 = marked.every((col, idx) => col[4 - idx]);

    if (diag1 || diag2) {
      declareWinner('DIAGONAL');
      return;
    }

    // Check full card
    if (marked.every(col => col.every(m => m))) {
      declareWinner('FULL CARD');
      return;
    }
  };

  const declareWinner = (pattern: string) => {
    const winAmount = Math.min(jackpot / players * (Math.random() * 0.5 + 0.5), 10); // Max 10 SC

    setGameState(prev => ({
      ...prev,
      gameStatus: 'won',
      winnings: winAmount,
      totalWinnings: prev.totalWinnings + winAmount,
      balance: prev.balance + winAmount,
      winCount: prev.winCount + 1,
    }));

    toast.success(`🎉 ${pattern} BINGO! Won ${winAmount.toFixed(2)} SC!`);
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
    });
  };

  const startNewGame = () => {
    generateNewCard();
    setGameState(prev => ({
      ...prev,
      gameCount: prev.gameCount + 1,
    }));
  };

  if (!gameState.card) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-black italic uppercase text-white">{gameName}</h1>
        <p className="text-purple-400 font-bold uppercase tracking-widest text-sm">{roomName} • {players} Players • {jackpot.toFixed(2)} SC Pot</p>
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 text-center">
            <p className="text-slate-400 text-sm font-bold uppercase">Balance</p>
            <p className="text-2xl font-black text-white">{gameState.balance.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 text-center">
            <p className="text-slate-400 text-sm font-bold uppercase">Games Played</p>
            <p className="text-2xl font-black text-white">{gameState.gameCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 text-center">
            <p className="text-slate-400 text-sm font-bold uppercase">Wins</p>
            <p className="text-2xl font-black text-green-400">{gameState.winCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 text-center">
            <p className="text-slate-400 text-sm font-bold uppercase">Total Won</p>
            <p className="text-2xl font-black text-yellow-400">{gameState.totalWinnings.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Game Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bingo Card */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-b from-slate-900 to-slate-950 border-4 border-purple-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-black italic uppercase">Your Card</CardTitle>
                <Badge className="bg-purple-600">{gameState.gameStatus.toUpperCase()}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="bg-black/50 rounded-2xl p-6 border-2 border-purple-500/50">
                {/* Header Letters */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {['B', 'I', 'N', 'G', 'O'].map(letter => (
                    <div key={letter} className="text-center font-black text-purple-400 text-2xl">
                      {letter}
                    </div>
                  ))}
                </div>

                {/* Card Grid */}
                <div className="grid grid-cols-5 gap-2">
                  {gameState.card.numbers.map((col, colIdx) =>
                    col.map((num, rowIdx) => (
                      <button
                        key={`${colIdx}-${rowIdx}`}
                        onClick={() => toggleNumber(colIdx, rowIdx)}
                        disabled={gameState.gameStatus === 'won' && num !== 0}
                        className={`
                          aspect-square rounded-lg font-black text-lg flex items-center justify-center
                          transition-all duration-200 border-2
                          ${gameState.card!.marked[colIdx][rowIdx]
                            ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-500/50'
                            : 'bg-slate-800 border-slate-600 text-white hover:border-purple-500'
                          }
                          ${num === 0 ? 'bg-purple-700 border-purple-500' : ''}
                          ${gameState.calledNumbers.includes(num) ? 'ring-2 ring-yellow-500' : ''}
                        `}
                      >
                        {num === 0 ? 'FREE' : num}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-4">
          {/* Called Numbers */}
          <Card className="bg-gradient-to-b from-slate-900 to-slate-950 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase">Called Numbers ({gameState.calledNumbers.length}/75)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black/50 rounded-lg p-4 max-h-64 overflow-y-auto border border-purple-500/20">
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 75 }, (_, i) => i + 1).map(num => (
                    <div
                      key={num}
                      className={`
                        text-center text-xs font-bold rounded p-1
                        ${gameState.calledNumbers.includes(num)
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                        }
                      `}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Game Controls */}
          <Card className="bg-gradient-to-b from-slate-900 to-slate-950 border-purple-500/30">
            <CardContent className="p-6 space-y-3">
              <Button
                onClick={callNumber}
                disabled={gameState.gameStatus === 'won'}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black text-lg italic rounded-xl"
              >
                CALL NUMBER
              </Button>

              {gameState.gameStatus === 'won' && (
                <Button
                  onClick={startNewGame}
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black text-lg italic rounded-xl"
                >
                  NEW GAME
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setGameState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              >
                {gameState.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BingoGameEngine;
