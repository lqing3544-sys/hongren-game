import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Shield, TrendingDown, Users, MessageSquare,
  Clock, CheckCircle2, XCircle, Flame, AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGame } from '@/context/GameContext';
import { generateCrisisEvent, resolveCrisisChoice } from '@/utils/externalAi';
import { toast } from 'sonner';
import RightPanel from '@/components/RightPanel';

export default function CrisisPage() {
  const { gameState, events, addEvent, updateEvent, markEventRead, clearEvents } = useGame();
  const navigate = useNavigate();

  const [activeCrisis, setActiveCrisis] = useState<{
    id: string;
    title: string;
    description: string;
    options: string[];
    severity: 'low' | 'medium' | 'high';
  } | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionResult, setResolutionResult] = useState<{
    followerChange: number;
    loyaltyChange: number;
    feedback: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const unresolvedEvents = events.filter((e) => e.type === 'crisis' && !e.resolved);
  const resolvedEvents = events.filter((e) => e.type === 'crisis' && e.resolved);

  useEffect(() => {
    if (unresolvedEvents.length > 0 && !activeCrisis) {
      const event = unresolvedEvents[0];
      setActiveCrisis({
        id: event.id,
        title: event.title,
        description: event.description || '',
        options: event.options || ['无视，清者自清', '公开澄清声明', '发长文举证反驳', '联系平台举报'],
        severity: event.severity || 'medium',
      });
    }
  }, [unresolvedEvents, activeCrisis]);

  const handleGenerateCrisis = async () => {
    if (!gameState) return;
    setIsGenerating(true);
    try {
      const crisis = await generateCrisisEvent(gameState.mainCategory, gameState.followers);
      const eventId = `crisis_${Date.now()}`;
      addEvent({
        id: eventId,
        type: 'crisis',
        title: crisis.title,
        description: crisis.description,
        options: crisis.options,
        severity: 'high',
        resolved: false,
        timeAgo: '刚刚',
      });
      setActiveCrisis({
        id: eventId,
        title: crisis.title,
        description: crisis.description,
        options: crisis.options,
        severity: 'high',
      });
      toast.warning('新的危机事件出现了！');
    } catch {
      toast.error('生成危机事件失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResolve = async () => {
    if (!activeCrisis || !selectedChoice || !gameState) return;
    setIsResolving(true);
    try {
      const result = await resolveCrisisChoice(
        activeCrisis.title,
        activeCrisis.description,
        selectedChoice,
        gameState.loyalty,
      );
      setResolutionResult(result);
      updateEvent(activeCrisis.id, {
        resolved: true,
        resolution: selectedChoice,
        result: result.feedback,
        followerChange: result.followerChange,
      });
      markEventRead(activeCrisis.id);
      if (result.followerChange !== 0) {
        toast[result.followerChange > 0 ? 'success' : 'error'](
          `粉丝${result.followerChange > 0 ? '+' : ''}${result.followerChange}`,
        );
      }
    } catch {
      toast.error('处理危机失败');
    } finally {
      setIsResolving(false);
    }
  };

  const handleCloseCrisis = () => {
    setActiveCrisis(null);
    setSelectedChoice(null);
    setResolutionResult(null);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-destructive bg-destructive/10';
      case 'medium': return 'text-warning bg-warning/10';
      default: return 'text-accent-foreground bg-accent/10';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return '高危';
      case 'medium': return '中危';
      default: return '低危';
    }
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

  return (
    <div className="flex w-full">
      <div className="flex-1 min-w-0 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-card-foreground">
              <Shield className="h-6 w-6 text-destructive" />危机公关
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              处理负面舆情，维护你的公众形象
            </p>
          </div>
          <Button onClick={handleGenerateCrisis} disabled={isGenerating || unresolvedEvents.length > 0}>
            {isGenerating ? (
              <><svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>生成中...</>
            ) : (
              <><Flame className="mr-2 h-4 w-4" />模拟危机事件</>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                  <span className="text-sm text-muted-foreground">待处理危机</span>
                </div>
                <span className="text-2xl font-bold text-destructive">{unresolvedEvents.length}</span>
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
                  <span className="text-sm text-muted-foreground">已处理危机</span>
                </div>
                <span className="text-2xl font-bold text-success">{resolvedEvents.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/10">
                    <Users className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">粉丝忠诚度</span>
                </div>
                <span className="text-2xl font-bold text-accent-foreground">{gameState.loyalty}%</span>
              </div>
              <Progress value={gameState.loyalty} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
        </div>

        {activeCrisis ? (
          <Card className="border-l-4 border-l-destructive bg-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    {activeCrisis.title}
                  </CardTitle>
                  <Badge className={`mt-2 ${getSeverityColor(activeCrisis.severity)}`}>
                    {getSeverityLabel(activeCrisis.severity)}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCloseCrisis}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-destructive/5 p-4">
                <p className="text-sm leading-relaxed text-card-foreground">{activeCrisis.description}</p>
              </div>

              {!resolutionResult ? (
                <>
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-card-foreground">选择应对方式：</h3>
                    {activeCrisis.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedChoice(option)}
                        className={`w-full rounded-lg border p-4 text-left transition-all ${
                          selectedChoice === option
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border bg-background hover:border-accent hover:bg-accent/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-medium ${
                            selectedChoice === option ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className="text-sm text-card-foreground">{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleResolve}
                      disabled={!selectedChoice || isResolving}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isResolving ? (
                        <><svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>处理中...</>
                      ) : (
                        <><Shield className="mr-2 h-4 w-4" />确认应对方案</>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className={`rounded-lg p-4 ${resolutionResult.followerChange >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {resolutionResult.followerChange >= 0 ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      )}
                      <span className={`font-medium ${resolutionResult.followerChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                        危机处理结果
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-card-foreground">{resolutionResult.feedback}</p>
                    <div className="mt-3 flex gap-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">粉丝变化：</span>
                        <span className={`font-medium ${resolutionResult.followerChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {resolutionResult.followerChange >= 0 ? '+' : ''}{resolutionResult.followerChange}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">忠诚度变化：</span>
                        <span className={`font-medium ${resolutionResult.loyaltyChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {resolutionResult.loyaltyChange >= 0 ? '+' : ''}{resolutionResult.loyaltyChange}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleCloseCrisis}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />完成
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <Shield className="h-8 w-8 text-success" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-card-foreground">当前没有危机事件</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                你的账号运营良好，没有负面舆情需要处理
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                点击上方"模拟危机事件"按钮可以体验危机公关玩法
              </p>
            </CardContent>
          </Card>
        )}

        {resolvedEvents.length > 0 && (
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-muted-foreground" />历史危机记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {resolvedEvents.map((event) => (
                    <div key={event.id} className="rounded-lg border border-border bg-background p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span className="text-sm font-medium text-card-foreground">{event.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{event.timeAgo}</span>
                      </div>
                      {event.resolution && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          应对方式：{event.resolution}
                        </p>
                      )}
                      {event.result && (
                        <p className="mt-1 text-xs text-muted-foreground">{event.result}</p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
      <RightPanel />
    </div>
  );
}
