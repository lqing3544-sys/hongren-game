import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PenSquare,
  MessageCircle,
  Users,
  Briefcase,
  TrendingUp,
  Target,
  Coins,
  Lock,
} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const NAV_ITEMS = [
  { path: '/', label: '数据面板', icon: LayoutDashboard, unlockKey: null as string | null },
  { path: '/publish', label: '发布内容', icon: PenSquare, unlockKey: null as string | null },
  { path: '/messages', label: '私信消息', icon: MessageCircle, unlockKey: null as string | null },
  { path: '/community', label: '粉丝社群', icon: Users, unlockKey: 'communityUnlocked' },
  { path: '/partnership', label: '商单合作', icon: Briefcase, unlockKey: 'partnershipUnlocked' },
];

const STAGE_LABELS: Record<string, string> = {
  cold_start: '冷启动',
  growth: '成长期',
  boom: '爆发期',
  influencer: '达人期',
};

export default function AppSidebar() {
  const { gameState } = useGame();

  if (!gameState) return null;

  const isUnlocked = (key: string | null) => {
    if (!key) return true;
    return (gameState as Record<string, boolean>)[key];
  };

  const formatNumber = (n: number) => {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  };

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-border/20 px-3 py-4 lg:block">
        <div className="space-y-6">
          <Card className="border-l-4 border-l-primary bg-card">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">粉丝数</div>
              <div className="mt-1 font-display text-3xl font-bold tracking-tight text-primary">
                {formatNumber(gameState.followers)}
              </div>
              <div className="mt-1 text-xs">
                <span className="text-success">
                  {STAGE_LABELS[gameState.stage] || '冷启动'}
                </span>
                <span className="ml-2 text-muted-foreground">第 {gameState.gameDay} 天</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Target className="h-3.5 w-3.5" />
                  垂直度
                </span>
                <span className="font-medium text-accent-foreground">
                  {gameState.verticality}
                </span>
              </div>
              <Progress
                value={gameState.verticality}
                className="h-1.5 bg-muted"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MessageCircle className="h-3.5 w-3.5" />
                  粉丝粘性
                </span>
                <span className="font-medium text-accent-foreground">{gameState.loyalty}</span>
              </div>
              <Progress
                value={gameState.loyalty}
                className="h-1.5 bg-muted"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Coins className="h-3.5 w-3.5" />
                总收入
              </span>
              <span className="font-display text-sm font-bold text-card-foreground">
                ¥{gameState.income.toLocaleString()}
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              功能导航
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const unlocked = isUnlocked(item.unlockKey);

              if (!unlocked) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      <div className="flex w-full cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm opacity-40">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        <Lock className="h-3.5 w-3.5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      {item.unlockKey === 'communityUnlocked'
                        ? '粉丝达到 1,000 解锁'
                        : '发布第一条内容后解锁'}
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
                    `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-card-foreground'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <Card className="bg-accent/30">
            <CardContent className="p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-accent-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                下一里程碑
              </div>
              <div className="text-xs text-accent-foreground/80">
                {gameState.followers < 1000 &&
                  `还差 ${(1000 - gameState.followers).toLocaleString()} 粉丝解锁社群功能`}
                {gameState.followers >= 1000 && gameState.followers < 10000 &&
                  `还差 ${(10000 - gameState.followers).toLocaleString()} 粉丝进入达人期`}
                {gameState.followers >= 10000 && '你已经是达人啦，继续加油！'}
              </div>
            </CardContent>
          </Card>
        </div>
      </aside>
    </TooltipProvider>
  );
}
