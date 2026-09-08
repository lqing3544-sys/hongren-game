import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Edit3, Users, Briefcase, ChevronDown, RotateCcw, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGame } from '@/context/GameContext';

const NAV_ITEMS = [
  { path: '/', label: '主页', icon: Home, unlockKey: null as string | null },
  { path: '/publish', label: '发帖', icon: Edit3, unlockKey: null as string | null },
  { path: '/community', label: '社群', icon: Users, unlockKey: 'communityUnlocked' },
  { path: '/partnership', label: '商单', icon: Briefcase, unlockKey: 'partnershipUnlocked' },
];

export default function Header() {
  const { gameState, resetGame } = useGame();
  const navigate = useNavigate();
  const [resetOpen, setResetOpen] = useState(false);

  const isUnlocked = (key: string | null) => {
    if (!key) return true;
    return gameState ? (gameState as Record<string, boolean>)[key] : false;
  };

  const getUnlockHint = (key: string | null) => {
    if (key === 'communityUnlocked') return '粉丝达到 1,000 解锁';
    if (key === 'partnershipUnlocked') return '发布第一条内容后解锁';
    return '';
  };

  const handleReset = () => {
    resetGame();
    navigate('/start');
    setResetOpen(false);
  };

  if (!gameState) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground">
              红
            </div>
            <span className="font-semibold text-card-foreground">红人养成器</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground">
              红
            </div>
            <span className="hidden font-semibold text-card-foreground sm:inline">红人养成器</span>
          </div>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const unlocked = isUnlocked(item.unlockKey);

              const linkContent = (
                <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{item.label}</span>
                </span>
              );

              if (!unlocked) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      <div className="cursor-not-allowed opacity-40">{linkContent}</div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {getUnlockHint(item.unlockKey)}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-card-foreground'
                  }
                >
                  {linkContent}
                </NavLink>
              );
            })}
          </nav>

          <DropdownMenu open={resetOpen} onOpenChange={setResetOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 px-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {gameState.nickname.charAt(0)}
                </div>
                <span className="hidden max-w-[80px] truncate text-sm text-card-foreground sm:inline">
                  {gameState.nickname}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card text-card-foreground">
              <DropdownMenuLabel>
                <div className="space-y-0.5">
                  <div className="font-semibold">{gameState.nickname}</div>
                  <div className="text-xs font-normal text-muted-foreground">{gameState.bio}</div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <User className="h-4 w-4" />
                主领域：{gameState.mainCategory}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Briefcase className="h-4 w-4" />
                游戏日：第 {gameState.gameDay} 天
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-destructive focus:text-destructive"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4" />
                重新开始
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </TooltipProvider>
  );
}
