import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gem, Bomb, Shield, Star, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useSound } from '../../hooks/useSound';

interface Tile {
  id: number;
  isMine: boolean;
  isRevealed: boolean;
  isGem: boolean;
}

export const MineQuestGame = () => {
  const navigate = useNavigate();
  const { playWinSound, playLoseSound, playClickSound, playCoinSound, vibrate } = useSound();
  
  // Game configuration
  const [gridSize, setGridSize] = useState(5);
  const [mineCount, setMineCount] = useState(5);
  const [betAmount, setBetAmount] = useState(10);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  
  // Game state
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gemsFound, setGemsFound] = useState(0);
  const [winAmount, setWinAmount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [shieldActive, setShieldActive] = useState(false);
  const [autoRevealNext, setAutoRevealNext] = useState(false);
  
  // Statistics
  const [totalGamesPlayed, setTotalGamesPlayed] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // Initialize grid
  const initializeGrid = useCallback(() => {
    const totalTiles = gridSize * gridSize;
    const newTiles: Tile[] = [];
    
    // Create mines array
    const minePositions = new Set<number>();
    while (minePositions.size < mineCount) {
      minePositions.add(Math.floor(Math.random() * totalTiles));
    }
    
    // Create tiles
    for (let i = 0; i < totalTiles; i++) {
      newTiles.push({
        id: i,
        isMine: minePositions.has(i),
        isRevealed: false,
        isGem: !minePositions.has(i),
      });
    }
    
    setTiles(newTiles);
  }, [gridSize, mineCount]);

  // Calculate multiplier based on risk
  const calculateMultiplier = useCallback((revealed: number) => {
    const safeSpots = (gridSize * gridSize) - mineCount;
    const probability = (safeSpots - revealed + 1) / (gridSize * gridSize - revealed + 1);
    const multiplier = 1 / probability;
    return Math.floor(multiplier * 100) / 100;
  }, [gridSize, mineCount]);

  // Start new game
  const startGame = useCallback(() => {
    playClickSound();
    initializeGrid();
    setIsPlaying(true);
    setGameOver(false);
    setGemsFound(0);
    setCurrentMultiplier(1.0);
    setWinAmount(0);
    setShieldActive(streak >= 5); // Activate shield after 5 game streak
    setAutoRevealNext(false);
    setTotalGamesPlayed(prev => prev + 1);
  }, [initializeGrid, streak, playClickSound]);

  // Reveal tile
  const revealTile = useCallback((tileId: number) => {
    if (!isPlaying || gameOver) return;
    
    const tile = tiles.find(t => t.id === tileId);
    if (!tile || tile.isRevealed) return;
    
    playClickSound();
    vibrate(30);
    
    const newTiles = tiles.map(t => {
      if (t.id === tileId) {
        return { ...t, isRevealed: true };
      }
      return t;
    });
    
    setTiles(newTiles);
    
    if (tile.isMine) {
      // Hit a mine!
      if (shieldActive) {
        // Shield protection
        setShieldActive(false);
        toast.info('Shield protected you from the mine!', { icon: '🛡️' });
        playWinSound();
        
        // Continue playing
        const newGemsFound = gemsFound;
        const newMultiplier = calculateMultiplier(newGemsFound);
        setCurrentMultiplier(newMultiplier);
      } else {
        // Game over
        playLoseSound();
        vibrate(200);
        setGameOver(true);
        setIsPlaying(false);
        setStreak(0);
        
        // Reveal all mines
        setTiles(prevTiles => prevTiles.map(t => ({
          ...t,
          isRevealed: t.isMine ? true : t.isRevealed,
        })));
        
        toast.error(`Hit a mine! Lost ${betAmount} tokens`, { icon: '💣' });
      }
    } else {
      // Found a gem!
      const newGemsFound = gemsFound + 1;
      setGemsFound(newGemsFound);
      
      // Calculate new multiplier
      const newMultiplier = calculateMultiplier(newGemsFound);
      setCurrentMultiplier(newMultiplier);
      
      // Bonus effects
      if (newGemsFound % 5 === 0) {
        // Bonus every 5 gems
        playCoinSound();
        toast.success(`Bonus! Found ${newGemsFound} gems!`, { icon: '⭐' });
        
        // Random power-up
        if (Math.random() < 0.3) {
          setAutoRevealNext(true);
          toast.info('Next safe tile will be revealed!', { icon: '👁️' });
        }
      }
      
      // Check if all safe tiles revealed (auto win)
      const safeCount = (gridSize * gridSize) - mineCount;
      if (newGemsFound === safeCount) {
        handleCashOut();
      }
    }
  }, [isPlaying, gameOver, tiles, gemsFound, shieldActive, betAmount, gridSize, mineCount, 
      calculateMultiplier, playClickSound, playLoseSound, playCoinSound, vibrate]);

  // Auto reveal hint
  useEffect(() => {
    if (autoRevealNext && isPlaying && !gameOver) {
      const safeTiles = tiles.filter(t => !t.isMine && !t.isRevealed);
      if (safeTiles.length > 0) {
        const randomSafe = safeTiles[Math.floor(Math.random() * safeTiles.length)];
        setTimeout(() => {
          const tileElement = document.getElementById(`tile-${randomSafe.id}`);
          if (tileElement) {
            tileElement.classList.add('ring-4', 'ring-yellow-400', 'ring-opacity-75');
            setTimeout(() => {
              tileElement.classList.remove('ring-4', 'ring-yellow-400', 'ring-opacity-75');
            }, 2000);
          }
        }, 500);
        setAutoRevealNext(false);
      }
    }
  }, [autoRevealNext, tiles, isPlaying, gameOver]);

  // Cash out
  const handleCashOut = useCallback(() => {
    if (!isPlaying || gameOver || gemsFound === 0) return;
    
    const profit = Math.floor((betAmount * currentMultiplier) - betAmount);
    setWinAmount(betAmount * currentMultiplier);
    setGameOver(true);
    setIsPlaying(false);
    
    // Update streak
    const newStreak = streak + 1;
    setStreak(newStreak);
    if (newStreak > bestStreak) {
      setBestStreak(newStreak);
    }
    
    playWinSound();
    playCoinSound();
    vibrate([50, 30, 50]);
    
    // Reveal all tiles
    setTiles(prevTiles => prevTiles.map(t => ({ ...t, isRevealed: true })));
    
    toast.success(`Won ${profit} tokens! Found ${gemsFound} gems at ${currentMultiplier}x`, {
      icon: '💎',
    });
  }, [isPlaying, gameOver, gemsFound, betAmount, currentMultiplier, streak, bestStreak, 
      playWinSound, playCoinSound, vibrate]);

  // Quick settings
  const difficulties = [
    { name: 'Easy', grid: 5, mines: 3, color: 'from-green-500 to-emerald-500' },
    { name: 'Medium', grid: 5, mines: 5, color: 'from-yellow-500 to-orange-500' },
    { name: 'Hard', grid: 5, mines: 8, color: 'from-red-500 to-pink-500' },
    { name: 'Expert', grid: 6, mines: 12, color: 'from-purple-500 to-indigo-500' },
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
        
        <h1 className="text-2xl font-bold text-white">MineQuest</h1>
        
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
              <span className="text-xs font-bold text-white">
                <Star className="w-3 h-3 inline mr-1" />
                {streak} Streak
              </span>
            </div>
          )}
          {shieldActive && (
            <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
              <span className="text-xs font-bold text-white">
                <Shield className="w-3 h-3 inline mr-1" />
                Shield
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Game Stats */}
      <div className="bg-slate/50 rounded-2xl p-4 mb-4">
        <div className="flex justify-between items-center">
          <div className="text-center">
            <p className="text-sm text-gray-400">Gems Found</p>
            <p className="text-2xl font-bold text-turquoise">{gemsFound}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Multiplier</p>
            <motion.p 
              key={currentMultiplier}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold text-sunshine"
            >
              {currentMultiplier}x
            </motion.p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Potential Win</p>
            <p className="text-2xl font-bold text-green-400">
              {Math.floor(betAmount * currentMultiplier)}
            </p>
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="bg-slate/50 rounded-2xl p-4 mb-4">
        <div 
          className="grid gap-2 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            maxWidth: `${gridSize * 60}px`,
          }}
        >
          {tiles.map((tile, index) => (
            <motion.button
              key={tile.id}
              id={`tile-${tile.id}`}
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.01 }}
              whileHover={{ scale: tile.isRevealed ? 1 : 1.05 }}
              whileTap={{ scale: tile.isRevealed ? 1 : 0.95 }}
              onClick={() => revealTile(tile.id)}
              disabled={!isPlaying || tile.isRevealed || gameOver}
              className={`aspect-square rounded-lg transition-all duration-300 ${
                tile.isRevealed
                  ? tile.isMine
                    ? 'bg-red-500/30 border-2 border-red-500'
                    : 'bg-green-500/30 border-2 border-green-500'
                  : 'bg-gradient-to-br from-slate/50 to-accent hover:from-slate/70 hover:to-accent/70 border-2 border-turquoise/30'
              } disabled:cursor-default`}
            >
              <AnimatePresence>
                {tile.isRevealed && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    {tile.isMine ? (
                      <Bomb className="w-6 h-6 text-red-400" />
                    ) : (
                      <Gem className="w-6 h-6 text-green-400" />
                    )}
                  </motion.div>
                )}
                {!tile.isRevealed && (
                  <span className="text-turquoise/30 text-lg">?</span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Controls */}
      {!isPlaying ? (
        <div className="space-y-4">
          {/* Difficulty Selection */}
          <div className="bg-slate/50 rounded-xl p-4">
            <p className="text-sm text-gray-300 mb-3">Select Difficulty</p>
            <div className="grid grid-cols-2 gap-2">
              {difficulties.map(diff => (
                <button
                  key={diff.name}
                  onClick={() => {
                    setGridSize(diff.grid);
                    setMineCount(diff.mines);
                    playClickSound();
                  }}
                  className={`py-3 px-4 rounded-lg font-bold bg-gradient-to-r ${diff.color} text-white transition-all hover:scale-105 active:scale-95`}
                >
                  <span className="block text-sm">{diff.name}</span>
                  <span className="text-xs opacity-80">{diff.mines} mines</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bet Amount */}
          <div className="bg-slate/50 rounded-xl p-4">
            <p className="text-sm text-gray-300 mb-3">Bet Amount</p>
            <div className="flex gap-2">
              {[5, 10, 25, 50, 100].map(amount => (
                <button
                  key={amount}
                  onClick={() => {
                    setBetAmount(amount);
                    playClickSound();
                  }}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                    betAmount === amount 
                      ? 'bg-coral text-white' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Gem className="w-5 h-5" />
            Start Game ({betAmount} tokens)
          </button>
        </div>
      ) : (
        <button
          onClick={handleCashOut}
          disabled={gemsFound === 0}
          className={`w-full py-4 rounded-xl font-bold transition-all ${
            gemsFound === 0
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white active:scale-95'
          }`}
        >
          Cash Out ({Math.floor(betAmount * currentMultiplier)} tokens)
        </button>
      )}

      {/* Tips and Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-purple-500/20 rounded-lg p-3">
          <Zap className="w-5 h-5 text-purple-400 mb-1" />
          <p className="text-xs text-purple-300">
            <span className="font-bold">Power-ups:</span> Every 5 gems gives bonus rewards!
          </p>
        </div>
        <div className="bg-blue-500/20 rounded-lg p-3">
          <Shield className="w-5 h-5 text-blue-400 mb-1" />
          <p className="text-xs text-blue-300">
            <span className="font-bold">Shield:</span> Win 5 games in a row for mine protection!
          </p>
        </div>
      </div>
    </div>
  );
};
