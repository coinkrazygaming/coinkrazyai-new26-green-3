import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { apiCall } from '@/lib/api';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  type: 'flame' | 'ember' | 'spark';
  size: number;
  rotation: number;
  color: string;
}

interface ReelSymbol {
  id: string;
  value: string;
  rarity: 'common' | 'rare' | 'epic';
}

interface GameState {
  isSpinning: boolean;
  selectedBet: number;
  balance: number;
  reels: ReelSymbol[][];
  bonusActive: boolean;
  currentWin: number;
  message: string;
}

const SYMBOLS: Record<string, ReelSymbol> = {
  coin5: { id: 'coin5', value: '5', rarity: 'common' },
  coin10: { id: 'coin10', value: '10', rarity: 'rare' },
  coin20: { id: 'coin20', value: '20', rarity: 'epic' },
  collect: { id: 'collect', value: 'COLLECT', rarity: 'epic' },
  coinUp: { id: 'coinUp', value: 'COIN UP', rarity: 'epic' },
  multiUp: { id: 'multiUp', value: 'MULTI UP', rarity: 'epic' },
  jackpot: { id: 'jackpot', value: 'JACKPOT', rarity: 'epic' },
};

const SYMBOL_ARRAY = Object.values(SYMBOLS);

export const GameCanvas: React.FC<{
  initialBalance: number;
  onWin: (amount: number) => void;
  onBet: (amount: number) => void;
  maxBet?: number;
}> = ({ initialBalance, onWin, onBet, maxBet = 5 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  
  const [gameState, setGameState] = useState<GameState>({
    isSpinning: false,
    selectedBet: 0.1,
    balance: initialBalance,
    reels: Array(3).fill(null).map(() => 
      Array(3).fill(null).map(() => 
        SYMBOL_ARRAY[Math.floor(Math.random() * SYMBOL_ARRAY.length)]
      )
    ),
    bonusActive: false,
    currentWin: 0,
    message: 'Ready to play!',
  });

  // Initialize canvas and start animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(devicePixelRatio, devicePixelRatio);

    const animate = () => {
      // Clear canvas with dark background
      ctx.fillStyle = '#0a0000';
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Draw volcanic background
      drawLavaBackground(ctx, rect.width, rect.height);

      // Draw reels
      drawReels(ctx, gameState, rect.width, rect.height);

      // Update and draw particles
      updateParticles(particlesRef.current);
      drawParticles(ctx, particlesRef.current);

      // Draw UI overlay
      drawUI(ctx, gameState, rect.width, rect.height);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState]);

  // Emit idle flame particles
  useEffect(() => {
    const interval = setInterval(() => {
      if (!gameState.isSpinning) {
        emitFlameParticles(particlesRef.current, 2);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameState.isSpinning]);

  const drawLavaBackground = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const time = Date.now() / 1000;

    // Base dark red with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#2a0000');
    gradient.addColorStop(0.5, '#5a1a00');
    gradient.addColorStop(1, '#1a0000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Lava floor pattern with heat distortion
    ctx.fillStyle = 'rgba(255, 100, 0, 0.1)';
    for (let i = 0; i < 15; i++) {
      const x = (i * (w / 15) + Math.sin(time + i) * 20) % w;
      const y = h - 30 + Math.cos(time * 0.5 + i) * 10;
      ctx.beginPath();
      ctx.arc(x, y, 40 + Math.sin(time * 2 + i) * 15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Floating embers
    for (let i = 0; i < 8; i++) {
      const x = (i * (w / 8) + Math.sin(time + i) * 30) % w;
      const y = 100 + Math.sin(time * 0.3 + i) * 50;
      ctx.fillStyle = `rgba(255, ${150 + Math.sin(time + i) * 100}, 0, ${0.3 + Math.sin(time * 2 + i) * 0.2})`;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawReels = (ctx: CanvasRenderingContext2D, state: GameState, w: number, h: number) => {
    const reelWidth = 100;
    const reelHeight = 150;
    const reelGap = 30;
    const startX = (w - (reelWidth * 3 + reelGap * 2)) / 2;
    const startY = 80;

    for (let reelIdx = 0; reelIdx < 3; reelIdx++) {
      const reelX = startX + reelIdx * (reelWidth + reelGap);
      
      // Draw reel background with fire border
      const time = Date.now() / 1000;
      ctx.fillStyle = '#1a0000';
      ctx.fillRect(reelX, startY, reelWidth, reelHeight);

      // Fiery border glow
      const glowIntensity = 0.5 + Math.sin(time * 3) * 0.5;
      ctx.strokeStyle = `rgba(255, ${100 + glowIntensity * 155}, 0, ${0.8 + glowIntensity * 0.2})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(reelX, startY, reelWidth, reelHeight);

      // Draw symbols in reel
      for (let symIdx = 0; symIdx < 3; symIdx++) {
        const symbol = state.reels[reelIdx][symIdx];
        const symbolY = startY + symIdx * 50 + 5;
        drawSymbol(ctx, reelX + 5, symbolY, reelWidth - 10, 40, symbol, state.isSpinning);
      }
    }

    // Highlight center payline
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(startX - 20, startY + 55);
    ctx.lineTo(startX + reelWidth * 3 + reelGap * 2 + 20, startY + 55);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawSymbol = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    symbol: ReelSymbol,
    isSpinning: boolean
  ) => {
    const time = Date.now() / 1000;

    // Symbol background
    let bgColor = '#2a1010';
    let borderColor = '#ff6400';

    if (symbol.rarity === 'rare') {
      bgColor = '#3a2510';
      borderColor = '#ffa500';
    } else if (symbol.rarity === 'epic') {
      bgColor = '#4a3a10';
      borderColor = '#ffff00';
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, w, h);

    // Border glow
    const glowIntensity = 0.5 + Math.sin(time * 4 + (symbol.rarity === 'epic' ? 0 : 1)) * 0.5;
    ctx.strokeStyle = `rgba(255, ${glowIntensity * 255}, 0, ${0.6 + glowIntensity * 0.4})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Symbol text
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol.value, x + w / 2, y + h / 2);

    // Mini flame effect on epic symbols
    if (symbol.rarity === 'epic') {
      ctx.fillStyle = `rgba(255, ${150 + Math.sin(time * 5) * 100}, 0, 0.4)`;
      ctx.beginPath();
      ctx.arc(x + w - 8, y + 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
    particles.forEach((p) => {
      const alpha = p.life / p.maxLife;
      
      if (p.type === 'flame') {
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(255, 255, 100, ${alpha * 0.8})`);
        gradient.addColorStop(0.5, `rgba(255, 150, 0, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
        ctx.fillStyle = gradient;
      } else if (p.type === 'ember') {
        ctx.fillStyle = `rgba(255, ${100 + Math.random() * 155}, 0, ${alpha * 0.7})`;
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  };

  const drawUI = (ctx: CanvasRenderingContext2D, state: GameState, w: number, h: number) => {
    // Balance display
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Balance: ${state.balance.toFixed(2)} SC`, 20, 30);

    // Current bet
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`Bet: ${state.selectedBet.toFixed(2)} SC`, 20, 50);

    // Message
    ctx.fillStyle = '#ff6400';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(state.message, w / 2, h - 30);

    // Win display (if applicable)
    if (state.currentWin > 0) {
      ctx.fillStyle = `rgba(255, 255, 0, ${0.5 + Math.sin(Date.now() / 200) * 0.5})`;
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`YOU WON: ${state.currentWin.toFixed(2)} SC!`, w / 2, 70);
    }
  };

  const updateParticles = (particles: Particle[]) => {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // gravity
      p.life -= 1;
      p.rotation += 0.05;

      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  };

  const emitFlameParticles = (particles: Particle[], count: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * rect.width,
        y: rect.height - 50,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 2 - 1,
        life: 100,
        maxLife: 100,
        type: 'flame',
        size: Math.random() * 3 + 2,
        rotation: Math.random() * Math.PI * 2,
        color: `hsl(${Math.random() * 30 + 10}, 100%, ${Math.random() * 50 + 50}%)`,
      });
    }
  };

  const handleSpin = async () => {
    if (gameState.isSpinning || gameState.selectedBet > gameState.balance) {
      setGameState(prev => ({
        ...prev,
        message: 'Insufficient balance or already spinning!'
      }));
      return;
    }

    setGameState(prev => ({
      ...prev,
      isSpinning: true,
      message: 'Spinning...',
      balance: prev.balance - gameState.selectedBet, // Deduct immediately
    }));

    try {
      // Call backend API to process spin
      const result = await apiCall('/api/games/spin', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 1, // CoinKrazy-CoinHot game ID (will be set in DB)
          bet_amount: gameState.selectedBet,
        }),
      });

      onBet(gameState.selectedBet);

      // Simulate spin with particle effects
      const newReels = Array(3).fill(null).map(() =>
        Array(3).fill(null).map(() =>
          SYMBOL_ARRAY[Math.floor(Math.random() * SYMBOL_ARRAY.length)]
        )
      );

      // Emit fire particles during spin
      for (let i = 0; i < 30; i++) {
        setTimeout(() => {
          emitFlameParticles(particlesRef.current, 3);
        }, i * 20);
      }

      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          reels: newReels,
          isSpinning: false,
        }));

        const winAmount = result.win_amount || 0;

        if (winAmount > 0) {
          // Emit massive particle explosion
          for (let i = 0; i < 50; i++) {
            const p: Particle = {
              x: 320,
              y: 150,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8 - 2,
              life: 150,
              maxLife: 150,
              type: Math.random() > 0.7 ? 'spark' : 'flame',
              size: Math.random() * 4 + 2,
              rotation: Math.random() * Math.PI * 2,
              color: 'rgba(255, 255, 0, 1)',
            };
            particlesRef.current.push(p);
          }

          onWin(winAmount);
          setGameState(prev => ({
            ...prev,
            currentWin: winAmount,
            balance: result.balance_after,
            message: `Won ${winAmount.toFixed(2)} SC!`,
          }));
        } else {
          setGameState(prev => ({
            ...prev,
            balance: result.balance_after,
            message: 'No match - try again!',
          }));
        }
      }, 2000);
    } catch (error) {
      console.error('Spin failed:', error);
      setGameState(prev => ({
        ...prev,
        isSpinning: false,
        message: 'Spin failed. Please try again.',
        balance: prev.balance + gameState.selectedBet, // Refund the bet
      }));
    }
  };

  const changeBet = (delta: number) => {
    const newBet = Math.max(0.1, Math.min(maxBet, gameState.selectedBet + delta));
    setGameState(prev => ({
      ...prev,
      selectedBet: Math.round(newBet * 10) / 10,
    }));
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-red-950 via-orange-950 to-red-950 flex flex-col">
      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: 'block' }}
        />
      </div>

      {/* Controls */}
      <div className="bg-black/80 border-t-4 border-orange-500 p-6 flex justify-between items-center">
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => changeBet(-0.1)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded border-2 border-orange-400"
          >
            − Bet
          </motion.button>
          <div className="px-4 py-2 bg-gray-900 text-yellow-300 font-bold rounded border-2 border-orange-400">
            Bet: {gameState.selectedBet.toFixed(2)} SC
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => changeBet(0.1)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded border-2 border-orange-400"
          >
            + Bet
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.1, boxShadow: '0 0 30px rgba(255, 100, 0, 0.8)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSpin}
          disabled={gameState.isSpinning}
          className="px-8 py-3 bg-gradient-to-b from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-600 text-black font-bold text-lg rounded-lg border-4 border-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          🔥 SPIN 🔥
        </motion.button>

        <div className="text-right">
          <div className="text-yellow-300 font-bold text-lg">
            Balance: {gameState.balance.toFixed(2)} SC
          </div>
          <div className="text-orange-400 text-sm">
            Max Bet: {maxBet} SC
          </div>
        </div>
      </div>
    </div>
  );
};
