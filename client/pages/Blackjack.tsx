import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

interface PlayingCard {
  suit: string;
  rank: string;
}

const getCardValue = (rank: string): number => {
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  if (rank === 'A') return 11;
  return parseInt(rank);
};

const calculateHand = (hand: PlayingCard[]): number => {
  let total = hand.reduce((sum, card) => sum + getCardValue(card.rank), 0);
  const aces = hand.filter(c => c.rank === 'A').length;

  // Adjust for aces
  while (total > 21 && aces > 0) {
    total -= 10;
  }

  return total;
};

const createDeck = (): PlayingCard[] => {
  const deck: PlayingCard[] = [];
  for (let suit of suits) {
    for (let rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const Blackjack = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(1000);
  const [betAmount, setBetAmount] = useState(50);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'over'>('betting');
  const [deck, setDeck] = useState<PlayingCard[]>(createDeck());
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [dealerHand, setDealerHand] = useState<PlayingCard[]>([]);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<'win' | 'loss' | 'push' | null>(null);
  const [winAmount, setWinAmount] = useState(0);
  const [stats, setStats] = useState({ wins: 0, losses: 0, pushes: 0 });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const drawCard = (hand: PlayingCard[], newDeck: PlayingCard[]): [PlayingCard[], PlayingCard[]] => {
    if (newDeck.length === 0) {
      newDeck = createDeck();
    }
    const card = newDeck.pop()!;
    return [[...hand, card], newDeck];
  };

  const startGame = () => {
    if (betAmount <= 0 || betAmount > balance) {
      toast.error('Invalid bet amount');
      return;
    }

    let newDeck = [...deck];
    let player: PlayingCard[] = [];
    let dealer: PlayingCard[] = [];

    // Deal initial cards
    [player, newDeck] = drawCard(player, newDeck);
    [dealer, newDeck] = drawCard(dealer, newDeck);
    [player, newDeck] = drawCard(player, newDeck);
    [dealer, newDeck] = drawCard(dealer, newDeck);

    setDeck(newDeck);
    setPlayerHand(player);
    setDealerHand(dealer);
    setGameState('playing');
    setMessage('Your turn - Hit or Stand?');
    setResult(null);
    setWinAmount(0);
  };

  const hit = () => {
    let [newPlayer, newDeck] = drawCard(playerHand, deck);
    const newTotal = calculateHand(newPlayer);

    setPlayerHand(newPlayer);
    setDeck(newDeck);

    if (newTotal > 21) {
      endGame('dealer', newTotal);
    }
  };

  const stand = () => {
    let newDealer = [...dealerHand];
    let newDeck = [...deck];
    let dealerTotal = calculateHand(newDealer);
    const playerTotal = calculateHand(playerHand);

    // Dealer hits on 16, stands on 17+
    while (dealerTotal < 17) {
      [newDealer, newDeck] = drawCard(newDealer, newDeck);
      dealerTotal = calculateHand(newDealer);
    }

    setDealerHand(newDealer);
    setDeck(newDeck);

    // Determine winner
    if (dealerTotal > 21) {
      endGame('player', dealerTotal);
    } else if (playerTotal > dealerTotal) {
      endGame('player', dealerTotal);
    } else if (dealerTotal > playerTotal) {
      endGame('dealer', dealerTotal);
    } else {
      endGame('push', dealerTotal);
    }
  };

  const endGame = (winner: 'player' | 'dealer' | 'push', dealerTotal: number) => {
    const playerTotal = calculateHand(playerHand);
    let newBalance = balance;
    let newResult: 'win' | 'loss' | 'push' = 'loss';
    let newWinAmount = 0;

    if (winner === 'player') {
      newBalance = balance + betAmount * 2;
      newWinAmount = betAmount * 2;
      newResult = 'win';
      setMessage(`You won! ${playerTotal} vs ${dealerTotal}`);
      toast.success(`You won ${betAmount * 2} SC!`);
    } else if (winner === 'push') {
      newBalance = balance + betAmount;
      newWinAmount = betAmount;
      newResult = 'push';
      setMessage(`Push! Both have ${playerTotal}`);
      toast.info('Push - Your bet is returned');
    } else {
      newBalance = balance - betAmount;
      newResult = 'loss';
      setMessage(`Dealer wins! You: ${playerTotal}, Dealer: ${dealerTotal}`);
      toast.error(`Dealer wins! You lost ${betAmount} SC`);
    }

    setBalance(newBalance);
    setWinAmount(newWinAmount);
    setResult(newResult);
    setGameState('over');
    setStats({
      wins: stats.wins + (newResult === 'win' ? 1 : 0),
      losses: stats.losses + (newResult === 'loss' ? 1 : 0),
      pushes: stats.pushes + (newResult === 'push' ? 1 : 0)
    });
  };

  const reset = () => {
    setGameState('betting');
    setPlayerHand([]);
    setDealerHand([]);
    setMessage('');
    setDeck(createDeck());
  };

  const renderCard = (card: PlayingCard | null, hidden = false) => {
    if (!card) return null;

    return (
      <div className="w-16 h-24 bg-white rounded-lg border-2 border-black flex items-center justify-center text-center flex-col gap-1 shadow-lg">
        {!hidden ? (
          <>
            <span className="text-2xl font-black">{card.rank}</span>
            <span className="text-lg font-black">{card.suit}</span>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 rounded" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <Button variant="ghost" asChild className="mb-4">
        <Link to="/">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lobby
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Game */}
        <div className="lg:col-span-3 space-y-6">
          <h1 className="text-4xl font-black text-white">BLACKJACK</h1>

          {/* Game Area */}
          <Card className="bg-gradient-to-b from-green-800 to-green-900 border-2 border-green-600">
            <CardContent className="p-8 space-y-8">
              {/* Dealer Area */}
              <div>
                <p className="text-white font-bold mb-4">DEALER</p>
                <div className="flex gap-2 items-center">
                  <div className="flex gap-2">
                    {dealerHand.map((card, idx) => (
                      <div key={idx}>
                        {gameState === 'playing' && idx === 1
                          ? renderCard(null, true)
                          : renderCard(card)}
                      </div>
                    ))}
                  </div>
                  {gameState !== 'betting' && (
                    <div className="text-white font-black">
                      {gameState === 'playing' && dealerHand.length > 1
                        ? `${calculateHand([dealerHand[0]])}+`
                        : `${calculateHand(dealerHand)}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t-2 border-white/30"></div>

              {/* Player Area */}
              <div>
                <p className="text-white font-bold mb-4">YOU</p>
                <div className="flex gap-2 items-center">
                  <div className="flex gap-2">
                    {playerHand.map((card, idx) => (
                      <div key={idx}>{renderCard(card)}</div>
                    ))}
                  </div>
                  {playerHand.length > 0 && (
                    <div className="text-white font-black text-2xl">
                      {calculateHand(playerHand)}
                    </div>
                  )}
                </div>
              </div>

              {/* Message */}
              {message && (
                <div className="bg-yellow-500 text-black p-4 rounded font-bold text-center">
                  {message}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 justify-center">
                {gameState === 'betting' && (
                  <Button
                    onClick={startGame}
                    className="h-14 px-8 bg-yellow-500 hover:bg-yellow-600 text-black font-black text-lg"
                  >
                    DEAL
                  </Button>
                )}
                {gameState === 'playing' && (
                  <>
                    <Button
                      onClick={hit}
                      className="h-14 px-8 bg-blue-600 hover:bg-blue-700"
                    >
                      HIT
                    </Button>
                    <Button
                      onClick={stand}
                      className="h-14 px-8 bg-purple-600 hover:bg-purple-700"
                    >
                      STAND
                    </Button>
                  </>
                )}
                {gameState === 'over' && (
                  <Button
                    onClick={reset}
                    className="h-14 px-8 bg-green-600 hover:bg-green-700 text-white font-black"
                  >
                    PLAY AGAIN
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Balance */}
          <Card className="bg-gradient-to-br from-yellow-600 to-orange-600 border-none">
            <CardContent className="p-6 text-white">
              <p className="text-sm font-bold uppercase mb-2">Balance</p>
              <p className="text-4xl font-black">{balance.toLocaleString()} SC</p>
            </CardContent>
          </Card>

          {/* Betting */}
          {gameState === 'betting' && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Bet Amount</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                  className="bg-slate-800 border-slate-700"
                />
                <div className="grid grid-cols-2 gap-2">
                  {[10, 50, 100, 500].map((amount) => (
                    <Button
                      key={amount}
                      onClick={() => setBetAmount(amount)}
                      variant="outline"
                      size="sm"
                    >
                      {amount} SC
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Result */}
          {result && (
            <Card
              className={`border-2 ${
                result === 'win'
                  ? 'bg-green-500/20 border-green-500'
                  : result === 'loss'
                  ? 'bg-red-500/20 border-red-500'
                  : 'bg-yellow-500/20 border-yellow-500'
              }`}
            >
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-black text-white">
                  {result === 'win'
                    ? '🎉 WIN!'
                    : result === 'loss'
                    ? '❌ LOSS'
                    : '🤝 PUSH'}
                </p>
                {winAmount > 0 && (
                  <p className="text-xl font-bold text-white mt-2">
                    {winAmount} SC
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg">Session Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-400 font-bold">Wins:</span>
                <span className="text-white font-black">{stats.wins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-400 font-bold">Losses:</span>
                <span className="text-white font-black">{stats.losses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-400 font-bold">Pushes:</span>
                <span className="text-white font-black">{stats.pushes}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Blackjack;
