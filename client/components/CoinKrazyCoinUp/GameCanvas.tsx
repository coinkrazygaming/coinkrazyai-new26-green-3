import React, { useEffect, useRef, forwardRef } from 'react';

interface SymbolValue {
  id: string;
  value: number;
  symbol: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface GameCanvasProps {
  reels: SymbolValue[][];
  isSpinning: boolean;
  onSpinComplete?: () => void;
}

// Color scheme for rarity levels
const RARITY_COLORS: Record<string, string> = {
  common: '#fbbf24',      // amber
  rare: '#3b82f6',        // blue
  epic: '#a855f7',        // purple
  legendary: '#dc2626',   // red
};

const RARITY_GLOW: Record<string, string> = {
  common: '#fca5a5',
  rare: '#60a5fa',
  epic: '#d8b4fe',
  legendary: '#fca5a5',
};

const GameCanvas = forwardRef<HTMLCanvasElement, GameCanvasProps>(
  ({ reels, isSpinning, onSpinComplete }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const spinProgressRef = useRef<number>(0);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      const updateCanvasSize = () => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      };

      updateCanvasSize();
      window.addEventListener('resize', updateCanvasSize);

      // Animation loop
      const animate = () => {
        const width = canvas.width / window.devicePixelRatio;
        const height = canvas.height / window.devicePixelRatio;

        // Clear canvas with gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#0f0f1e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Draw lightning effect in background
        if (Math.random() < 0.02) {
          drawLightning(ctx, width, height);
        }

        // Draw reels
        drawReels(ctx, width, height);

        // Update spin animation
        if (isSpinning) {
          spinProgressRef.current = Math.min(spinProgressRef.current + 0.05, 1);
        } else {
          spinProgressRef.current = Math.max(spinProgressRef.current - 0.05, 0);
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        window.removeEventListener('resize', updateCanvasSize);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [isSpinning]);

    const drawReels = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const cellSize = Math.min(width / 4, height / 4);
      const startX = (width - cellSize * 3) / 2;
      const startY = (height - cellSize * 3) / 2;

      // Draw 3x3 grid
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const x = startX + col * cellSize;
          const y = startY + row * cellSize + (isSpinning ? Math.sin(spinProgressRef.current * Math.PI * 4) * 10 : 0);

          const symbol = reels[col]?.[row];

          // Draw cell background
          const gradient = ctx.createLinearGradient(x, y, x, y + cellSize);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
          gradient.addColorStop(1, 'rgba(139, 92, 246, 0.2)');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, cellSize, cellSize);

          // Draw border with glow
          if (symbol) {
            const glowColor = RARITY_GLOW[symbol.rarity];
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 3;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          } else {
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
            ctx.lineWidth = 2;
          }

          ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
          ctx.shadowColor = 'transparent';

          // Draw symbol
          if (symbol) {
            ctx.fillStyle = RARITY_COLORS[symbol.rarity];
            ctx.font = `bold ${cellSize * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const centerX = x + cellSize / 2;
            const centerY = y + cellSize / 2;

            // Add glow effect to symbol
            ctx.shadowColor = RARITY_GLOW[symbol.rarity];
            ctx.shadowBlur = 10;
            ctx.fillText(symbol.symbol, centerX, centerY);
            ctx.shadowColor = 'transparent';

            // Draw value text
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = `bold ${cellSize * 0.15}px Arial`;
            ctx.fillText(`${symbol.value} SC`, centerX, centerY + cellSize * 0.3);
          }
        }
      }

      // Draw middle row highlight
      const cellSize2 = Math.min(width / 4, height / 4);
      const startX2 = (width - cellSize2 * 3) / 2;
      const startY2 = (height - cellSize2 * 3) / 2;
      const midY = startY2 + cellSize2;

      ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(startX2 - 10, midY - 5, cellSize2 * 3 + 20, cellSize2 + 10);
      ctx.setLineDash([]);
    };

    const drawLightning = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const startX = Math.random() * width;
      const startY = 0;
      const endX = Math.random() * width;
      const endY = height;

      ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(34, 197, 94, 0.8)';
      ctx.shadowBlur = 20;

      ctx.beginPath();
      ctx.moveTo(startX, startY);

      let currentX = startX;
      let currentY = startY;

      while (currentY < endY) {
        const nextY = currentY + Math.random() * 40 + 20;
        const nextX = currentX + (Math.random() - 0.5) * 60;

        ctx.lineTo(nextX, nextY);
        currentX = nextX;
        currentY = nextY;
      }

      ctx.stroke();
      ctx.shadowColor = 'transparent';
    };

    return (
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
        style={{ imageRendering: 'pixelated' }}
      />
    );
  }
);

GameCanvas.displayName = 'GameCanvas';

export default GameCanvas;
