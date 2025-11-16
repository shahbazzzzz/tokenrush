import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Trophy, User, Gift, Gamepad2 } from 'lucide-react';

const navItems = [
  { icon: Home, path: '/', label: 'Home' },
  { icon: Trophy, path: '/leaderboard', label: 'Leaderboard' },
  { icon: User, path: '/profile', label: 'Profile' },
];

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate border-t border-turquoise/20">
      <div className="max-w-md mx-auto">
        <nav className="flex justify-around items-center h-16">
          {navItems.map(({ icon: Icon, path, label }) => {
            const isActive = location.pathname === path;
            
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center gap-1 px-6 py-2 transition-all ${
                  isActive 
                    ? 'text-turquoise scale-110' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
