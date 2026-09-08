import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, Image, Sparkles, TrendingUp, Eye, Heart, MessageSquare,
  Share2, Bookmark, MoreHorizontal, Clock, Award, AlertTriangle,
  CheckCircle2, XCircle, RefreshCw, Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useGame } from '@/context/GameContext';
import { evaluateContent, generateFanComments } from '@/utils/externalAi';
import { toast } from 'sonner';
import RightPanel from '@/components/RightPanel';
import type { IPost, IComment, EvaluateResult, FanCommentStream } from '@/types/game';

const INVENTORY_ITEMS = [
  { id: 1, title: '今天分享一个超实用的小技巧', content: '大家好呀！今天给大家分享一个我最近发现的超实用小技巧，真的改变了我的生活！', category: '通用', quality: 'high' },
  { id: 2, title: '避雷！这个东西千万别买', content: '踩雷了家人们，今天必须给大家避雷一个产品，真的太坑了...', category: '通用', quality: 'medium' },
  { id: 3, title: '我的日常vlog记录', content: '记录一下平凡又充实的一天，希望大家喜欢~', category: '通用', quality: 'medium' },
  { id: 4, title: '干货分享｜新手必看', content: '整理了很久的干货，新手朋友一定要收藏！', category: '通用', quality: 'high' },
  { id: 5, title: '无语了，这也能行？', content: '今天遇到一件特别无语的事情，必须来吐槽一下...', category: '通用', quality: 'low' },
  { id: 6, title: '好物推荐｜性价比超高', content: '最近挖到的宝藏好物，性价比真的绝了，强烈推荐给大家！', category: '通用', quality: 'high' },
];

export default function PublishPage() {
  const { gameState, posts, addPost, applyPostResult, addCommentReply, incrementCommentLikes } = useGame();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageDescriptions, setImageDescriptions] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{
    post: IPost;
    evaluation: EvaluateResult;
    comments: FanCommentStream[];
  } | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('compose');

  const charCount = content.length;
  const canPublish = title.trim().length > 0 && content.trim().length > 0 && !isPublishing;

  const handleAddImage = () => {
    if (!imageInput.trim()) return;
    if (imageDescriptions.length >= 9) {
      toast.warning('最多只能添加9张配图描述');
      return;
    }
    setImageDescriptions((prev) => [...prev, imageInput.trim()]);
    setImageInput('');
  };

  const handleRemoveImage = (index: number) => {
    setImageDescriptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectInventory = (item: typeof INVENTORY_ITEMS[0]) => {
    setTitle(item.title);
    setContent(item.content);
    setInventoryOpen(false);
    toast.success('已从存货库选择内容');
  };

  const handlePublish = async () => {
    if (!gameState || !canPublish) return;
    setIsPublishing(true);
    setPublishResult(null);

    try {
      const evaluation = await evaluateContent(
        title,
        content,
        gameState.mainCategory,
        gameState.verticality,
      );

      const postId = `post_${Date.now()}`;
      const newPost: IPost = {
        id: postId,
        title,
        content,
        imageDescriptions: imageDescriptions.length > 0 ? imageDescriptions : undefined,
        category: evaluation.category,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
        shares: 0,
        views: 0,
        qualityScore: evaluation.overallScore,
      };

      const comments: FanCommentStream[] = [];
      await generateFanComments(
        gameState.stage,
        evaluation.overallScore,
        gameState.verticality,
        evaluation.category,
        (comment) => {
          comments.push(comment);
        },
      );

      newPost.comments = comments.map((c) => ({
        id: c.id,
        author: c.profile.split('/')[0],
        avatarLabel: c.avatarLabel,
        content: c.content,
        likes: Math.floor(Math.random() * 50),
        timeAgo: '刚刚',
        sentiment: c.sentiment,
      }));

      const viralChance = evaluation.overallScore >= 80 ? 0.3 : evaluation.overallScore >= 60 ? 0.1 : 0.02;
      const isViral = Math.random() < viralChance;

      const baseViews = Math.max(10, gameState.followers * 0.1 * (evaluation.overallScore / 50));
      const views = Math.round(isViral ? baseViews * 10 : baseViews * (0.5 + Math.random()));
      const likes = Math.round(views * (0.05 + Math.random() * 0.1));
      const shares = Math.round(views * (0.01 + Math.random() * 0.03));

      newPost.views = views;
      newPost.likes = likes;
      newPost.shares = shares;
      newPost.isViral = isViral;

      const followerGain = Math.round(
        (isViral ? views * 0.05 : views * 0.01) * (evaluation.categoryMatch === 'high' ? 1.5 : 1),
      );

      addPost(newPost);
      applyPostResult(newPost, 0);

      setPublishResult({ post: newPost, evaluation, comments });

      if (isViral) {
        toast.success('爆款！你的内容火了！');
      } else if (followerGain > 0) {
        toast.success(`发布成功！粉丝 +${followerGain}`);
      } else {
        toast.info('发布成功');
      }

      setTitle('');
      setContent('');
      setImageDescriptions([]);
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('发布失败，请重试');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReplyComment = (postId: string, commentId: string) => {
    const replyText = commentInputs[commentId];
    if (!replyText?.trim()) return;
    addCommentReply(postId, commentId, {
      id: `reply_${Date.now()}`,
      content: replyText.trim(),
      timeAgo: '刚刚',
    });
    setCommentInputs((prev) => ({ ...prev, [commentId]: '' }));
    toast.success('回复成功');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getMatchBadge = (match: string) => {
    switch (match) {
      case 'high': return <Badge className="bg-success/10 text-success">高度匹配</Badge>;
      case 'medium': return <Badge className="bg-primary/10 text-primary">中等匹配</Badge>;
      default: return <Badge className="bg-warning/10 text-warning">低匹配</Badge>;
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
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-card-foreground">
            <Send className="h-6 w-6 text-primary" />发布内容
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            创作优质内容，提升你的影响力和粉丝数
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compose">
              <Sparkles className="mr-2 h-4 w-4" />创作发布
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="mr-2 h-4 w-4" />历史内容
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="h-4 w-4 text-primary" />创作新内容
                    </CardTitle>
                    <CardDescription>
                      你的主领域是「{gameState.mainCategory}」，保持内容垂直度有助于涨粉
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="title">标题</Label>
                      <Input
                        id="title"
                        placeholder="输入一个吸引人的标题..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={50}
                        className="bg-background"
                      />
                      <div className="text-right text-xs text-muted-foreground">{title.length}/50</div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">正文内容</Label>
                      <Textarea
                        id="content"
                        placeholder="分享你的想法、经验或故事..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={8}
                        className="bg-background resize-none"
                      />
                      <div className="text-right text-xs text-muted-foreground">{charCount} 字</div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-1.5">
                          <Image className="h-3.5 w-3.5 text-muted-foreground" />
                          配图描述（文字描述，最多9张）
                        </Label>
                        <span className="text-xs text-muted-foreground">{imageDescriptions.length}/9</span>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="如：一张风景照、一张自拍照..."
                          value={imageInput}
                          onChange={(e) => setImageInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                          className="bg-background"
                        />
                        <Button type="button" variant="outline" onClick={handleAddImage} disabled={!imageInput.trim()}>
                          添加
                        </Button>
                      </div>
                      {imageDescriptions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {imageDescriptions.map((desc, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm"
                            >
                              <Image className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-card-foreground">{desc}</span>
                              <button
                                onClick={() => handleRemoveImage(idx)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <Dialog open={inventoryOpen} onOpenChange={setInventoryOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Bookmark className="mr-2 h-4 w-4" />从存货库选择
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>存货库</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-96">
                            <div className="space-y-3 pr-4">
                              {INVENTORY_ITEMS.map((item) => (
                                <div
                                  key={item.id}
                                  className="cursor-pointer rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary"
                                  onClick={() => handleSelectInventory(item)}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-card-foreground">{item.title}</span>
                                    <Badge className={
                                      item.quality === 'high' ? 'bg-success/10 text-success' :
                                      item.quality === 'medium' ? 'bg-primary/10 text-primary' :
                                      'bg-warning/10 text-warning'
                                    }>
                                      {item.quality === 'high' ? '优质' : item.quality === 'medium' ? '普通' : '低质'}
                                    </Badge>
                                  </div>
                                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.content}</p>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>

                      <Button
                        onClick={handlePublish}
                        disabled={!canPublish}
                        size="lg"
                      >
                        {isPublishing ? (
                          <><svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>发布中...</>
                        ) : (
                          <><Send className="mr-2 h-4 w-4" />发布内容</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {publishResult && (
                  <Card className="border-l-4 border-l-primary bg-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        {publishResult.post.isViral ? (
                          <><Zap className="h-5 w-5 text-warning" />爆款预警！</>
                        ) : (
                          <><CheckCircle2 className="h-5 w-5 text-success" />发布成功</>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-card-foreground">{publishResult.post.title}</h4>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{publishResult.post.content}</p>
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        <div className="rounded-lg bg-muted/50 p-3 text-center">
                          <Eye className="mx-auto h-4 w-4 text-muted-foreground" />
                          <div className="mt-1 text-lg font-bold text-card-foreground">{publishResult.post.views.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">浏览</div>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3 text-center">
                          <Heart className="mx-auto h-4 w-4 text-destructive" />
                          <div className="mt-1 text-lg font-bold text-card-foreground">{publishResult.post.likes.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">点赞</div>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3 text-center">
                          <MessageSquare className="mx-auto h-4 w-4 text-primary" />
                          <div className="mt-1 text-lg font-bold text-card-foreground">{publishResult.post.comments.length}</div>
                          <div className="text-xs text-muted-foreground">评论</div>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3 text-center">
                          <Share2 className="mx-auto h-4 w-4 text-success" />
                          <div className="mt-1 text-lg font-bold text-card-foreground">{publishResult.post.shares.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">转发</div>
                        </div>
                      </div>

                      <div className="rounded-lg bg-muted/50 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-card-foreground">内容质量评分</span>
                          <span className={`text-2xl font-bold ${getScoreColor(publishResult.evaluation.overallScore)}`}>
                            {publishResult.evaluation.overallScore}
                          </span>
                        </div>
                        <Progress value={publishResult.evaluation.overallScore} className="mt-2 h-2" />
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">领域匹配：</span>
                          {getMatchBadge(publishResult.evaluation.categoryMatch)}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{publishResult.evaluation.algorithmFeedback}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                <Card className="bg-card">
                  <CardHeader>
                    <CardTitle className="text-base">发布小贴士</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex gap-2">
                      <TrendingUp className="h-4 w-4 shrink-0 text-success mt-0.5" />
                      <p className="text-muted-foreground">保持内容垂直度，与主领域匹配的内容曝光更高</p>
                    </div>
                    <div className="flex gap-2">
                      <Sparkles className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                      <p className="text-muted-foreground">标题有吸引力、内容有干货更容易成为爆款</p>
                    </div>
                    <div className="flex gap-2">
                      <Image className="h-4 w-4 shrink-0 text-accent-foreground mt-0.5" />
                      <p className="text-muted-foreground">添加配图描述可以提升内容丰富度和曝光</p>
                    </div>
                    <div className="flex gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                      <p className="text-muted-foreground">长时间不更新或发布低质内容会掉粉</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card">
                  <CardHeader>
                    <CardTitle className="text-base">当前数据</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">粉丝数</span>
                      <span className="font-medium text-card-foreground">{gameState.followers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">内容垂直度</span>
                      <span className="font-medium text-card-foreground">{gameState.verticality}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">已发布内容</span>
                      <span className="font-medium text-card-foreground">{posts.length} 篇</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">当前阶段</span>
                      <span className="font-medium text-primary">
                        {gameState.stage === 'cold_start' ? '冷启动' : gameState.stage === 'growth' ? '成长期' : gameState.stage === 'boom' ? '爆发期' : '达人期'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base">历史发布内容</CardTitle>
                <CardDescription>查看你发布过的所有内容和互动数据</CardDescription>
              </CardHeader>
              <CardContent>
                {posts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Clock className="mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">还没有发布过内容</p>
                    <Button className="mt-4" onClick={() => setActiveTab('compose')}>去发布第一篇</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <div key={post.id} className="rounded-lg border border-border bg-background p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-card-foreground">{post.title}</h3>
                              {post.isViral && (
                                <Badge className="bg-warning/10 text-warning">
                                  <Zap className="mr-1 h-3 w-3" />爆款
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">{post.category}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                            {post.imageDescriptions && post.imageDescriptions.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {post.imageDescriptions.map((img, idx) => (
                                  <span key={idx} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                    <Image className="mr-1 inline h-3 w-3" />{img}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="ml-4 text-right">
                            <div className={`text-lg font-bold ${getScoreColor(post.qualityScore || 0)}`}>
                              {post.qualityScore || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">质量分</div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{post.views?.toLocaleString() || 0}</span>
                          <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{post.likes?.toLocaleString() || 0}</span>
                          <button
                            className="flex items-center gap-1 hover:text-primary"
                            onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            {post.comments?.length || 0} 条评论
                          </button>
                          <span className="flex items-center gap-1"><Share2 className="h-3.5 w-3.5" />{post.shares?.toLocaleString() || 0}</span>
                        </div>

                        {expandedPostId === post.id && (
                          <div className="mt-4 space-y-3 border-t border-border pt-4">
                            {post.comments && post.comments.length > 0 ? (
                              post.comments.map((comment: IComment) => (
                                <div key={comment.id} className="space-y-2">
                                  <div className="flex items-start gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                                      {comment.avatarLabel || comment.author.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-card-foreground">{comment.author}</span>
                                        <span className="text-xs text-muted-foreground">{comment.timeAgo}</span>
                                        {comment.sentiment === 'negative' && (
                                          <Badge className="bg-destructive/10 text-destructive text-[10px]">负面</Badge>
                                        )}
                                      </div>
                                      <p className="mt-1 text-sm text-card-foreground">{comment.content}</p>
                                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                        <button
                                          className="flex items-center gap-1 hover:text-destructive"
                                          onClick={() => incrementCommentLikes(post.id, comment.id, 1)}
                                        >
                                          <Heart className="h-3 w-3" />{comment.likes || 0}
                                        </button>
                                      </div>
                                      {comment.reply && (
                                        <div className="mt-2 ml-4 rounded-lg bg-muted/50 p-3">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-primary">你（博主）</span>
                                            <span className="text-xs text-muted-foreground">{comment.reply.timeAgo}</span>
                                          </div>
                                          <p className="mt-1 text-sm text-card-foreground">{comment.reply.content}</p>
                                        </div>
                                      )}
                                      {!comment.reply && (
                                        <div className="mt-2 flex gap-2">
                                          <Input
                                            placeholder="回复这条评论..."
                                            value={commentInputs[comment.id] || ''}
                                            onChange={(e) => setCommentInputs((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                                            onKeyDown={(e) => e.key === 'Enter' && handleReplyComment(post.id, comment.id)}
                                            className="h-8 text-sm bg-background"
                                          />
                                          <Button size="sm" variant="outline" onClick={() => handleReplyComment(post.id, comment.id)}>
                                            回复
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-center text-sm text-muted-foreground">暂无评论</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <RightPanel />
    </div>
  );
}
