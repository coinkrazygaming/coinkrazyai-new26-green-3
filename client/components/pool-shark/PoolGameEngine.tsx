import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, RotateCcw, Zap, Trophy, Users } from 'lucide-react';

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  type: 'cue' | 'solid' | 'stripe' | '8ball';
  pocketed: boolean;
}

interface GameState {
  balls: Ball[];
  score: number;
  pocketedBalls: number;
  gameActive: boolean;
  currentPlayer: number;
  turnCount: number;
  players: Array<{ id: string; name: string; balance: number; score: number }>;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const POCKET_RADIUS = 12;
const BALL_RADIUS = 6;
const FRICTION = 0.985;
const RESTITUTION = 0.9;

const initializeBalls = (): Ball[] => {
  const balls: Ball[] = [];

  // Cue ball (white)
  balls.push({
    id: 0,
    x: 150,
    y: CANVAS_HEIGHT / 2,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS,
    color: '#FFFFFF',
    type: 'cue',
    pocketed: false,
  });

  // 8 Ball (black)
  balls.push({
    id: 8,
    x: CANVAS_WIDTH - 150,
    y: CANVAS_HEIGHT / 2,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS,
    color: '#000000',
    type: '8ball',
    pocketed: false,
  });

  // Solid balls (1-7) - yellow
  for (let i = 1; i <= 7; i++) {
    const angle = (i - 1) * (Math.PI * 2) / 7;
    balls.push({
      id: i,
      x: CANVAS_WIDTH - 150 + Math.cos(angle) * 30,
      y: CANVAS_HEIGHT / 2 + Math.sin(angle) * 30,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      color: '#FFD700',
      type: 'solid',
      pocketed: false,
    });
  }

  // Stripe balls (9-15) - red
  for (let i = 9; i <= 15; i++) {
    const angle = (i - 9) * (Math.PI * 2) / 7;
    balls.push({
      id: i,
      x: CANVAS_WIDTH - 100 + Math.cos(angle) * 35,
      y: CANVAS_HEIGHT / 2 + Math.sin(angle) * 35,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      color: '#FF4444',
      type: 'stripe',
      pocketed: false,
    });
  }

  return balls;
};

const pockets = [
  { x: 10, y: 10 },
  { x: CANVAS_WIDTH / 2, y: 10 },
  { x: CANVAS_WIDTH - 10, y: 10 },
  { x: 10, y: CANVAS_HEIGHT - 10 },
  { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 10 },
  { x: CANVAS_WIDTH - 10, y: CANVAS_HEIGHT - 10 },
];

export const PoolGameEngine = () => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>({
    balls: initializeBalls(),
    score: 0,
    pocketedBalls: 0,
    gameActive: false,
    currentPlayer: 0,
    turnCount: 0,
    players: [
      { id: user?.playerId || '1', name: user?.username || 'Player 1', balance: 1000, score: 0 },
      { id: '2', name: 'AI Player', balance: 1000, score: 0 },
    ],
  });

  const [gameState, setGameState] = useState<GameState>(gameStateRef.current);
  const [selectedPower, setSelectedPower] = useState(50);
  const [selectedAngle, setSelectedAngle] = useState(0);
  const [gameMessage, setGameMessage] = useState('Click "Break" to start the game');
  const animationRef = useRef<number>();

  const updatePhysics = () => {
    const state = gameStateRef.current;
    const balls = state.balls;

    // Apply friction
    balls.forEach((ball) => {
      if (!ball.pocketed) {
        ball.vx *= FRICTION;
        ball.vy *= FRICTION;

        // Update position
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Wall collisions
        if (ball.x - ball.radius < 0 || ball.x + ball.radius > CANVAS_WIDTH) {
          ball.vx *= -RESTITUTION;
          ball.x = Math.max(ball.radius, Math.min(CANVAS_WIDTH - ball.radius, ball.x));
        }
        if (ball.y - ball.radius < 0 || ball.y + ball.radius > CANVAS_HEIGHT) {
          ball.vy *= -RESTITUTION;
          ball.y = Math.max(ball.radius, Math.min(CANVAS_HEIGHT - ball.radius, ball.y));
        }

        // Stop very slow balls
        if (Math.abs(ball.vx) < 0.1) ball.vx = 0;
        if (Math.abs(ball.vy) < 0.1) ball.vy = 0;
      }
    });

    // Ball-ball collisions
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const b1 = balls[i];
        const b2 = balls[j];

        if (b1.pocketed || b2.pocketed) continue;

        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = b1.radius + b2.radius;

        if (dist < minDist) {
          // Resolve collision
          const angle = Math.atan2(dy, dx);
          const sin = Math.sin(angle);
          const cos = Math.cos(angle);

          // Swap velocities along collision axis
          const vx1 = b1.vx * cos + b1.vy * sin;
          const vy1 = b1.vy * cos - b1.vx * sin;
          const vx2 = b2.vx * cos + b2.vy * sin;
          const vy2 = b2.vy * cos - b2.vx * sin;

          b1.vx = vx2 * cos - vy1 * sin;
          b1.vy = vy1 * cos + vx2 * sin;
          b2.vx = vx1 * cos - vy2 * sin;
          b2.vy = vy2 * cos + vx1 * sin;

          // Separate balls
          const overlap = minDist - dist;
          b1.x -= overlap * cos / 2;
          b1.y -= overlap * sin / 2;
          b2.x += overlap * cos / 2;
          b2.y += overlap * sin / 2;
        }
      }
    }

    // Pocket detection
    pockets.forEach((pocket) => {
      balls.forEach((ball) => {
        if (ball.pocketed) return;

        const dx = ball.x - pocket.x;
        const dy = ball.y - pocket.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < POCKET_RADIUS) {
          ball.pocketed = true;
          ball.vx = 0;
          ball.vy = 0;

          if (ball.type !== 'cue') {
            state.score += ball.type === '8ball' ? 100 : 10;
            state.pocketedBalls += 1;
          }
        }
      });
    });

    setGameState({ ...state });
  };

  const animate = () => {
    updatePhysics();
    drawGame();
    animationRef.current = requestAnimationFrame(animate);
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0f5a2b';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw pockets
    pockets.forEach((pocket) => {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw balls
    gameStateRef.current.balls.forEach((ball) => {
      if (!ball.pocketed) {
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        // Ball number
        if (ball.id > 0) {
          ctx.fillStyle = ball.type === 'solid' ? '#000000' : '#FFFFFF';
          ctx.font = 'bold 8px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(ball.id), ball.x, ball.y);
        }
      }
    });

    // Draw borders
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 15;
    ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  };

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleBreak = () => {
    const cueBall = gameStateRef.current.balls[0];
    const power = selectedPower / 100;
    const angle = (selectedAngle * Math.PI) / 180;

    cueBall.vx = Math.cos(angle) * power * 10;
    cueBall.vy = Math.sin(angle) * power * 10;

    gameStateRef.current.gameActive = true;
    gameStateRef.current.turnCount += 1;
    setGameMessage(`Turn ${gameStateRef.current.turnCount}: Player ${gameStateRef.current.currentPlayer + 1}`);
    toast.success('Break! 🎱');
  };

  const handleReset = () => {
    gameStateRef.current = {
      balls: initializeBalls(),
      score: 0,
      pocketedBalls: 0,
      gameActive: false,
      currentPlayer: 0,
      turnCount: 0,
      players: gameStateRef.current.players,
    };
    setGameState(gameStateRef.current);
    setSelectedPower(50);
    setSelectedAngle(0);
    setGameMessage('Click "Break" to start the game');
  };

  const isMoving = gameStateRef.current.balls.some((b) => b.vx !== 0 || b.vy !== 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Game Canvas */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden bg-slate-950 border-slate-800">
            <CardContent className="p-4">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="w-full border-4 border-slate-700 rounded-lg bg-green-900"
              />

              {/* Controls */}
              <div className="mt-6 space-y-4">
                {/* Angle Control */}
                <div>
                  <label className="text-sm font-semibold text-white mb-2 block">
                    Shot Angle: {selectedAngle}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={selectedAngle}
                    onChange={(e) => setSelectedAngle(Number(e.target.value))}
                    disabled={isMoving || !gameStateRef.current.gameActive}
                    className="w-full"
                  />
                </div>

                {/* Power Control */}
                <div>
                  <label className="text-sm font-semibold text-white mb-2 block">
                    Shot Power: {selectedPower}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedPower}
                    onChange={(e) => setSelectedPower(Number(e.target.value))}
                    disabled={isMoving || !gameStateRef.current.gameActive}
                    className="w-full"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleBreak}
                    disabled={isMoving || gameStateRef.current.gameActive}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Break
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>

                {/* Status Message */}
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg text-center">
                  <p className="text-sm font-semibold text-white">{gameMessage}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Balls Pocketed: {gameStateRef.current.pocketedBalls} | Score: {gameStateRef.current.score}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Score */}
          <Card className="bg-slate-950 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-yellow-500 text-center">
                {gameStateRef.current.score}
              </div>
              <p className="text-xs text-slate-400 text-center mt-2">
                Balls: {gameStateRef.current.pocketedBalls}
              </p>
            </CardContent>
          </Card>

          {/* Players */}
          <Card className="bg-slate-950 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Players
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {gameStateRef.current.players.map((player, idx) => (
                <div
                  key={player.id}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all',
                    idx === gameStateRef.current.currentPlayer
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 bg-slate-800'
                  )}
                >
                  <p className="font-semibold text-white">{player.name}</p>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-bold text-yellow-500">
                        {player.balance.toLocaleString()}
                      </span>
                    </div>
                    <Badge variant="outline">{player.score} pts</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Game Info */}
          <Card className="bg-gradient-to-br from-blue-600 to-purple-600 border-none">
            <CardContent className="p-4 text-white space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide">Game Info</p>
              <div className="space-y-1 text-xs">
                <p>🎱 Ball type: Solid/Stripe</p>
                <p>8️⃣ Sink 8-ball to win</p>
                <p>🔄 Turn: {gameStateRef.current.turnCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
