import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, User, Tag, FileText, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGame } from '@/context/GameContext';
import { logger } from '@/lib/logger';

const CATEGORIES = [
  { value: '美妆', label: '美妆护肤', desc: '分享美妆技巧、护肤心得' },
  { value: '科技', label: '科技数码', desc: '测评产品、分享技术' },
  { value: '美食', label: '美食探店', desc: '推荐美食、制作教程' },
  { value: '情感', label: '情感生活', desc: '情感故事、生活感悟' },
  { value: '游戏', label: '游戏电竞', desc: '游戏攻略、精彩集锦' },
  { value: '财经', label: '财经理财', desc: '理财知识、投资心得' },
  { value: '健身', label: '健身运动', desc: '健身教学、健康生活' },
  { value: '旅行', label: '旅行探店', desc: '旅行攻略、风景分享' },
];

export default function StartPage() {
  const { startGame } = useGame();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nickname.trim()) {
      newErrors.nickname = '请输入你的昵称';
    } else if (nickname.length > 20) {
      newErrors.nickname = '昵称不能超过 20 字';
    }
    if (!category) {
      newErrors.category = '请选择主领域';
    }
    if (bio.length > 100) {
      newErrors.bio = '人设简介不能超过 100 字';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      startGame(
        nickname.trim(),
        bio.trim() || `一个热爱${category}的创作者`,
        category,
      );
      logger.info('Game initialized with category:', category);
      navigate('/');
    } catch (err) {
      logger.error('Failed to init game:', String(err));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
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

      <main className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-20">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            模拟经营 · AI 驱动
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-card-foreground md:text-5xl">
            从素人到
            <span className="ml-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              全网红人
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            选择你的赛道，用心创作每一篇内容。AI 模拟真实平台算法和粉丝反应，
            看你能否从 0 粉丝起步，成长为坐拥百万粉丝的网络达人。
          </p>
        </div>

        <Card className="mx-auto max-w-lg border-l-4 border-l-primary bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="h-5 w-5 text-primary" />
              创建你的账号
            </CardTitle>
            <CardDescription>
              填写基础信息，开启你的红人成长之路
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="category" className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  主领域 <span className="text-destructive">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger
                    id="category"
                    className={errors.category ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="选择你最擅长的领域" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div>
                          <div className="font-medium">{cat.label}</div>
                          <div className="text-xs text-muted-foreground">{cat.desc}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-xs text-destructive">{errors.category}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname" className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  昵称 <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="给自己起个响亮的昵称"
                    maxLength={20}
                    className={errors.nickname ? 'border-destructive pr-12' : 'pr-12'}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {nickname.length}/20
                  </span>
                </div>
                {errors.nickname && (
                  <p className="text-xs text-destructive">{errors.nickname}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  人设简介
                  <span className="text-xs text-muted-foreground">（选填）</span>
                </Label>
                <div className="relative">
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="用一句话介绍你自己，影响粉丝对你的印象"
                    maxLength={100}
                    rows={3}
                    className={errors.bio ? 'border-destructive pb-6' : 'pb-6'}
                  />
                  <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-muted-foreground">
                    {bio.length}/100
                  </span>
                </div>
                {errors.bio && <p className="text-xs text-destructive">{errors.bio}</p>}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    正在创建账号...
                  </>
                ) : (
                  <>
                    开始游戏
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { title: 'AI 质量评估', desc: '四维打分系统，模拟真实平台算法' },
            { title: '粉丝成长体系', desc: '从冷启动到全网爆红，完整成长路径' },
            { title: '危机事件应对', desc: '随机危机事件，考验你的公关能力' },
          ].map((item) => (
            <Card key={item.title} className="bg-card/60 backdrop-blur">
              <CardContent className="p-4">
                <div className="text-sm font-semibold text-card-foreground">{item.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{item.desc}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <footer className="mt-12 border-t border-border/20 py-6 text-center text-xs text-muted-foreground">
        红人养成器 · 一款模拟自媒体成长的文字游戏
      </footer>
    </div>
  );
}
