import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, MessageCircle, Gift, Calendar, Heart, TrendingUp,
  Send, Sparkles, Crown, Star, Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGame } from '@/context/GameContext';
import { generateCommunityChat, runCommunityActivity } from '@/utils/externalAi';
import { toast } from 'sonner';
import RightPanel from '@/components/RightPanel';
import type { FanCommentStream } from '@/utils/externalAi';

export default function CommunityPage() {
  const { gameState, updateGameState } = useGame();
  const navigate = useNavigate();

  const [chatMessages, setChatMessages] = useState<FanCommentStream[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [activityResult, setActivityResult] = useState<{
    feedback: string;
    loyaltyGain: number;
    messages: FanCommentStream[];
  } | null>(null);
  const [isRunningActivity, setIsRunningActivity] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const communityUnlocked = gameState?.communityUnlocked || (gameState?.followers || 0) >= 1000;
  const loyalty = gameState?.loyalty || 0;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  useEffect(() => {
    if (communityUnlocked && chatMessages.length === 0) {
      handleGenerateChat('日常闲聊', 'chat');
    }
  }, [communityUnlocked]);

  const handleGenerateChat = async (topic: string, type: string) => {
    if (!gameState) return;
    setIsChatLoading(true);
    setChatMessages([]);
    try {
      await generateCommunityChat(gameState.loyalty, topic, type, (msg) => {
        setChatMessages((prev) => [...prev, msg]);
      });
    } catch {
      toast.error('生成社群聊天失败');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg: FanCommentStream = {
      id: `user_${Date.now()}`,
      avatarLabel: '我',
      profile: '博主',
      content: chatInput,
      sentiment: 'positive',
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    setTimeout(() => {
      const replies = [
        '博主说得对！',
        '哇，博主亲自发言了！',
        '支持博主！',
        '学到了，感谢分享~',
        '这个观点很新颖！',
      ];
      const reply: FanCommentStream = {
        id: `reply_${Date.now()}`,
        avatarLabel: '粉',
        profile: '热心粉丝',
        content: replies[Math.floor(Math.random() * replies.length)],
        sentiment: 'positive',
      };
      setChatMessages((prev) => [...prev, reply]);
    }, 800 + Math.random() * 1000);
  };

  const handleRunActivity = async (activityType: string) => {
    if (!gameState) return;
    setIsRunningActivity(true);
    setActivityResult(null);
    try {
      const result = await runCommunityActivity(gameState.loyalty, activityType, gameState.mainCategory);
      setActivityResult(result);
      updateGameState({ loyalty: Math.min(100, gameState.loyalty + result.loyaltyGain) });
      toast.success(`活动完成！忠诚度 +${result.loyaltyGain}`);
    } catch {
      toast.error('活动执行失败');
    } finally {
      setIsRunningActivity(false);
    }
  };

  const getLoyaltyLevel = (loyalty: number) => {
    if (loyalty >= 80) return { label: '死忠粉', color: 'text-success', icon: Crown };
    if (loyalty >= 60) return { label: '核心粉', color: 'text-accent-foreground', icon: Star };
    if (loyalty >= 40) return { label: '活跃粉', color: 'text-primary', icon: Heart };
    return { label: '路人粉', color: 'text-muted-foreground', icon: Users };
  };

  const loyaltyInfo = getLoyaltyLevel(loyalty);
  const LoyaltyIcon = loyaltyInfo.icon;

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

  if (!communityUnlocked) {
    return (
      <div className="flex w-full">
        <div className="flex-1 min-w-0">
          <Card className="bg-card">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Lock className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="mt-6 text-xl font-bold text-card-foreground">粉丝社群未解锁</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                当你的粉丝数达到 1000 时，将自动解锁粉丝社群功能。
                社群可以帮助你与核心粉丝建立更紧密的联系，提高粉丝忠诚度。
              </p>
              <div className="mt-6 w-full max-w-sm">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">解锁进度</span>
                  <span className="font-medium text-card-foreground">{gameState.followers} / 1000</span>
                </div>
                <Progress value={(gameState.followers / 1000) * 100} className="h-2" />
              </div>
              <Button className="mt-6" onClick={() => navigate('/publish')}>
                去发布内容涨粉
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
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-card-foreground">
            <Users className="h-6 w-6 text-accent-foreground" />粉丝社群
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            与你的核心粉丝互动，提高粉丝忠诚度
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">社群人数</span>
                </div>
                <span className="text-2xl font-bold text-card-foreground">
                  {Math.round(gameState.followers * 0.15).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/10">
                    <LoyaltyIcon className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">粉丝忠诚度</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-card-foreground">{loyalty}%</span>
                  <div className={`text-xs ${loyaltyInfo.color}`}>{loyaltyInfo.label}</div>
                </div>
              </div>
              <Progress value={loyalty} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-success/10">
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>
                  <span className="text-sm text-muted-foreground">今日活跃</span>
                </div>
                <span className="text-2xl font-bold text-success">
                  +{Math.round(gameState.followers * 0.02)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />快速话题
            </CardTitle>
            <CardDescription>点击话题快速生成社群聊天内容</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {['日常闲聊', '内容讨论', '福利预告', '行业热点', '粉丝问答'].map((topic) => (
                <Button
                  key={topic}
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateChat(topic, 'chat')}
                  disabled={isChatLoading}
                >
                  {topic}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">
              <MessageCircle className="mr-2 h-4 w-4" />社群聊天
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Gift className="mr-2 h-4 w-4" />社群活动
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <Card className="bg-card">
              <CardContent className="p-0">
                <div className="flex h-[500px] flex-col">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {chatMessages.length === 0 && !isChatLoading && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground/40" />
                          <p className="text-sm text-muted-foreground">选择上方话题开始聊天</p>
                        </div>
                      )}
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                            {msg.avatarLabel}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-card-foreground">{msg.profile}</span>
                            </div>
                            <div className="mt-1 rounded-lg bg-muted px-3 py-2 text-sm text-card-foreground">
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          粉丝正在发言...
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="border-t border-border p-3">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="在社群中发言..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="bg-background"
                      />
                      <Button onClick={handleSendMessage} size="icon" disabled={!chatInput.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                { type: 'lottery', name: '抽奖活动', icon: Gift, desc: '发起抽奖，吸引粉丝参与，快速提升活跃度' },
                { type: 'checkin', name: '打卡活动', icon: Calendar, desc: '组织连续打卡，培养粉丝习惯，增强粘性' },
                { type: 'qa', name: '问答互动', icon: MessageCircle, desc: '在线回答粉丝问题，拉近与粉丝的距离' },
              ].map((activity) => {
                const ActivityIcon = activity.icon;
                return (
                  <Card key={activity.type} className="bg-card">
                    <CardContent className="p-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <ActivityIcon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="mt-4 font-semibold text-card-foreground">{activity.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{activity.desc}</p>
                      <Button
                        className="mt-4 w-full"
                        onClick={() => handleRunActivity(activity.type)}
                        disabled={isRunningActivity}
                      >
                        {isRunningActivity ? '执行中...' : `发起${activity.name}`}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {activityResult && (
              <Card className="mt-4 border-l-4 border-l-success bg-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-success" />
                    <h3 className="font-semibold text-card-foreground">活动圆满结束！</h3>
                    <Badge className="bg-success/10 text-success">忠诚度 +{activityResult.loyaltyGain}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{activityResult.feedback}</p>
                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">粉丝反馈：</div>
                    {activityResult.messages.slice(0, 3).map((msg) => (
                      <div key={msg.id} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">
                          {msg.avatarLabel}
                        </div>
                        <span className="text-sm text-card-foreground">{msg.content}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <RightPanel />
    </div>
  );
}
