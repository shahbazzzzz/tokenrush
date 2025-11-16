import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { GameSelection } from './screens/GameSelection';
import { CrashMasterGame } from './screens/games/CrashMasterGame';
import { MineQuestGame } from './screens/games/MineQuestGame';
import { DiceHeroGame } from './screens/games/DiceHeroGame';
import { LimboLeapGame } from './screens/games/LimboLeapGame';
import { Profile } from './screens/Profile';
import { Leaderboard } from './screens/Leaderboard';
import { Navigation } from './components/Navigation';

declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
}

function App() {
  const [telegramUser, setTelegramUser] = useState<any>(null);

  useEffect(() => {
    // Initialize Telegram Web App
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Expand to full height
      tg.expand();
      
      // Set app colors
      tg.setBackgroundColor('#1A1A2E');
      tg.setHeaderColor('#1A1A2E');
      
      // Get user data
      if (tg.initDataUnsafe?.user) {
        setTelegramUser(tg.initDataUnsafe.user);
      }

      // Ready
      tg.ready();
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-midnight text-white">
        <div className="max-w-md mx-auto relative pb-20">
          <Routes>
            <Route path="/" element={<GameSelection user={telegramUser} />} />
            <Route path="/game/crash" element={<CrashMasterGame />} />
            <Route path="/game/mines" element={<MineQuestGame />} />
            <Route path="/game/dice" element={<DiceHeroGame />} />
            <Route path="/game/limbo" element={<LimboLeapGame />} />
            <Route path="/profile" element={<Profile user={telegramUser} />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
          
          <Navigation />
        </div>

        <Toaster 
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: '#16213E',
              color: '#FFFFFF',
              border: '1px solid #4ECDC4',
            },
          }}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
