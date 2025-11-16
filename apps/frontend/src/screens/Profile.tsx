import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Coins, Calendar, Users, Gift, Copy, Check, TrendingUp, Award } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  user: any;
}

export const Profile = ({ user }: Props) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    balance: 5420,
    lifetimeEarned: 12500,
    gamesPlayed: 234,
    winRate: 42,
    biggestWin: 2500,
    dailyStreak: 7,
    referrals: 3,
    achievements: 12,
  });

  const referralCode = user?.id ? `TR${user.id.slice(0, 6).toUpperCase()}` : 'TRCODE123';
  const referralLink = `https://t.me/tokenrush_bot?start=${referralCode}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const achievements = [
    { id: 1, name: 'First Win', icon: '🎯', unlocked: true },
    { id: 2, name: 'Lucky Seven', icon: '🍀', unlocked: true },
    { id: 3, name: 'High Roller', icon: '💎', unlocked: true },
    { id: 4, name: 'Speed Demon', icon: '⚡', unlocked: false },
    { id: 5, name: 'Mine Master', icon: '💣', unlocked: true },
    { id: 6, name: 'Rocket Scientist', icon: '🚀', unlocked: false },
  ];

  return (
    <div className="min-h-screen bg-game-gradient p-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
      </div>

      {/* User Info */}
      <motion.div 
        className="bg-slate/50 rounded-2xl p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-coral to-turquoise flex items-center justify-center text-2xl font-bold text-white">
            {user?.first_name?.[0] || user?.username?.[0] || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {user?.first_name || user?.username || 'Player'}
            </h2>
            <p className="text-sm text-gray-400">
              @{user?.username || 'anonymous'}
            </p>
          </div>
        </div>

        {/* Balance Display */}
        <div className="bg-gradient-to-r from-sunshine/20 to-orange-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Current Balance</p>
              <p className="text-3xl font-bold text-sunshine">{stats.balance.toLocaleString()}</p>
            </div>
            <Coins className="w-10 h-10 text-sunshine opacity-50" />
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        className="grid grid-cols-2 gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-slate/50 rounded-xl p-4">
          <TrendingUp className="w-5 h-5 text-turquoise mb-2" />
          <p className="text-2xl font-bold text-white">{stats.lifetimeEarned.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Lifetime Earned</p>
        </div>
        
        <div className="bg-slate/50 rounded-xl p-4">
          <Trophy className="w-5 h-5 text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-white">{stats.winRate}%</p>
          <p className="text-xs text-gray-400">Win Rate</p>
        </div>
        
        <div className="bg-slate/50 rounded-xl p-4">
          <Calendar className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-white">{stats.dailyStreak}</p>
          <p className="text-xs text-gray-400">Day Streak</p>
        </div>
        
        <div className="bg-slate/50 rounded-xl p-4">
          <Users className="w-5 h-5 text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-white">{stats.referrals}</p>
          <p className="text-xs text-gray-400">Referrals</p>
        </div>
      </motion.div>

      {/* Referral Section */}
      <motion.div 
        className="bg-slate/50 rounded-xl p-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4 text-coral" />
          Invite Friends & Earn
        </h3>
        
        <p className="text-xs text-gray-400 mb-3">
          Get 100 tokens for each friend who joins using your link!
        </p>
        
        <div className="flex gap-2">
          <div className="flex-1 bg-white/10 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-400">Your Code</p>
            <p className="text-sm font-mono font-bold text-turquoise">{referralCode}</p>
          </div>
          
          <button
            onClick={copyReferralLink}
            className="px-4 py-2 bg-turquoise text-midnight rounded-lg font-bold flex items-center gap-2 hover:bg-turquoise/90 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div 
        className="bg-slate/50 rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-yellow-500" />
          Achievements ({achievements.filter(a => a.unlocked).length}/{achievements.length})
        </h3>
        
        <div className="grid grid-cols-3 gap-2">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center p-2 ${
                achievement.unlocked
                  ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
                  : 'bg-white/5 border border-gray-600'
              }`}
            >
              <span className={`text-2xl mb-1 ${achievement.unlocked ? '' : 'opacity-30 grayscale'}`}>
                {achievement.icon}
              </span>
              <span className={`text-xs text-center ${achievement.unlocked ? 'text-yellow-400' : 'text-gray-500'}`}>
                {achievement.name}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
