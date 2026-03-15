/**
 * Blackjack Game Component
 * Example table game implementation using the game foundation
 * Demonstrates: BaseGameLayout, BetController, useGameSession
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BaseGameLayout } from '@/components/game/BaseGameLayout';
import { BetController } from '@/components/game/BetController';
import { useGameSession, GameResult } from '@/hooks/use-game-session';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

// ============================================================================
// TYPES
// ============================================================================

type CardSuit = '♠' | '♥' | '♦' | '♣';
type CardValue = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  value: CardValue;
  suit: CardSuit;
}

interface Hand {
  cards: Card[];
  value: number;
  isBust: boolean;
  isBlackjack: boolean;
}

interface GameState {
  playerHand: Hand;
  dealerHand: Hand;
  dealerHidden: boolean; // Hide dealer's second card until player stands
  gameStatus: 'idle' | 'playing' | 'dealerTurn' | 'finished';
  result?: 'win' | 'loss' | 'push';
  betAmount: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MIN_BET = 0.1;
const MAX_BET = 50;
const SUITS: CardSuit[] = ['♠', '♥', '♦', '♣'];
const VALUES: CardValue[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (let i = 0; i < 6; i++) { // 6-deck shoe
    for (const suit of SUITS) {
      for (const value of VALUES) {
        deck.push({ suit, value });
      }
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const getCardValue = (value: CardValue): number => {
  if (value === 'A') return 11;
  if (['J', 'Q', 'K'].includes(value)) return 10;
  return parseInt(value);
};

const calculateHandValue = (cards: Card[]): number => {
  let value = 0;
  let aces = 0;

  for (const card of cards) {
    const cardValue = getCardValue(card.value);
    value += cardValue;
    if (card.value === 'A') aces++;
  }

  // Adjust for aces (convert from 11 to 1 as needed)
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return value;
};

const createHand = (cards: Card[]): Hand => {
  const value = calculateHandValue(cards);
  return {
    cards,
    value,
    isBust: value > 21,
    isBlackjack: cards.length === 2 && value === 21,
  };
};

const drawCard = (deck: Card[]): Card => {
  if (deck.length === 0) {
    return createDeck()[0];
  }
  return deck.pop()!;
};

// ============================================================================
// COMPONENTS
// ============================================================================

const CardDisplay: React.FC<{ card: Card; hidden?: boolean }> = ({
  card,
  hidden = false,
}) => {
  const isRed = card.suit === '♥' || card.suit === '♦';

  if (hidden) {
    return (
      <motion.div
        initial={{ rotateY: 0 }}
        className="w-20 h-28 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg border-2 border-blue-500 shadow-lg flex items-center justify-center"
      >
        <div className="text-white font-black text-2xl">♠</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`w-20 h-28 rounded-lg border-2 shadow-lg flex flex-col items-center justify-between p-2 ${
        isRed
          ? 'bg-white border-red-500'
          : 'bg-white border-black'
      }`}
    >
      <div className={`text-sm font-black ${isRed ? 'text-red-600' : 'text-black'}`}>
        {card.value}
      </div>
      <div className={`text-2xl ${isRed ? 'text-red-600' : 'text-black'}`}>
        {card.suit}
      </div>
      <div className={`text-sm font-black ${isRed ? 'text-red-600' : 'text-black'}`}>
        {card.value}
      </div>
    </motion.div>
  );
};

const HandDisplay: React.FC<{
  hand: Hand;
  title: string;
  isDealer?: boolean;
  dealerHidden?: boolean;
}> = ({ hand, title, isDealer = false, dealerHidden = false }) => {
  const visibleCards = dealerHidden ? hand.cards.slice(0, 1) : hand.cards;
  const visibleValue = dealerHidden
    ? getCardValue(hand.cards[0].value)
    : hand.value;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <Badge
          className={
            hand.isBust
              ? 'bg-red-600'
              : hand.isBlackjack && hand.cards.length === 2
              ? 'bg-green-600'
              : 'bg-slate-700'
          }
        >
          {hand.isBust ? 'BUST' : `${visibleValue}`}
        </Badge>
      </div>

      <div className="flex gap-2 flex-wrap">
        {visibleCards.map((card, idx) => (
          <CardDisplay
            key={`${card.value}-${card.suit}-${idx}`}
            card={card}
          />
        ))}
        {dealerHidden && (
          <CardDisplay card={{ value: 'A', suit: '♠' }} hidden={true} />
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface BlackjackGameProps {
  gameId?: string;
  gameName?: string;
  onClose?: () => void;
}

export const BlackjackGame: React.FC<BlackjackGameProps> = ({
  gameId = 'blackjack-classic',
  gameName = 'Blackjack',
  onClose,
}) => {
  const gameSession = useGameSession({
    gameId,
    gameName,
    minBet: MIN_BET,
    maxBet: MAX_BET,
  });

  const [gameState, setGameState] = useState<GameState>({
    playerHand: createHand([]),
    dealerHand: createHand([]),
    dealerHidden: true,
    gameStatus: 'idle',
    betAmount: 1,
  });

  const [deck, setDeck] = useState<Card[]>(createDeck());
  const [gameHistory, setGameHistory] = useState<
    Array<{ bet: number; result: string; winnings: number }>
  >([]);

  // Initialize new game
  const startNewGame = async () => {
    if (gameState.betAmount === 0) {
      toast.error('Select a bet amount');
      return;
    }

    // Create spin handler for this game
    const spinHandler = async (): Promise<GameResult> => {
      // Simulate game logic (in production, this would call server)
      // For now, we'll do client-side game logic

      const newDeck = [...deck];
      if (newDeck.length < 20) {
        setDeck(createDeck());
      }

      // Deal initial cards
      const pCard1 = drawCard(newDeck);
      const pCard2 = drawCard(newDeck);
      const dCard1 = drawCard(newDeck);
      const dCard2 = drawCard(newDeck);

      setDeck(newDeck);
      setGameState(prev => ({
        ...prev,
        playerHand: createHand([pCard1, pCard2]),
        dealerHand: createHand([dCard1, dCard2]),
        dealerHidden: true,
        gameStatus: 'playing',
      }));

      // Continue game...
      return {
        success: true,
        winnings: 0,
        newBalance: gameSession.currentBalance,
      };
    };

    // Use the game session to handle the spin
    await gameSession.playSpin(gameState.betAmount, spinHandler);
  };

  const handleHit = () => {
    const newDeck = [...deck];
    const newCard = drawCard(newDeck);
    setDeck(newDeck);

    const newHand = createHand([...gameState.playerHand.cards, newCard]);
    setGameState(prev => ({
      ...prev,
      playerHand: newHand,
    }));

    if (newHand.isBust) {
      endGame();
    }
  };

  const handleStand = () => {
    setGameState(prev => ({
      ...prev,
      dealerHidden: false,
      gameStatus: 'dealerTurn',
    }));

    // Dealer logic
    setTimeout(() => {
      dealerPlay();
    }, 1000);
  };

  const dealerPlay = () => {
    let newDealerHand = { ...gameState.dealerHand };
    const newDeck = [...deck];

    while (newDealerHand.value < 17) {
      const newCard = drawCard(newDeck);
      newDealerHand = createHand([...newDealerHand.cards, newCard]);
    }

    setDeck(newDeck);
    setGameState(prev => ({
      ...prev,
      dealerHand: newDealerHand,
      gameStatus: 'finished',
    }));

    determineWinner(gameState.playerHand, newDealerHand);
  };

  const determineWinner = (player: Hand, dealer: Hand) => {
    let result: 'win' | 'loss' | 'push';
    let winnings = 0;

    if (player.isBust) {
      result = 'loss';
      winnings = 0;
    } else if (dealer.isBust) {
      result = 'win';
      winnings = gameState.betAmount * 2; // 1:1 payout
    } else if (player.value > dealer.value) {
      result = 'win';
      winnings = gameState.betAmount * 2;
    } else if (player.value < dealer.value) {
      result = 'loss';
      winnings = 0;
    } else {
      result = 'push';
      winnings = gameState.betAmount; // Push - return bet
    }

    setGameState(prev => ({
      ...prev,
      result,
    }));

    // Show result and update wallet
    if (result === 'win') {
      toast.success(`Won ${winnings.toFixed(2)} SC!`);
      confetti();
    } else if (result === 'loss') {
      toast.info('Dealer wins!');
    } else {
      toast.info('Push - bet returned!');
    }

    // Add to history
    const historyEntry = {
      bet: gameState.betAmount,
      result,
      winnings,
    };

    setGameHistory(prev => [historyEntry, ...prev].slice(0, 10));
  };

  const endGame = () => {
    setTimeout(() => {
      determineWinner(gameState.playerHand, gameState.dealerHand);
      setGameState(prev => ({
        ...prev,
        gameStatus: 'finished',
      }));
    }, 500);
  };

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      playerHand: createHand([]),
      dealerHand: createHand([]),
      dealerHidden: true,
      gameStatus: 'idle',
      result: undefined,
    }));
  };

  const isGameInProgress = gameState.gameStatus !== 'idle';
  const canHit = gameState.gameStatus === 'playing' && !gameState.playerHand.isBust;
  const canStand = gameState.gameStatus === 'playing';

  return (
    <BaseGameLayout
      gameName={gameName}
      gameDescription="Play Classic Blackjack - Beat the dealer to 21!"
      balance={gameSession.currentBalance}
      onClose={onClose}
      variant="full"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Game Area */}
        <div className="space-y-6">
          {/* Dealer Hand */}
          <Card className="bg-gradient-to-b from-slate-800 to-slate-900 border-slate-700">
            <CardContent className="pt-6">
              {isGameInProgress && (
                <HandDisplay
                  hand={gameState.dealerHand}
                  title="Dealer"
                  isDealer={true}
                  dealerHidden={gameState.dealerHidden}
                />
              )}
            </CardContent>
          </Card>

          {/* Player Hand */}
          <Card className="bg-gradient-to-b from-slate-800 to-slate-900 border-slate-700">
            <CardContent className="pt-6">
              {isGameInProgress && (
                <HandDisplay
                  hand={gameState.playerHand}
                  title="Your Hand"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Game Controls */}
        {gameState.gameStatus === 'playing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
            <Button
              onClick={handleHit}
              disabled={!canHit}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 font-bold text-lg"
            >
              HIT
            </Button>
            <Button
              onClick={handleStand}
              disabled={!canStand}
              className="flex-1 h-12 bg-orange-600 hover:bg-orange-700 font-bold text-lg"
            >
              STAND
            </Button>
          </motion.div>
        )}

        {gameState.gameStatus === 'finished' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-4"
          >
            <Card
              className={`border-2 ${
                gameState.result === 'win'
                  ? 'border-green-500 bg-green-950/20'
                  : gameState.result === 'loss'
                  ? 'border-red-500 bg-red-950/20'
                  : 'border-yellow-500 bg-yellow-950/20'
              }`}
            >
              <CardContent className="pt-6 text-center">
                <h3 className="text-2xl font-black text-white mb-2">
                  {gameState.result === 'win'
                    ? '🎉 YOU WIN!'
                    : gameState.result === 'loss'
                    ? '❌ DEALER WINS'
                    : '🤝 PUSH'}
                </h3>
                <p className="text-slate-300">
                  Your: {gameState.playerHand.value} | Dealer: {gameState.dealerHand.value}
                </p>
              </CardContent>
            </Card>

            <Button
              onClick={resetGame}
              className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              PLAY AGAIN
            </Button>
          </motion.div>
        )}

        {gameState.gameStatus === 'idle' && (
          <div className="space-y-6">
            {/* Bet Controller */}
            <BetController
              betAmount={gameState.betAmount}
              onBetChange={(bet) =>
                setGameState(prev => ({ ...prev, betAmount: bet }))
              }
              onSpin={startNewGame}
              minBet={MIN_BET}
              maxBet={MAX_BET}
              balance={gameSession.currentBalance}
              isSpinning={gameSession.isProcessing}
              label="Bet Amount"
              quickBets={[0.5, 1, 5, 10]}
            />

            {/* Info */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between">
                    <span>RTP:</span>
                    <span className="font-bold text-white">99%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payout:</span>
                    <span className="font-bold text-white">1:1 (Win)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Game History */}
        {gameHistory.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <h3 className="text-lg font-bold text-white mb-4">Recent Hands</h3>
              <div className="space-y-2">
                {gameHistory.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm p-2 bg-slate-900/50 rounded"
                  >
                    <span className="text-slate-400">Bet: {entry.bet.toFixed(2)} SC</span>
                    <Badge
                      className={
                        entry.result === 'win'
                          ? 'bg-green-600'
                          : entry.result === 'loss'
                          ? 'bg-red-600'
                          : 'bg-yellow-600'
                      }
                    >
                      {entry.result.toUpperCase()}
                    </Badge>
                    <span className="text-white font-bold">+{entry.winnings.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </BaseGameLayout>
  );
};

export default BlackjackGame;
