import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Rocket, Target, Zap, Award, TrendingUp, Wind, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useSound } from '../../hooks/useSound';

interface LeapHistory {
  targetMultiplier: number;
  achievedMultiplier: number;
  won: boolean;
  profit: number;
}

interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element;
  active: boolean;
  duration: number;
}

export const LimboLeapGame = () => {
  const navigate = useNavigate();
  const { playWinSound, playLoseSound, playClickSound, playCoinSound, vibrate } = useSound();
  const controls = useAnimation();
  
  // Game states
  const [betAmount, setBetAmount] = useState(20);
  const [targetMultiplier, setTargetMultiplier] = useState(2.0);
  const [isLeaping, setIsLeaping] = useState(false);
  const [currentHeight, setCurrentHeight] = useState(1.0);
  const [finalMultiplier, setFinalMultiplier] = useState<number | null>(null);
  const [history, setHistory] = useState<LeapHistory[]>([]);
  const [consecutiveWins, setConsecutiveWins] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  
  // Power-ups and bonuses
  const [powerUps, setPowerUps] = useState<PowerUp[]>([
    { id: 'boost', name: 'Rocket Boost', description: '+20% multiplier', icon: <Rocket className="w-4 h-4" />, active: false, duration: 0 },
    { id: 'shield', name: 'Safety Shield', description: 'Min 1.5x guaranteed', icon: <Wind className="w-4 h-4" />, active: false, duration: 0 },
    { id: 'golden', name: 'Golden Leap', description: '2x win bonus', icon: <Star className="w-4 h-4" />, active: false, duration: 0 },
  ]);
  const [moonPhase, setMoonPhase] = useState(0); // 0-3 phases for bonus multipliers
  const [comboMultiplier, setComboMultiplier] = useState(1);
  
  // Animation refs
  const animationRef = useRef<number>();
  const rocketPositionRef = useRef(0);
  
  // Calculate win probability (for display)
  const calculateWinProbability = useCallback(() => {
    // House edge of 3%
    const probability = (1 / targetMultiplier) * 0.97;
    return Math.min(99, Math.floor(probability * 100));
  }, [targetMultiplier]);

  // Generate leap result
  const generateLeapResult = useCallback(() => {
    const rand = Math.random();
    let baseMultiplier = 1.0;
    
    // House edge calculation
    if (rand < 0.03) {
      baseMultiplier = 1.0; // Instant crash
    } else {
      // Exponential distribution for realistic multipliers
      baseMultiplier = Math.floor((1 / (1 - rand * 0.97)) * 100) / 100;
    }
    
    // Apply power-ups
    const boost = powerUps.find(p => p.id === 'boost');
    if (boost?.active) {
      baseMultiplier *= 1.2;
    }
    
    const shield = powerUps.find(p => p.id === 'shield');
    if (shield?.active && baseMultiplier < 1.5) {
      baseMultiplier = 1.5;
    }
    
    // Moon phase bonus (0-30% based on phase)
    baseMultiplier *= (1 + moonPhase * 0.1);
    
    return Math.max(1.0, Math.min(baseMultiplier, 1000));
  }, [powerUps, moonPhase]);

  // Leap animation
  const performLeap = useCallback(async () => {
    playClickSound();
    setIsLeaping(true);
    setFinalMultiplier(null);
    setCurrentHeight(1.0);
    
    const result = generateLeapResult();
    const duration = Math.min(result * 100, 3000); // Max 3 seconds animation
    
    // Animate rocket leap
    controls.start({
      y: [-200, -300 - (result * 20), -200],
      transition: {
        duration: duration / 1000,
        ease: "easeOut",
      },
    });
    
    // Update height counter
    let startTime = Date.now();
    const updateHeight = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const height = 1 + (result - 1) * progress;
      
      setCurrentHeight(Math.floor(height * 100) / 100);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(updateHeight);
      } else {
        // Leap complete
        completeLeap(result);
      }
    };
    
    animationRef.current = requestAnimationFrame(updateHeight);
  }, [generateLeapResult, controls, playClickSound]);

  // Complete leap and calculate winnings
  const completeLeap = useCallback((achievedMultiplier: number) => {
    setFinalMultiplier(achievedMultiplier);
    setIsLeaping(false);
    
    const won = achievedMultiplier >= targetMultiplier;
    let profit = 0;
    
    if (won) {
      // Calculate winnings with power-ups
      let winMultiplier = targetMultiplier;
      const golden = powerUps.find(p => p.id === 'golden');
      if (golden?.active) {
        winMultiplier *= 2;
      }
      
      // Apply combo multiplier
      winMultiplier *= comboMultiplier;
      
      profit = Math.floor((betAmount * winMultiplier) - betAmount);
      
      // Update streak
      const newStreak = consecutiveWins + 1;
      setConsecutiveWins(newStreak);
      setComboMultiplier(Math.min(1 + newStreak * 0.1, 2)); // Max 2x combo
      
      // Sound and haptics
      playWinSound();
      playCoinSound();
      vibrate([50, 30, 100]);
      
      // Special effects for high multipliers
      if (achievedMultiplier >= 10) {
        toast.success(`🚀 MOON LANDING! Won ${profit} tokens at ${achievedMultiplier}x!`, {
          duration: 5000,
        });
        
        // Unlock random power-up
        unlockRandomPowerUp();
      } else if (achievedMultiplier >= 5) {
        toast.success(`⭐ STELLAR LEAP! Won ${profit} tokens at ${achievedMultiplier}x!`, {
          duration: 4000,
        });
      } else {
        toast.success(`Won ${profit} tokens! Reached ${achievedMultiplier}x`, {
          icon: '🎯',
        });
      }
    } else {
      // Lost
      profit = -betAmount;
      setConsecutiveWins(0);
      setComboMultiplier(1);
      
      playLoseSound();
      vibrate(200);
      
      toast.error(`Fell short at ${achievedMultiplier}x. Needed ${targetMultiplier}x`, {
        icon: '💥',
      });
    }
    
    // Update totals
    setTotalProfit(prev => prev + profit);
    
    // Add to history
    setHistory(prev => [{
      targetMultiplier,
      achievedMultiplier,
      won,
      profit,
    }, ...prev.slice(0, 9)]);
    
    // Update power-up durations
    setPowerUps(prev => prev.map(p => ({
      ...p,
      duration: Math.max(0, p.duration - 1),
      active: p.duration > 1,
    })));
  }, [targetMultiplier, betAmount, consecutiveWins, comboMultiplier, powerUps,
      playWinSound, playLoseSound, playCoinSound, vibrate]);

  // Unlock random power-up
  const unlockRandomPowerUp = useCallback(() => {
    const inactivePowerUps = powerUps.filter(p => !p.active);
    if (inactivePowerUps.length > 0) {
      const random = inactivePowerUps[Math.floor(Math.random() * inactivePowerUps.length)];
      
      setPowerUps(prev => prev.map(p => 
        p.id === random.id 
          ? { ...p, active: true, duration: 3 }
          : p
      ));
      
      toast.info(`Power-up unlocked: ${random.name}!`, {
        icon: '⚡',
        description: random.description,
      });
    }
  }, [powerUps]);

  // Update moon phase periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setMoonPhase(prev => (prev + 1) % 4);
      const phases = ['🌑 New Moon', '🌓 First Quarter', '🌕 Full Moon', '🌗 Last Quarter'];
      const bonuses = ['No bonus', '+10% multiplier', '+20% multiplier', '+30% multiplier'];
      
      toast.info(phases[moonPhase], {
        description: bonuses[moonPhase],
      });
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [moonPhase]);

  // Cleanup animation
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Quick multiplier presets
  const quickMultipliers = [1.2, 1.5, 2, 3, 5, 10];
  const riskLevels = [
    { name: 'Low Risk', range: [1.1, 1.5], color: 'from-green-500 to-emerald-500' },
    { name: 'Medium', range: [1.5, 3], color: 'from-yellow-500 to-orange-500' },
    { name: 'High Risk', range: [3, 10], color: 'from-red-500 to-pink-500' },
    { name: 'Extreme', range: [10, 50], color: 'from-purple-500 to-indigo-500' },
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
        
        <h1 className="text-2xl font-bold text-white">LimboLeap</h1>
        
        <div className="flex items-center gap-2">
          {consecutiveWins > 0 && (
            <div className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
              <span className="text-xs font-bold text-white">
                {consecutiveWins}x Streak
              </span>
            </div>
          )}
          {comboMultiplier > 1 && (
            <div className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
              <span className="text-xs font-bold text-white">
                {comboMultiplier.toFixed(1)}x Combo
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Moon Phase Indicator */}
      <div className="bg-slate/30 rounded-lg p-2 mb-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">
            {moonPhase === 0 && '🌑'}
            {moonPhase === 1 && '🌓'}
            {moonPhase === 2 && '🌕'}
            {moonPhase === 3 && '🌗'}
          </span>
          <span className="text-sm text-gray-300">
            Moon Bonus: +{moonPhase * 10}%
          </span>
        </div>
      </div>

      {/* Game Display */}
      <div className="relative bg-slate/50 rounded-2xl p-8 mb-6 overflow-hidden" style={{ height: '300px' }}>
        {/* Stars background */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Height indicator */}
        <div className="absolute left-4 top-4 bottom-4 w-2 bg-white/10 rounded-full">
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-turquoise to-cyan-400 rounded-full"
            style={{
              height: `${Math.min(100, (currentHeight - 1) * 10)}%`,
            }}
          />
        </div>

        {/* Multiplier display */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <AnimatePresence mode="wait">
            {isLeaping ? (
              <motion.div
                key="leaping"
                className="text-center"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                  }}
                  className="text-6xl font-bold text-turquoise mb-2"
                >
                  {currentHeight.toFixed(2)}x
                </motion.div>
                <p className="text-gray-300">Climbing...</p>
              </motion.div>
            ) : finalMultiplier ? (
              <motion.div
                key={finalMultiplier}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div className={`text-6xl font-bold mb-2 ${
                  finalMultiplier >= targetMultiplier ? 'text-green-400' : 'text-red-400'
                }`}>
                  {finalMultiplier.toFixed(2)}x
                </div>
                <p className={`text-lg font-bold ${
                  finalMultiplier >= targetMultiplier ? 'text-green-400' : 'text-red-400'
                }`}>
                  {finalMultiplier >= targetMultiplier 
                    ? `+${Math.floor(betAmount * targetMultiplier - betAmount)} tokens!`
                    : `Lost ${betAmount} tokens`
                  }
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                className="text-center"
              >
                <Target className="w-16 h-16 text-turquoise mx-auto mb-4" />
                <p className="text-2xl font-bold text-white">
                  Target: {targetMultiplier}x
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Win Chance: {calculateWinProbability()}%
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Rocket */}
        <motion.div
          animate={controls}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ y: -200 }}
        >
          <motion.div
            animate={isLeaping ? {
              rotate: [-5, 5, -5],
            } : {}}
            transition={{
              duration: 0.5,
              repeat: Infinity,
            }}
            className="text-5xl"
          >
            🚀
          </motion.div>
          {isLeaping && (
            <motion.div
              className="absolute -bottom-4 left-1/2 transform -translate-x-1/2"
              animate={{
                scaleY: [1, 1.5, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 0.2,
                repeat: Infinity,
              }}
            >
              <div className="w-8 h-12 bg-gradient-to-b from-yellow-500 to-orange-500 opacity-80 blur-sm rounded-full" />
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Power-ups */}
      <div className="bg-slate/50 rounded-xl p-3 mb-4">
        <p className="text-xs text-gray-300 mb-2">Active Power-ups</p>
        <div className="flex gap-2">
          {powerUps.map(powerUp => (
            <div
              key={powerUp.id}
              className={`flex-1 p-2 rounded-lg text-center transition-all ${
                powerUp.active
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                  : 'bg-white/10 text-gray-500'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                {powerUp.icon}
                <span className="text-xs font-bold">{powerUp.name}</span>
                {powerUp.active && (
                  <span className="text-xs">{powerUp.duration} uses</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Target Multiplier */}
      <div className="bg-slate/50 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-300">Target Multiplier</span>
          <span className="text-sm text-turquoise">
            Potential Win: {Math.floor(betAmount * targetMultiplier)} tokens
          </span>
        </div>
        
        {/* Quick presets */}
        <div className="flex gap-2 mb-3">
          {quickMultipliers.map(mult => (
            <button
              key={mult}
              onClick={() => {
                setTargetMultiplier(mult);
                playClickSound();
              }}
              disabled={isLeaping}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                targetMultiplier === mult
                  ? 'bg-turquoise text-midnight'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              } disabled:opacity-50`}
            >
              {mult}x
            </button>
          ))}
        </div>

        {/* Risk levels */}
        <div className="grid grid-cols-2 gap-2">
          {riskLevels.map(level => (
            <button
              key={level.name}
              onClick={() => {
                const mult = level.range[0] + Math.random() * (level.range[1] - level.range[0]);
                setTargetMultiplier(Math.floor(mult * 100) / 100);
                playClickSound();
              }}
              disabled={isLeaping}
              className={`py-2 rounded-lg text-xs font-bold bg-gradient-to-r ${level.color} text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50`}
            >
              {level.name}
            </button>
          ))}
        </div>

        {/* Manual slider */}
        <div className="mt-3">
          <input
            type="range"
            min="1.1"
            max="50"
            step="0.1"
            value={targetMultiplier}
            onChange={(e) => setTargetMultiplier(parseFloat(e.target.value))}
            disabled={isLeaping}
            className="w-full"
          />
        </div>
      </div>

      {/* Bet Controls */}
      <div className="bg-slate/50 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-300">Bet Amount</span>
          <span className="text-sunshine font-bold">{betAmount} tokens</span>
        </div>
        
        <div className="flex gap-2">
          {[10, 20, 50, 100, 250].map(amount => (
            <button
              key={amount}
              onClick={() => {
                setBetAmount(amount);
                playClickSound();
              }}
              disabled={isLeaping}
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

      {/* Leap Button */}
      <button
        onClick={performLeap}
        disabled={isLeaping}
        className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
          isLeaping
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-turquoise to-cyan-500 text-midnight active:scale-95'
        }`}
      >
        <Rocket className="w-5 h-5" />
        {isLeaping ? 'Leaping...' : `Leap for ${targetMultiplier}x (${betAmount} tokens)`}
      </button>

      {/* History */}
      <div className="mt-4 bg-slate/50 rounded-xl p-4 max-h-32 overflow-y-auto">
        <h3 className="text-sm text-gray-300 mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Recent Leaps
        </h3>
        {history.length === 0 ? (
          <p className="text-center text-gray-500 text-xs">No leaps yet</p>
        ) : (
          <div className="space-y-1">
            {history.map((leap, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={`flex justify-between items-center p-2 rounded-lg text-xs ${
                  leap.won ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}
              >
                <span className="text-gray-300">
                  Target: {leap.targetMultiplier}x | Got: {leap.achievedMultiplier}x
                </span>
                <span className={leap.won ? 'text-green-400' : 'text-red-400'}>
                  {leap.profit > 0 ? '+' : ''}{leap.profit}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-3 bg-yellow-500/20 rounded-lg p-3">
        <Award className="w-5 h-5 text-yellow-500 mb-1" />
        <p className="text-xs text-yellow-300">
          <span className="font-bold">Total Profit:</span> {totalProfit > 0 ? '+' : ''}{totalProfit} tokens
        </p>
      </div>
    </div>
  );
};
