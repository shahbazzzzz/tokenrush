import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Medal, Crown, TrendingUp, Users, Clock, Flame, Star } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  avatar?: string;
  score: number;
  change: 'up' | 'down' | 'same';
  streak?: number;
  isCurrentUser?: boolean;
}

export const Leaderboard = () => {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>('daily');
  const [metric, setMetric] = useState<'tokens' | 'wins' | 'streak'>('tokens');
  const [loading, setLoading] = useState(false);
  
  // Mock data - replace with API call
  const [entries, setEntries] = useState<LeaderboardEntry[]>([
    { id: '1', rank: 1, username: 'CryptoKing', score: 15420, change: 'up', streak: 12 },
    { id: '2', rank: 2, username: 'MoonShot', score: 14200, change: 'up', streak: 8 },
    { id: '3', rank: 3, username: 'DiamondHands', score: 13500, change: 'down', streak: 5 },
    { id: '4', rank: 4, username: 'RocketMan', score: 12800, change: 'same', streak: 3 },
    { id: '5', rank: 5, username: 'You', score: 11200, change: 'up', streak: 7, isCurrentUser: true },
    { id: '6', rank: 6, username: 'LuckyDice', score: 10500, change: 'down' },
    { id: '7', rank: 7, username: 'TokenMaster', score: 9800, change: 'up' },
    { id: '8', rank: 8, username: 'GemHunter', score: 9200, change: 'same' },
    { id: '9', rank: 9, username: 'CrashPro', score: 8700, change: 'up' },
    { id: '10', rank: 10, username: 'MineExpert', score: 8100, change: 'down' },
  ]);

  const [currentUserRank] = useState({
    rank: 5,
    percentile: 'Top 10%',
    tokensToNext: 1600,
  });

  // Simulate loading when changing filters
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      // Shuffle scores slightly to simulate data change
      setEntries(prev => prev.map(entry => ({
        ...entry,
        score: entry.score + Math.floor(Math.random() * 500 - 250),
      })));
      setLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [timeframe, metric]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Medal className="w-6 h-6 text-orange-600" />;
      default:
        return <span className="w-6 h-6 text-center font-bold text-gray-400">#{rank}</span>;
    }
  };

  const timeframes = [
    { value: 'daily', label: 'Today', icon: <Clock className="w-3 h-3" /> },
    { value: 'weekly', label: 'Week', icon: <TrendingUp className="w-3 h-3" /> },
    { value: 'monthly', label: 'Month', icon: <Trophy className="w-3 h-3" /> },
    { value: 'all_time', label: 'All Time', icon: <Star className="w-3 h-3" /> },
  ];

  const metrics = [
    { value: 'tokens', label: 'Tokens', color: 'from-yellow-500 to-orange-500' },
    { value: 'wins', label: 'Wins', color: 'from-green-500 to-emerald-500' },
    { value: 'streak', label: 'Streak', color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <div className="min-h-screen bg-game-gradient p-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Leaderboard
        </h1>
        
        <Users className="w-6 h-6 text-turquoise" />
      </div>

      {/* Current User Stats */}
      <motion.div 
        className="bg-gradient-to-r from-coral/20 to-turquoise/20 rounded-2xl p-4 mb-6 border border-turquoise/30"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300 mb-1">Your Rank</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-white">#{currentUserRank.rank}</span>
              <span className="px-2 py-1 bg-green-500/20 rounded-full text-xs text-green-400">
                ↑ 3 places
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{currentUserRank.percentile}</p>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-300 mb-1">To Next Rank</p>
            <p className="text-2xl font-bold text-sunshine">{currentUserRank.tokensToNext}</p>
            <p className="text-xs text-gray-400 mt-1">tokens needed</p>
          </div>
        </div>
      </motion.div>

      {/* Timeframe Selector */}
      <div className="flex gap-2 mb-4">
        {timeframes.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setTimeframe(tf.value as any)}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1 ${
              timeframe === tf.value
                ? 'bg-turquoise text-midnight'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {tf.icon}
            {tf.label}
          </button>
        ))}
      </div>

      {/* Metric Selector */}
      <div className="flex gap-2 mb-6">
        {metrics.map((m) => (
          <button
            key={m.value}
            onClick={() => setMetric(m.value as any)}
            className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
              metric === m.value
                ? `bg-gradient-to-r ${m.color} text-white`
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-20"
            >
              <div className="w-12 h-12 border-4 border-turquoise border-t-transparent rounded-full animate-spin" />
            </motion.div>
          ) : (
            <motion.div key={timeframe + metric} className="space-y-2">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-slate/50 rounded-xl p-3 ${
                    entry.isCurrentUser ? 'ring-2 ring-turquoise' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className="w-8 flex items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-bold ${entry.isCurrentUser ? 'text-turquoise' : 'text-white'}`}>
                          {entry.username}
                        </p>
                        {entry.streak && entry.streak > 5 && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 rounded-full">
                            <Flame className="w-3 h-3 text-orange-500" />
                            <span className="text-xs text-orange-400">{entry.streak}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Change indicator */}
                      <div className="flex items-center gap-2 mt-1">
                        {entry.change === 'up' && (
                          <span className="text-xs text-green-400">↑ Rising</span>
                        )}
                        {entry.change === 'down' && (
                          <span className="text-xs text-red-400">↓ Falling</span>
                        )}
                        {entry.change === 'same' && (
                          <span className="text-xs text-gray-400">− Steady</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Score */}
                    <div className="text-right">
                      <p className="text-xl font-bold text-sunshine">
                        {metric === 'tokens' && entry.score.toLocaleString()}
                        {metric === 'wins' && `${entry.score}`}
                        {metric === 'streak' && `${entry.streak || 0} days`}
                      </p>
                      {metric === 'tokens' && (
                        <p className="text-xs text-gray-400">tokens</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load More */}
        {!loading && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full py-3 mt-4 bg-white/10 rounded-xl text-gray-400 font-bold hover:bg-white/20 transition-colors"
          >
            Load More
          </motion.button>
        )}
      </div>

      {/* Bottom Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="bg-slate/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-white">1,234</p>
          <p className="text-xs text-gray-400">Total Players</p>
        </div>
        <div className="bg-slate/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-sunshine">500K</p>
          <p className="text-xs text-gray-400">Tokens Won</p>
        </div>
        <div className="bg-slate/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-turquoise">42</p>
          <p className="text-xs text-gray-400">Countries</p>
        </div>
      </div>
    </div>
  );
};
