import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Target,
  Heart,
  Coins,
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  FileText,
  ChevronRight,
  Bell,
  PenSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useGame } from '@/context/GameContext';
import RightPanel from '@/components/RightPanel';
import type { IGameEvent } from '@/data/game';

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  cold_start: { label: '冷启动', color: 'bg-muted text-muted-foreground' },
  growth: { label: '成长期', color: 'bg-accent text-accent-foreground' },
  boom: { label: '爆发期', color: 'bg-primary/10 text-primary' },
  influencer: { label: '达人期', color: 'bg-success/10 text-success' },
};

export default function DashboardPage() {
  const { gameState, posts, events } = useGame();
  const navigate = useNavigate();

  const todayStats = useMemo(() => {
    if (!posts || posts.length === 0) return { totalPosts: 0, avgScore: 0 };
    const avgScore =
      posts.reduce(
        (sum, p) =>
          sum +
          (p.result.scores.titleAppeal +
            p.result.scores.infoDensity +
            p.result.scores.emotionalResonance +
            p.result.scores.topicality) /
            4,
        0,
      ) / posts.length;
    return { totalPosts: posts.length, avgScore: Math.round(avgScore) };
  }, [posts]);

  const sortedEvents: IGameEvent[] = useMemo(() => {
    if (!events) return [];
    return [...events].sort((a, b) => b.gameDay - a.gameDay);
  }, [events]);

  const formatNumber = (n: number) => {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toLocaleString();
  };

  if (!gameState) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="bg-card">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">正在加载游戏状态...</p>
            <Button className="mt-4" onClick={() => navigate('/start')}>
              开始新游戏
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stageInfo = STAGE_LABELS[gameState.stage] || STAGE_LABELS.cold_start;

  return (
    <div className="flex w-full">
      <div className="flex-1 min-w-0">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">
              你好，{gameState.nickname}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              第 {gameState.gameDay} 天 · 主领域：{gameState.mainCategory}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${stageInfo.color} border-0 text-xs font-medium`}>
              {stageInfo.label}
            </Badge>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card className="border-l-4 border-l-primary bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                粉丝数
              </div>
              <div className="mt-2 font-display text-2xl font-bold tracking-tight text-primary md:text-3xl">
                {formatNumber(gameState.followers)}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                {gameState.followers > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-success">增长中</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">起步中</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                垂直度
              </div>
              <div className="mt-2 font-display text-2xl font-bold tracking-tight text-accent-foreground md:text-3xl">
                {gameState.verticality}
                <span className="text-sm font-normal">/100</span>
              </div>
              <Progress
                value={gameState.verticality}
                className="mt-2 h-1.5 bg-muted"
              />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Heart className="h-3.5 w-3.5" />
                粉丝粘性
              </div>
              <div className="mt-2 font-display text-2xl font-bold tracking-tight text-success md:text-3xl">
                {gameState.loyalty}
                <span className="text-sm font-normal">/100</span>
              </div>
              <Progress
                value={gameState.loyalty}
                className="mt-2 h-1.5 bg-muted"
              />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Coins className="h-3.5 w-3.5" />
                总收入
              </div>
              <div className="mt-2 font-display text-2xl font-bold tracking-tight text-card-foreground md:text-3xl">
                ¥{formatNumber(gameState.income)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {gameState.income > 0 ? '已开始变现' : '尚未变现'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">内容创作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="text-sm text-muted-foreground">
                发布新内容是涨粉的核心途径。持续输出高质量内容，吸引更多粉丝关注。
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-semibold text-card-foreground">
                    {todayStats.totalPosts}
                  </span>
                  <span className="text-muted-foreground"> 篇已发布</span>
                  <span className="mx-2 text-border">|</span>
                  <span className="font-semibold text-card-foreground">
                    {todayStats.avgScore || '--'}
                  </span>
                  <span className="text-muted-foreground"> 平均质量分</span>
                </div>
                <Button onClick={() => navigate('/publish')}>
                  <PenSquare className="mr-2 h-4 w-4" />
                  去发帖
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                游戏提示
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="text-sm text-muted-foreground">
                红人之路不会一帆风顺。保持内容垂直度，积极回复粉丝评论，合理应对商单合作。
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  发布更多内容来提升粉丝数和影响力
                </div>
                <Button variant="secondary" onClick={() => navigate('/messages')}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  查看私信
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-primary" />
              动态时间线
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {sortedEvents.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  还没有发布内容
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  发布第一条内容，开启你的红人成长之路
                </p>
                <Button className="mt-4" size="sm" onClick={() => navigate('/publish')}>
                  <PenSquare className="mr-2 h-4 w-4" />
                  立即发布
                </Button>
              </div>
            ) : (
              <div className="space-y-0">
                {sortedEvents.slice(0, 10).map((event, i) => (
                  <div key={event.id}>
                    {i > 0 && <Separator className="my-2" />}
                    <div className="flex items-start gap-3 py-2">
                      <div
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                          event.type === 'crisis'
                            ? 'bg-destructive/10 text-destructive'
                            : event.type === 'milestone'
                              ? 'bg-primary/10 text-primary'
                              : event.type === 'deal'
                                ? 'bg-success/10 text-success'
                                : 'bg-accent text-accent-foreground'
                        }`}
                      >
                        {event.type === 'crisis' && <AlertTriangle className="h-3.5 w-3.5" />}
                        {event.type === 'milestone' && <Sparkles className="h-3.5 w-3.5" />}
                        {event.type === 'deal' && <FileText className="h-3.5 w-3.5" />}
                        {event.type === 'post' && <TrendingUp className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-card-foreground">
                            {event.title}
                          </span>
                          <Badge
                            variant="outline"
                            className="h-4 shrink-0 px-1 text-[10px] font-normal"
                          >
                            第 {event.gameDay} 天
                          </Badge>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {event.description}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <RightPanel />
    </div>
  );
}
