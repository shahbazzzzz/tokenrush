import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, AlertCircle, Zap, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { useSound } from '../../hooks/useSound';

interface CrashHistory {
  multiplier: number;
  cashedOut: boolean;
  profit: number;
}

export const CrashMasterGame = () => {
  const navigate = useNavigate();
  const { playWinSound, playLoseSound, playClickSound, playCoinSound, vibrate } = useSound();
  
  // Game states
  const [betAmount, setBetAmount] = useState(10);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [isAutoEnabled, setIsAutoEnabled] = useState(false);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCrashed, setIsCrashed] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [history, setHistory] = useState<CrashHistory[]>([]);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [consecutiveWins, setConsecutiveWins] = useState(0);
  
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(0);

  // Generate crash point with house edge
  const generateCrashPoint = useCallback(() => {
    const rand = Math.random();
    // 3% house edge
    if (rand < 0.03) return 1.0;
    
    // Use exponential distribution for realistic crash points
    const crashPoint = Math.floor((0.97 / (1 - rand * 0.97)) * 100) / 100;
    return Math.max(1.0, Math.min(crashPoint, 100));
  }, []);

  // Animation loop for multiplier increase
  const animate = useCallback(() => {
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const growthRate = 0.06; // Multiplier growth rate
    const newMultiplier = Math.floor((Math.exp(growthRate * elapsed) * 100)) / 100;

    if (newMultiplier >= crashPointRef.current) {
      crash();
    } else {
      setCurrentMultiplier(newMultiplier);
      
      // Auto cashout check
      if (isAutoEnabled && newMultiplier >= autoCashout && !hasCashedOut) {
        cashOut();
      }
      
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isAutoEnabled, autoCashout, hasCashedOut]);

  const startGame = useCallback(() => {
    playClickSound();
    
    // Reset states
    setIsPlaying(true);
    setIsCrashed(false);
    setHasCashedOut(false);
    setWinAmount(0);
    setCurrentMultiplier(1.0);
    startTimeRef.current = 0;
    
    // Generate crash point
    crashPointRef.current = generateCrashPoint();
    console.log('Crash point:', crashPointRef.current);
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
  }, [animate, generateCrashPoint, playClickSound]);

  const cashOut = useCallback(() => {
    if (!isPlaying || hasCashedOut || isCrashed) return;
    
    const profit = Math.floor((betAmount * currentMultiplier) - betAmount);
    setWinAmount(betAmount * currentMultiplier);
    setHasCashedOut(true);
    
    // Update combo multiplier
    setConsecutiveWins(prev => prev + 1);
    const newCombo = Math.min(consecutiveWins + 1, 5);
    setComboMultiplier(1 + (newCombo * 0.1));
    
    // Effects
    playWinSound();
    playCoinSound();
    vibrate([50, 30, 50]);
    
    // Show win notification with combo
    const comboBonus = newCombo > 1 ? ` (${newCombo}x Combo!)` : '';
    toast.success(`Won ${Math.floor(profit)} tokens at ${currentMultiplier}x${comboBonus}`, {
      icon: '💰',
    });
    
    // Add to history
    setHistory(prev => [{
      multiplier: currentMultiplier,
      cashedOut: true,
      profit,
    }, ...prev.slice(0, 9)]);
    
    // Cancel animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, [isPlaying, hasCashedOut, isCrashed, betAmount, currentMultiplier, consecutiveWins, playWinSound, playCoinSound, vibrate]);

  const crash = useCallback(() => {
    setIsCrashed(true);
    setIsPlaying(false);
    
    // Reset combo on loss
    if (!hasCashedOut) {
      setConsecutiveWins(0);
      setComboMultiplier(1);
      playLoseSound();
      vibrate(200);
      
      // Add to history
      setHistory(prev => [{
        multiplier: crashPointRef.current,
        cashedOut: false,
        profit: -betAmount,
      }, ...prev.slice(0, 9)]);
      
      toast.error(`Crashed at ${crashPointRef.current}x! Lost ${betAmount} tokens`, {
        icon: '💥',
      });
    }
    
    // Cancel animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Auto restart after delay if auto is enabled
    if (isAutoEnabled) {
      setTimeout(() => {
        startGame();
      }, 2000);
    }
  }, [hasCashedOut, betAmount, isAutoEnabled, playLoseSound, vibrate, startGame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Quick bet buttons
  const quickBets = [10, 25, 50, 100, 250];
  const quickCashouts = [1.5, 2.0, 3.0, 5.0, 10.0];

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
        
        <h1 className="text-2xl font-bold text-white">CrashMaster</h1>
        
        <div className="flex items-center gap-2">
          {consecutiveWins > 0 && (
            <div className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
              <span className="text-xs font-bold text-white">{consecutiveWins}x Combo!</span>
            </div>
          )}
        </div>
      </div>

      {/* Game Display */}
      <div className="relative bg-slate/50 rounded-2xl p-8 mb-6 overflow-hidden">
        {/* Background graph lines */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full border-t border-turquoise/30"
              style={{ top: `${i * 10}%` }}
            />
          ))}
        </div>

        {/* Multiplier Display */}
        <div className="relative z-10 text-center">
          <AnimatePresence>
            {isCrashed && !hasCashedOut ? (
              <motion.div
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                exit={{ scale: 0 }}
                className="text-6xl font-bold text-red-500 mb-2"
              >
                💥 CRASHED!
              </motion.div>
            ) : (
              <motion.div
                key={currentMultiplier}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`text-7xl font-bold mb-2 ${
                  hasCashedOut ? 'text-green-400' : 
                  currentMultiplier > 5 ? 'text-yellow-400' :
                  currentMultiplier > 2 ? 'text-turquoise' :
                  'text-white'
                }`}
              >
                {currentMultiplier.toFixed(2)}x
              </motion.div>
            )}
          </AnimatePresence>

          {hasCashedOut && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-2xl text-green-400 font-bold"
            >
              +{Math.floor(winAmount - betAmount)} tokens!
            </motion.div>
          )}
        </div>

        {/* Rocket animation */}
        {isPlaying && !isCrashed && (
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            animate={{
              y: [-20, -40, -20],
              rotate: [-5, 5, -5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <span className="text-4xl">🚀</span>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-4 mb-6">
        {/* Bet Amount */}
        <div className="bg-slate/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-300">Bet Amount</label>
            <div className="flex items-center gap-2">
              <span className="text-sunshine font-bold">{betAmount}</span>
              <span className="text-xs text-gray-400">tokens</span>
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
                disabled={isPlaying}
                className={`flex-1 py-2 rounded-lg font-bold transition-all ${
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

        {/* Auto Cashout */}
        <div className="bg-slate/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-300">Auto Cashout</label>
            <button
              onClick={() => {
                setIsAutoEnabled(!isAutoEnabled);
                playClickSound();
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                isAutoEnabled 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-600 text-gray-300'
              }`}
            >
              {isAutoEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          
          <div className="flex gap-2">
            {quickCashouts.map(mult => (
              <button
                key={mult}
                onClick={() => {
                  setAutoCashout(mult);
                  playClickSound();
                }}
                disabled={isPlaying}
                className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                  autoCashout === mult 
                    ? 'bg-turquoise text-midnight' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                } disabled:opacity-50`}
              >
                {mult}x
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isPlaying ? (
            <button
              onClick={startGame}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              Start Game ({betAmount} tokens)
            </button>
          ) : (
            <button
              onClick={cashOut}
              disabled={hasCashedOut || isCrashed}
              className={`flex-1 py-4 rounded-xl font-bold transition-all ${
                hasCashedOut || isCrashed
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white active:scale-95'
              }`}
            >
              {hasCashedOut ? `Cashed Out at ${currentMultiplier}x` : 
               isCrashed ? 'Crashed!' : 
               `Cash Out (${Math.floor(betAmount * currentMultiplier)} tokens)`}
            </button>
          )}
        </div>
      </div>

      {/* History */}
      <div className="bg-slate/50 rounded-xl p-4">
        <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          Recent Games
        </h3>
        
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-center text-gray-500 text-sm">No games yet</p>
          ) : (
            history.map((game, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`flex justify-between items-center p-2 rounded-lg ${
                  game.cashedOut ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}
              >
                <span className="text-xs text-gray-300">
                  {game.multiplier.toFixed(2)}x
                </span>
                <span className={`text-xs font-bold ${
                  game.cashedOut ? 'text-green-400' : 'text-red-400'
                }`}>
                  {game.profit > 0 ? '+' : ''}{game.profit}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
        <div className="text-xs text-yellow-300">
          <p className="font-bold mb-1">Pro Tip:</p>
          <p>Build your combo multiplier by cashing out multiple times in a row! Each win increases your bonus up to 50%!</p>
        </div>
      </div>
    </div>
  );
};
