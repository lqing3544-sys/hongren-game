import { useNavigate } from 'react-router-dom';
import {
  Bell,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  FileText,
  ChevronRight,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useGame } from '@/context/GameContext';
import type { IGameEvent, IPost } from '@/data/game';

export default function RightPanel() {
  const { gameState, posts, events } = useGame();
  const navigate = useNavigate();

  if (!gameState) return null;

  const recentEvents: IGameEvent[] = [...(events || [])]
    .sort((a, b) => b.gameDay - a.gameDay)
    .slice(0, 5);

  const recentPosts: IPost[] = [...(posts || [])]
    .sort((a, b) => b.gameDay - a.gameDay)
    .slice(0, 3);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'crisis':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'milestone':
        return <Sparkles className="h-4 w-4 text-primary" />;
      case 'deal':
        return <FileText className="h-4 w-4 text-success" />;
      case 'post':
        return <TrendingUp className="h-4 w-4 text-accent-foreground" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'crisis':
        return 'border-l-destructive';
      case 'milestone':
        return 'border-l-primary';
      case 'deal':
        return 'border-l-success';
      default:
        return 'border-l-accent';
    }
  };

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-80 shrink-0 space-y-4 overflow-y-auto py-4 pr-2 xl:block">
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-primary" />
            动态时间线
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recentEvents.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">还没有动态</p>
              <p className="mt-1 text-xs text-muted-foreground/70">发布第一条内容开始你的红人之路</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className={`border-l-2 ${getEventColor(event.type)} pl-3 py-0.5`}
                >
                  <div className="flex items-start gap-2">
                    {getEventIcon(event.type)}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-card-foreground">
                        {event.title}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        第 {event.gameDay} 天
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent-foreground" />
              最近发布
            </span>
            {recentPosts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-card-foreground"
                onClick={() => navigate('/publish')}
              >
                全部 <ChevronRight className="h-3 w-3" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recentPosts.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              暂无发布记录
            </div>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="cursor-pointer rounded-md p-2 transition-colors hover:bg-accent/30"
                  onClick={() => navigate('/publish')}
                >
                  <div className="truncate text-sm font-medium text-card-foreground">
                    {post.title}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>第 {post.gameDay} 天</span>
                    <span
                      className={
                        post.result.followerChange >= 0
                          ? 'text-success'
                          : 'text-destructive'
                      }
                    >
                      {post.result.followerChange >= 0 ? '+' : ''}
                      {post.result.followerChange} 粉
                    </span>
                  </div>
                  <div className="mt-1.5 flex gap-1">
                    <Badge variant="outline" className="h-4 px-1 text-[10px] font-normal">
                      {post.result.category}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-primary bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">快捷操作</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <Button className="w-full" onClick={() => navigate('/publish')}>
            <Sparkles className="mr-2 h-4 w-4" />
            发布新内容
          </Button>
          {gameState.communityUnlocked && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => navigate('/community')}
            >
              <Users className="mr-2 h-4 w-4" />
              运营粉丝群
            </Button>
          )}
          {gameState.partnershipUnlocked && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => navigate('/partnership')}
            >
              <FileText className="mr-2 h-4 w-4" />
              查看商单邀请
            </Button>
          )}
        </CardContent>
      </Card>

      <Separator className="my-2" />

      <div className="text-center text-xs text-muted-foreground/60">
        红人养成器 · 模拟经营游戏
      </div>
    </aside>
  );
}
