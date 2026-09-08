import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Send, Search, MoreVertical, UserPlus,
  Trash2, Ban, CheckCircle2, XCircle, Sparkles, Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useGame } from '@/context/GameContext';
import { generateDmReply } from '@/utils/externalAi';
import { toast } from 'sonner';
import RightPanel from '@/components/RightPanel';
import type { IPrivateConversation, IPrivateMessage } from '@/types/game';

export default function MessagesPage() {
  const { gameState, conversations, sendMessage, appendFanMessage, blockConversation, generateRandomDmConversations } = useGame();
  const navigate = useNavigate();

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [isAiReplying, setIsAiReplying] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState<IPrivateConversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages.length]);

  useEffect(() => {
    if (conversations.length === 0 && gameState) {
      generateRandomDmConversations(gameState.followers, gameState.mainCategory);
    }
  }, [gameState, conversations.length, generateRandomDmConversations]);

  const filteredConvs = conversations.filter(
    (c) => c.fanName.includes(searchText) || c.preview.includes(searchText),
  );

  const handleSendReply = async () => {
    if (!activeConvId || !replyText.trim() || isAiReplying) return;
    const content = replyText.trim();
    sendMessage(activeConvId, content);
    setReplyText('');

    setIsAiReplying(true);
    try {
      const aiReply = await generateDmReply({
        fanName: activeConv?.fanName || '粉丝',
        fanProfile: activeConv?.fanProfile || '',
        conversationHistory: activeConv?.messages.slice(-6).map((m) => ({
          role: m.sender === 'fan' ? 'user' : 'assistant',
          content: m.content,
        })) || [],
        userReply: content,
        tone: 'friendly',
      });

      setTimeout(() => {
        appendFanMessage(activeConvId, aiReply || '好的呀，谢谢博主回复~');
        setIsAiReplying(false);
      }, 800 + Math.random() * 1200);
    } catch {
      setTimeout(() => {
        appendFanMessage(activeConvId, '好的呀，谢谢博主回复~');
        setIsAiReplying(false);
      }, 1000);
    }
  };

  const handleBlock = (convId: string) => {
    blockConversation(convId);
    if (activeConvId === convId) setActiveConvId(null);
    toast.info('已拉黑该用户');
  };

  const getConvIcon = (type: string) => {
    switch (type) {
      case 'praise': return <Sparkles className="h-4 w-4 text-success" />;
      case 'request': return <UserPlus className="h-4 w-4 text-accent-foreground" />;
      case 'business': return <Badge className="bg-accent text-accent-foreground text-[10px]">商单</Badge>;
      case 'malicious': return <Ban className="h-4 w-4 text-destructive" />;
      default: return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTime = (time: string) => time;

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
      <div className="flex-1 min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-card-foreground">
              <MessageSquare className="h-6 w-6 text-primary" />私信
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              共 {conversations.length} 条对话
              {conversations.some((c) => !c.read) && (
                <span className="ml-2 text-destructive">
                  · {conversations.filter((c) => !c.read).length} 条未读
                </span>
              )}
            </p>
          </div>
        </div>

        <Card className="h-[calc(100vh-220px)] overflow-hidden bg-card">
          <div className="flex h-full">
            <div className="flex w-72 flex-col border-r border-border">
              <div className="border-b border-border p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="搜索私信..." value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-9 bg-background"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                {filteredConvs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">暂无私信</p>
                  </div>
                ) : (
                  filteredConvs.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setActiveConvId(conv.id)}
                      className={`cursor-pointer border-b border-border/50 p-3 transition-colors hover:bg-accent/5 ${
                        activeConvId === conv.id ? 'bg-accent/10' : ''
                      } ${conv.blocked ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={`text-sm ${
                              conv.type === 'malicious' ? 'bg-destructive/20 text-destructive' :
                              conv.type === 'business' ? 'bg-accent/20 text-accent-foreground' :
                              'bg-primary/20 text-primary'
                            }`}>
                              {conv.fanName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {!conv.read && (
                            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-destructive" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="truncate text-sm font-medium text-card-foreground">
                              {conv.fanName}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="h-3 w-3" />{formatTime(conv.lastMessageTime)}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{conv.preview}</p>
                          <div className="mt-1 flex items-center gap-1">
                            {getConvIcon(conv.type)}
                            <span className="text-[10px] text-muted-foreground">{conv.fanProfile}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>

            <div className="flex flex-1 flex-col">
              {activeConv ? (
                <>
                  <div className="flex items-center justify-between border-b border-border p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={`text-sm ${
                          activeConv.type === 'malicious' ? 'bg-destructive/20 text-destructive' :
                          activeConv.type === 'business' ? 'bg-accent/20 text-accent-foreground' :
                          'bg-primary/20 text-primary'
                        }`}>
                          {activeConv.fanName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-card-foreground">{activeConv.fanName}</span>
                          {getConvIcon(activeConv.type)}
                        </div>
                        <div className="text-xs text-muted-foreground">{activeConv.fanProfile}</div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card">
                        <DropdownMenuItem onClick={() => handleBlock(activeConv.id)} className="text-destructive">
                          <Ban className="mr-2 h-4 w-4" />拉黑用户
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />删除对话
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {activeConv.messages.map((msg: IPrivateMessage, idx: number) => (
                        <div
                          key={msg.id || idx}
                          className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[75%] ${msg.sender === 'me' ? 'order-2' : ''}`}>
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-sm ${
                                msg.sender === 'me'
                                  ? 'rounded-br-sm bg-primary text-primary-foreground'
                                  : 'rounded-bl-sm bg-muted text-card-foreground'
                              }`}
                            >
                              {msg.content}
                            </div>
                            <div className={`mt-1 text-[10px] text-muted-foreground ${msg.sender === 'me' ? 'text-right' : ''}`}>
                              {msg.time}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isAiReplying && (
                        <div className="flex justify-start">
                          <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                            <div className="flex gap-1">
                              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: '0ms' }} />
                              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: '150ms' }} />
                              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {activeConv.blocked ? (
                    <div className="border-t border-border p-4 text-center text-sm text-muted-foreground">
                      <Ban className="mx-auto mb-2 h-5 w-5" />
                      你已拉黑该用户，无法继续对话
                    </div>
                  ) : (
                    <div className="border-t border-border p-4">
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendReply();
                              }
                            }}
                            placeholder="输入回复内容..."
                            rows={1}
                            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <Button onClick={handleSendReply} disabled={!replyText.trim() || isAiReplying} size="icon">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        按 Enter 发送，Shift+Enter 换行
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <MessageSquare className="mb-4 h-16 w-16 text-muted-foreground/30" />
                  <h3 className="text-lg font-medium text-card-foreground">选择一条对话</h3>
                  <p className="mt-1 text-sm text-muted-foreground">从左侧列表中选择私信进行查看和回复</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
      <RightPanel />
    </div>
  );
}
