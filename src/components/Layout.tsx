import { Outlet, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import AppSidebar from '@/components/AppSidebar';
import RightPanel from '@/components/RightPanel';
import { GameProvider } from '@/context/GameContext';

function MainLayout() {
  const { gameState } = useGame();
  const location = useLocation();

  const isStartPage = location.pathname === '/start';

  if (isStartPage) {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1 w-full min-h-0">
        {gameState && <AppSidebar />}
        <main className="flex-1 w-full min-w-0 overflow-x-hidden">
          <div className="max-w-3xl mx-auto px-4 py-6 md:px-6">
            <Outlet />
          </div>
        </main>
        {gameState && <RightPanel />}
      </div>
    </div>
  );
}

export const Layout = () => {
  return (
    <GameProvider>
      <MainLayout />
    </GameProvider>
  );
};
