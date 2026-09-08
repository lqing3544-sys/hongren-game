import { useNavigate, Link } from 'react-router-dom';
import { Home, ArrowLeft, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/context/GameContext';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { gameState } = useGame();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <SearchX className="h-10 w-10 text-primary" />
          </div>

          <h1 className="font-display text-7xl font-bold tracking-tight text-primary md:text-8xl">
            404
          </h1>

          <h2 className="mt-4 text-xl font-semibold text-card-foreground md:text-2xl">
            页面走丢了
          </h2>

          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            抱歉，你访问的页面不存在或已被移除。
            <br />
            也许是内容被删除了，或者链接输入有误。
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回上一页
            </Button>
            <Button
              onClick={() => navigate(gameState ? '/' : '/start')}
              className="w-full sm:w-auto"
            >
              <Home className="mr-2 h-4 w-4" />
              {gameState ? '返回首页' : '开始游戏'}
            </Button>
          </div>

          {gameState && (
            <div className="mt-10">
              <div className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                快速导航
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Link
                  to="/"
                  className="rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-accent hover:bg-accent/10"
                >
                  <div className="font-medium text-card-foreground">数据面板</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">查看核心数据</div>
                </Link>
                <Link
                  to="/publish"
                  className="rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-accent hover:bg-accent/10"
                >
                  <div className="font-medium text-card-foreground">发布内容</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">创作涨粉内容</div>
                </Link>
                {gameState.communityUnlocked && (
                  <Link
                    to="/community"
                    className="rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-accent hover:bg-accent/10"
                  >
                    <div className="font-medium text-card-foreground">粉丝社群</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">运营粉丝群</div>
                  </Link>
                )}
                {gameState.partnershipUnlocked && (
                  <Link
                    to="/partnership"
                    className="rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-accent hover:bg-accent/10"
                  >
                    <div className="font-medium text-card-foreground">商单合作</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">接商单赚钱</div>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto pt-12 text-center text-xs text-muted-foreground/60">
          红人养成器 · 模拟经营游戏
        </div>
      </div>
    </div>
  );
}
