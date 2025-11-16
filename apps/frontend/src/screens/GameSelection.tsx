import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import { CrashMasterIcon } from '../components/GameAssets/CrashMasterIcon';
import { MineQuestIcon } from '../components/GameAssets/MineQuestIcon';
import { DiceHeroIcon } from '../components/GameAssets/DiceHeroIcon';
import { LimboLeapIcon } from '../components/GameAssets/LimboLeapIcon';

interface Props {
  user: any;
}

const games = [
  {
    id: 'crash',
    name: 'CrashMaster',
    description: 'Cash out before it crashes!',
    icon: CrashMasterIcon,
    path: '/game/crash',
    color: 'from-red-500 to-orange-500',
  },
  {
    id: 'mines',
    name: 'MineQuest',
    description: 'Find gems, avoid mines!',
    icon: MineQuestIcon,
    path: '/game/mines',
    color: 'from-cyan-500 to-teal-500',
  },
  {
    id: 'dice',
    name: 'DiceHero',
    description: 'Roll lucky numbers!',
    icon: DiceHeroIcon,
    path: '/game/dice',
    color: 'from-yellow-500 to-amber-500',
  },
  {
    id: 'limbo',
    name: 'LimboLeap',
    description: 'Leap high for big wins!',
    icon: LimboLeapIcon,
    path: '/game/limbo',
    color: 'from-purple-500 to-pink-500',
  },
];

export const GameSelection = ({ user }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.h1 
          className="text-4xl font-bold text-gradient mb-2"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          TokenRush
        </motion.h1>
        
        {user && (
          <motion.p 
            className="text-turquoise"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Welcome, {user.first_name || user.username}!
          </motion.p>
        )}
      </div>

      {/* Balance Display */}
      <motion.div 
        className="flex justify-center mb-8"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <div className="coin-display">
          <Coins className="w-6 h-6 text-sunshine" />
          <span className="text-xl font-bold text-sunshine">1,250</span>
        </div>
      </motion.div>

      {/* Games Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {games.map((game, index) => {
          const Icon = game.icon;
          return (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(game.path)}
              className="game-card cursor-pointer"
            >
              <div className="w-full h-32 mb-3">
                <Icon />
              </div>
              
              <h3 className="text-lg font-bold text-white mb-1">
                {game.name}
              </h3>
              
              <p className="text-sm text-gray-400">
                {game.description}
              </p>
              
              <div className="mt-3">
                <span className={`inline-block px-3 py-1 text-xs rounded-full bg-gradient-to-r ${game.color} text-white font-semibold`}>
                  PLAY NOW
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Daily Bonus Button */}
      <motion.div
        className="space-y-3"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <button className="btn-primary w-full flex items-center justify-center gap-2">
          <span className="text-xl">🎁</span>
          Claim Daily Bonus
        </button>

        <button className="btn-secondary w-full flex items-center justify-center gap-2">
          <span className="text-xl">📺</span>
          Watch Ad +50 Tokens
        </button>
      </motion.div>
    </div>
  );
};
