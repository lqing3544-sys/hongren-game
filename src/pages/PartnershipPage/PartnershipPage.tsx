import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Handshake, DollarSign, TrendingUp, Clock, CheckCircle2,
  XCircle, AlertTriangle, RefreshCw, Star, Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useGame } from '@/context/GameContext';
import { generatePartnershipDeals, resolveDealAcceptance } from '@/utils/externalAi';
import { toast } from 'sonner';
import RightPanel from '@/components/RightPanel';
import type { GeneratedDeal } from '@/utils/externalAi';

export default function PartnershipPage() {
  const { gameState, deals, addDeal, updateDeal, applyDealResult } = useGame();
  const navigate = useNavigate();

  const [availableDeals, setAvailableDeals] = useState<GeneratedDeal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<GeneratedDeal | null>(null);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptResult, setAcceptResult] = useState<{ followerChange: number; feedback: string } | null>(null);

  const partnershipUnlocked = gameState?.partnershipUnlocked || (gameState?.posts?.length || 0) >= 1;
  const activeDeals = deals.filter((d) => d.status === 'active');
  const completedDeals = deals.filter((d) => d.status === 'completed');

  useEffect(() => {
    if (partnershipUnlocked && availableDeals.length === 0) {
      handleRefreshDeals();
    }
  }, [partnershipUnlocked]);

  const handleRefreshDeals = async () => {
    if (!gameState) return;
    setIsLoading(true);
    try {
      const deals = await generatePartnershipDeals(
        gameState.followers,
        gameState.mainCategory,
        gameState.verticality,
      );
      setAvailableDeals(deals);
    } catch {
      toast.error('获取商单失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptDeal = async () => {
    if (!selectedDeal || !gameState) return;
    setIsAccepting(true);
    try {
      const result = await resolveDealAcceptance(
        selectedDeal.brand,
        selectedDeal.productType,
        selectedDeal.requirement,
        gameState.mainCategory,
        gameState.verticality,
        gameState.followers,
      );
      setAcceptResult(result);

      const dealId = `deal_${Date.now()}`;
      addDeal({
        id: dealId,
        brand: selectedDeal.brand,
        productType: selectedDeal.productType,
        budget: selectedDeal.budget,
        requirement: selectedDeal.requirement,
        status: 'active',
        createdAt: new Date().toISOString(),
      });

      setAvailableDeals((prev) => prev.filter((d) => d !== selectedDeal));

      if (result.followerChange !== 0) {
        toast[result.followerChange > 0 ? 'success' : 'error'](
          `粉丝${result.followerChange > 0 ? '+' : ''}${result.followerChange}`,
        );
      }
    } catch {
      toast.error('接受商单失败');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleCompleteDeal = (dealId: string) => {
    updateDeal(dealId, { status: 'completed', completedAt: new Date().toISOString() });
    const deal = deals.find((d) => d.id === dealId);
    if (deal) {
      toast.success(`商单完成！获得 ¥${deal.budget.toLocaleString()}`);
    }
  };

  const getBudgetLevel = (budget: number) => {
    if (budget >= 5000) return { label: '高价商单', color: 'text-success', icon: Star };
    if (budget >= 1000) return { label: '中价商单', color: 'text-accent-foreground', icon: TrendingUp };
    return { label: '低价商单', color: 'text-primary', icon: DollarSign };
  };

  if (!gameState) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="bg-card">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">请先创建游戏角色</p>
            <Button className="mt-4" onClick={() => navigate('/start')}>开始游戏</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!partnershipUnlocked) {
    return (
      <div className="flex w-full">
        <div className="flex-1 min-w-0">
          <Card className="bg-card">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Lock className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="mt-6 text-xl font-bold text-card-foreground">商单合作未解锁</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                发布你的第一条内容后，将自动解锁商单合作功能。
                随着粉丝数和曝光度的提升，你将获得更多、更高价的商单机会。
              </p>
              <Button className="mt-6" onClick={() => navigate('/publish')}>
                去发布第一条内容
              </Button>
            </CardContent>
          </Card>
        </div>
        <RightPanel />
      </div>
    );
  }

  return (
    <div className="flex w-full">
      <div className="flex-1 min-w-0 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-card-foreground">
              <Handshake className="h-6 w-6 text-accent-foreground" />商单合作
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              接受品牌合作，赚取收入，提升影响力
            </p>
          </div>
          <Button onClick={handleRefreshDeals} disabled={isLoading}>
            {isLoading ? (
              <><svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>刷新中...</>
            ) : (
              <><RefreshCw className="mr-2 h-4 w-4" />刷新商单</>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/10">
                    <DollarSign className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">总收入</span>
                </div>
                <span className="text-2xl font-bold text-accent-foreground">
                  ¥{gameState.income.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">进行中</span>
                </div>
                <span className="text-2xl font-bold text-primary">{activeDeals.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-success/10">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <span className="text-sm text-muted-foreground">已完成</span>
                </div>
                <span className="text-2xl font-bold text-success">{completedDeals.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />可接商单
            </CardTitle>
            <CardDescription>选择合适的品牌合作，注意商单与你的领域匹配度</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : availableDeals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Handshake className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">暂无可接商单，点击上方按钮刷新</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableDeals.map((deal, idx) => {
                  const budgetInfo = getBudgetLevel(deal.budget);
                  const BudgetIcon = budgetInfo.icon;
                  const isRelevant = deal.productType.includes(gameState.mainCategory) || gameState.mainCategory.includes(deal.productType);
                  return (
                    <div key={idx} className="rounded-lg border border-border bg-background p-4 transition-colors hover:border-accent">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-card-foreground">{deal.brand}</span>
                            <Badge className={budgetInfo.color.replace('text-', 'bg-').replace('foreground', '') + '/10 ' + budgetInfo.color}>
                              <BudgetIcon className="mr-1 h-3 w-3" />
                              {budgetInfo.label}
                            </Badge>
                            {isRelevant && (
                              <Badge className="bg-success/10 text-success">领域匹配</Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{deal.productType}</p>
                          <p className="mt-2 text-xs text-muted-foreground">{deal.requirement}</p>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-lg font-bold text-accent-foreground">
                            ¥{deal.budget.toLocaleString()}
                          </div>
                          <Button
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              setSelectedDeal(deal);
                              setAcceptResult(null);
                              setAcceptDialogOpen(true);
                            }}
                          >
                            接受合作
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {activeDeals.length > 0 && (
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-primary" />进行中的商单
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeDeals.map((deal) => (
                  <div key={deal.id} className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-card-foreground">{deal.brand}</span>
                          <Badge className="bg-primary/10 text-primary">进行中</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{deal.productType}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-accent-foreground">
                          ¥{deal.budget.toLocaleString()}
                        </div>
                        <Button size="sm" className="mt-2" onClick={() => handleCompleteDeal(deal.id)}>
                          <CheckCircle2 className="mr-1 h-3 w-3" />标记完成
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {completedDeals.length > 0 && (
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4 text-success" />已完成商单
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {completedDeals.map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-sm text-card-foreground">{deal.brand}</span>
                        <span className="text-xs text-muted-foreground">{deal.productType}</span>
                      </div>
                      <span className="text-sm font-medium text-success">+¥{deal.budget.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
      <RightPanel />

      <AlertDialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>确认接受商单？</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedDeal && (
                <div className="space-y-2">
                  <p><strong>品牌：</strong>{selectedDeal.brand}</p>
                  <p><strong>产品：</strong>{selectedDeal.productType}</p>
                  <p><strong>报酬：</strong>¥{selectedDeal.budget.toLocaleString()}</p>
                  <p><strong>要求：</strong>{selectedDeal.requirement}</p>
                  <div className="mt-3 rounded-lg bg-muted p-3 text-sm">
                    <div className="flex items-center gap-2 text-warning">
                      <AlertTriangle className="h-4 w-4" />
                      <span>注意：接受与你领域不匹配的商单可能导致掉粉</span>
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {acceptResult ? (
            <div className={`rounded-lg p-4 ${acceptResult.followerChange >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
              <div className="flex items-center gap-2 mb-2">
                {acceptResult.followerChange >= 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <span className={`font-medium ${acceptResult.followerChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                  商单接受结果
                </span>
              </div>
              <p className="text-sm text-card-foreground">{acceptResult.feedback}</p>
              <div className="mt-2 text-sm">
                <span className="text-muted-foreground">粉丝变化：</span>
                <span className={`font-medium ${acceptResult.followerChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {acceptResult.followerChange >= 0 ? '+' : ''}{acceptResult.followerChange}
                </span>
              </div>
            </div>
          ) : null}
          <AlertDialogFooter>
            {acceptResult ? (
              <AlertDialogAction onClick={() => setAcceptDialogOpen(false)}>完成</AlertDialogAction>
            ) : (
              <>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleAcceptDeal}
                  disabled={isAccepting}
                >
                  {isAccepting ? '处理中...' : '确认接受'}
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
