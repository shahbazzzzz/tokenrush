import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Sparkles, Target, TrendingUp, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { useSound } from '../../hooks/useSound';

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

interface DiceHistory {
  playerChoice: number;
  diceResult: number;
  won: boolean;
  profit: number;
  multiplier: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export const DiceHeroGame = () => {
  const navigate = useNavigate();
  const { playWinSound, playLoseSound, playClickSound, playCoinSound, vibrate } = useSound();
  
  // Game states
  const [betAmount, setBetAmount] = useState(10);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([6]);
  const [isRolling, setIsRolling] = useState(false);
  const [currentDice, setCurrentDice] = useState(1);
  const [finalDice, setFinalDice] = useState<number | null>(null);
  const [history, setHistory] = useState<DiceHistory[]>([]);
  const [winStreak, setWinStreak] = useState(0);
  const [luckyNumber, setLuckyNumber] = useState<number | null>(null);
  const [totalWinnings, setTotalWinnings] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 'first_win', name: 'First Victory', description: 'Win your first dice roll', icon: '🎯', unlocked: false },
    { id: 'lucky_7', name: 'Lucky Seven', description: 'Win 7 times in a row', icon: '🍀', unlocked: false },
    { id: 'high_roller', name: 'High Roller', description: 'Win with a 100+ token bet', icon: '💎', unlocked: false },
    { id: 'perfect_predict', name: 'Perfect Predictor', description: 'Win 3 exact predictions in a row', icon: '🔮', unlocked: false },
  ]);
  
  // Special modes
  const [doubleOrNothing, setDoubleOrNothing] = useState(false);
  const [bonusMultiplier, setBonusMultiplier] = useState(1);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlayCount, setAutoPlayCount] = useState(0);

  // Calculate multiplier based on selected numbers
  const calculateMultiplier = useCallback(() => {
    const baseMultiplier = 6 / selectedNumbers.length;
    const streakBonus = Math.min(winStreak * 0.1, 0.5); // Up to 50% bonus
    const luckyBonus = luckyNumber && selectedNumbers.includes(luckyNumber) ? 0.2 : 0;
    return Number((baseMultiplier * (1 + streakBonus + luckyBonus) * bonusMultiplier).toFixed(2));
  }, [selectedNumbers, winStreak, luckyNumber, bonusMultiplier]);

  // Toggle number selection
  const toggleNumber = useCallback((num: number) => {
    if (isRolling) return;
    playClickSound();
    
    setSelectedNumbers(prev => {
      if (prev.includes(num)) {
        // Don't allow deselecting all numbers
        if (prev.length === 1) return prev;
        return prev.filter(n => n !== num);
      } else {
        return [...prev, num];
      }
    });
  }, [isRolling, playClickSound]);

  // Roll dice animation
  const rollDice = useCallback(async () => {
    if (selectedNumbers.length === 0) {
      toast.error('Select at least one number!');
      return;
    }

    playClickSound();
    setIsRolling(true);
    setFinalDice(null);
    
    // Animate rolling
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      setCurrentDice(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      
      // Add sound effect for each roll
      if (rollCount % 3 === 0) {
        playClickSound();
      }
      
      if (rollCount >= 15) {
        clearInterval(rollInterval);
        
        // Determine final result
        const result = Math.floor(Math.random() * 6) + 1;
        setFinalDice(result);
        setCurrentDice(result);
        
        // Check win
        const won = selectedNumbers.includes(result);
        const multiplier = calculateMultiplier();
        const profit = won ? Math.floor(betAmount * multiplier - betAmount) : -betAmount;
        
        if (won) {
          // Win effects
          playWinSound();
          playCoinSound();
          vibrate([50, 30, 100]);
          
          const newStreak = winStreak + 1;
          setWinStreak(newStreak);
          setTotalWinnings(prev => prev + profit);
          
          // Check achievements
          checkAchievements(newStreak, betAmount);
          
          // Special effects for big wins
          if (multiplier >= 5) {
            toast.success(`🎉 MEGA WIN! ${profit} tokens at ${multiplier}x!`, {
              duration: 5000,
            });
            setBonusMultiplier(1.5); // Temporary bonus
            setTimeout(() => setBonusMultiplier(1), 10000);
          } else {
            toast.success(`Won ${profit} tokens at ${multiplier}x!`, {
              icon: '🎲',
            });
          }
          
          // Double or nothing opportunity
          if (profit > betAmount && Math.random() < 0.3) {
            setDoubleOrNothing(true);
          }
        } else {
          // Lose effects
          playLoseSound();
          vibrate(200);
          setWinStreak(0);
          setBonusMultiplier(1);
          
          toast.error(`Lost ${betAmount} tokens. The dice showed ${result}`, {
            icon: '😔',
          });
        }
        
        // Add to history
        setHistory(prev => [{
          playerChoice: selectedNumbers[0], // For simplicity, show first choice
          diceResult: result,
          won,
          profit,
          multiplier,
        }, ...prev.slice(0, 9)]);
        
        setIsRolling(false);
        
        // Auto play
        if (autoPlay && autoPlayCount > 0) {
          setAutoPlayCount(prev => prev - 1);
          if (autoPlayCount > 1) {
            setTimeout(() => rollDice(), 2000);
          } else {
            setAutoPlay(false);
          }
        }
      }
    }, 100);
  }, [selectedNumbers, betAmount, winStreak, autoPlay, autoPlayCount, 
      calculateMultiplier, playClickSound, playWinSound, playLoseSound, playCoinSound, vibrate]);

  // Check and unlock achievements
  const checkAchievements = useCallback((streak: number, bet: number) => {
    setAchievements(prev => prev.map(achievement => {
      if (achievement.unlocked) return achievement;
      
      let shouldUnlock = false;
      switch (achievement.id) {
        case 'first_win':
          shouldUnlock = true;
          break;
        case 'lucky_7':
          shouldUnlock = streak >= 7;
          break;
        case 'high_roller':
          shouldUnlock = bet >= 100;
          break;
        case 'perfect_predict':
          shouldUnlock = streak >= 3 && selectedNumbers.length === 1;
          break;
      }
      
      if (shouldUnlock) {
        toast.success(`Achievement Unlocked: ${achievement.name}!`, {
          icon: achievement.icon,
          duration: 5000,
        });
        playCoinSound();
        return { ...achievement, unlocked: true };
      }
      
      return achievement;
    }));
  }, [selectedNumbers, playCoinSound]);

  // Double or nothing mini-game
  const handleDoubleOrNothing = useCallback((accept: boolean) => {
    if (accept) {
      const won = Math.random() < 0.5;
      if (won) {
        const bonus = history[0].profit;
        setTotalWinnings(prev => prev + bonus);
        playWinSound();
        toast.success(`Doubled! Won additional ${bonus} tokens!`, { icon: '💰' });
      } else {
        setTotalWinnings(prev => prev - history[0].profit);
        playLoseSound();
        toast.error(`Lost the double or nothing!`, { icon: '💔' });
      }
    }
    setDoubleOrNothing(false);
  }, [history, playWinSound, playLoseSound]);

  // Set lucky number periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const newLucky = Math.floor(Math.random() * 6) + 1;
      setLuckyNumber(newLucky);
      toast.info(`Lucky number is now ${newLucky}! Get bonus multiplier!`, {
        icon: '⭐',
      });
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Quick bet presets
  const quickBets = [5, 10, 25, 50, 100, 250];
  
  // Betting strategies
  const strategies = [
    { name: 'Safe', numbers: [1, 2, 3, 4, 5], color: 'from-green-500 to-emerald-500' },
    { name: 'Balanced', numbers: [2, 4, 6], color: 'from-blue-500 to-cyan-500' },
    { name: 'Risky', numbers: [6], color: 'from-red-500 to-pink-500' },
    { name: 'Lucky', numbers: luckyNumber ? [luckyNumber] : [1], color: 'from-yellow-500 to-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-game-gradient p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        
        <h1 className="text-2xl font-bold text-white">DiceHero</h1>
        
        <div className="flex items-center gap-2">
          {winStreak > 0 && (
            <div className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
              <span className="text-xs font-bold text-white">🔥 {winStreak} Streak</span>
            </div>
          )}
          {bonusMultiplier > 1 && (
            <div className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
              <span className="text-xs font-bold text-white">
                <Sparkles className="w-3 h-3 inline mr-1" />
                {bonusMultiplier}x Bonus
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Dice Display */}
      <div className="bg-slate/50 rounded-2xl p-8 mb-6 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-20 h-20 border border-turquoise/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + i}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>

        {/* Main dice */}
        <div className="relative z-10 flex flex-col items-center">
          <AnimatePresence mode="wait">
            {isRolling ? (
              <motion.div
                key="rolling"
                animate={{
                  rotateX: [0, 360],
                  rotateY: [0, 360],
                  rotateZ: [0, 360],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="w-24 h-24 bg-gradient-to-br from-white to-gray-200 rounded-2xl flex items-center justify-center shadow-2xl"
              >
                {React.createElement(diceIcons[currentDice - 1], {
                  className: "w-16 h-16 text-midnight",
                })}
              </motion.div>
            ) : finalDice ? (
              <motion.div
                key={finalDice}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className={`w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl ${
                  selectedNumbers.includes(finalDice)
                    ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                    : 'bg-gradient-to-br from-red-400 to-pink-500'
                }`}
              >
                {React.createElement(diceIcons[finalDice - 1], {
                  className: "w-16 h-16 text-white",
                })}
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 bg-gradient-to-br from-turquoise to-teal-500 rounded-2xl flex items-center justify-center shadow-2xl"
              >
                <span className="text-4xl">🎲</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result display */}
          {finalDice && !isRolling && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mt-4 text-center"
            >
              <p className={`text-2xl font-bold ${
                selectedNumbers.includes(finalDice) ? 'text-green-400' : 'text-red-400'
              }`}>
                {selectedNumbers.includes(finalDice) 
                  ? `+${Math.floor(betAmount * calculateMultiplier() - betAmount)} tokens!`
                  : `-${betAmount} tokens`
                }
              </p>
            </motion.div>
          )}
        </div>

        {/* Lucky number indicator */}
        {luckyNumber && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-yellow-500/20 rounded-full">
            <span className="text-xs font-bold text-yellow-400">
              Lucky: {luckyNumber} ⭐
            </span>
          </div>
        )}
      </div>

      {/* Number Selection */}
      <div className="bg-slate/50 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-300">Select Numbers</span>
          <span className="text-sm font-bold text-turquoise">
            Multiplier: {calculateMultiplier()}x
          </span>
        </div>
        
        <div className="grid grid-cols-6 gap-2 mb-3">
          {[1, 2, 3, 4, 5, 6].map(num => {
            const DiceIcon = diceIcons[num - 1];
            const isLucky = num === luckyNumber;
            
            return (
              <button
                key={num}
                onClick={() => toggleNumber(num)}
                disabled={isRolling}
                className={`aspect-square rounded-lg transition-all relative ${
                  selectedNumbers.includes(num)
                    ? 'bg-turquoise text-midnight scale-105'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                } disabled:cursor-not-allowed`}
              >
                <DiceIcon className="w-full h-full p-2" />
                {isLucky && (
                  <span className="absolute -top-1 -right-1 text-xs">⭐</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick strategies */}
        <div className="flex gap-2">
          {strategies.map(strategy => (
            <button
              key={strategy.name}
              onClick={() => {
                setSelectedNumbers(strategy.numbers);
                playClickSound();
              }}
              disabled={isRolling}
              className={`flex-1 py-2 rounded-lg text-xs font-bold bg-gradient-to-r ${strategy.color} text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50`}
            >
              {strategy.name}
            </button>
          ))}
        </div>
      </div>

      {/* Bet Controls */}
      <div className="bg-slate/50 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-300">Bet Amount</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBetAmount(Math.max(1, betAmount - 10))}
              className="w-6 h-6 rounded bg-white/10 text-white hover:bg-white/20"
            >
              -
            </button>
            <span className="text-sunshine font-bold w-16 text-center">{betAmount}</span>
            <button
              onClick={() => setBetAmount(betAmount + 10)}
              className="w-6 h-6 rounded bg-white/10 text-white hover:bg-white/20"
            >
              +
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          {quickBets.map(amount => (
            <button
              key={amount}
              onClick={() => {
                setBetAmount(amount);
                playClickSound();
              }}
              disabled={isRolling}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                betAmount === amount
                  ? 'bg-coral text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              } disabled:opacity-50`}
            >
              {amount}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={rollDice}
          disabled={isRolling}
          className={`flex-1 py-4 rounded-xl font-bold transition-all ${
            isRolling
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-coral to-orange-500 text-white active:scale-95'
          }`}
        >
          {isRolling ? 'Rolling...' : `Roll Dice (${betAmount} tokens)`}
        </button>
        
        <button
          onClick={() => {
            setAutoPlay(!autoPlay);
            setAutoPlayCount(autoPlay ? 0 : 10);
            playClickSound();
          }}
          className={`px-4 rounded-xl font-bold transition-all ${
            autoPlay
              ? 'bg-red-500 text-white'
              : 'bg-turquoise text-midnight'
          }`}
        >
          {autoPlay ? 'Stop' : 'Auto'}
        </button>
      </div>

      {/* History */}
      <div className="bg-slate/50 rounded-xl p-4 max-h-40 overflow-y-auto">
        <h3 className="text-sm text-gray-300 mb-2">Recent Rolls</h3>
        {history.length === 0 ? (
          <p className="text-center text-gray-500 text-xs">No rolls yet</p>
        ) : (
          <div className="space-y-1">
            {history.map((roll, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={`flex justify-between items-center p-2 rounded-lg text-xs ${
                  roll.won ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}
              >
                <span className="text-gray-300">
                  Bet: {roll.playerChoice} | Roll: {roll.diceResult}
                </span>
                <span className={roll.won ? 'text-green-400' : 'text-red-400'}>
                  {roll.profit > 0 ? '+' : ''}{roll.profit}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Double or Nothing Modal */}
      <AnimatePresence>
        {doubleOrNothing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => handleDoubleOrNothing(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-slate rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Double or Nothing!</h3>
              <p className="text-gray-300 mb-6">
                Risk your {history[0]?.profit} token win for a chance to double it!
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDoubleOrNothing(true)}
                  className="flex-1 btn-primary"
                >
                  Risk It!
                </button>
                <button
                  onClick={() => handleDoubleOrNothing(false)}
                  className="flex-1 bg-gray-600 text-white py-3 rounded-xl font-bold"
                >
                  Keep Win
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
