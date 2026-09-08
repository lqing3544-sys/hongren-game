import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings, User, Tag, FileText, RotateCcw, Save, AlertTriangle,
  Bell, Shield, Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { useGame } from '@/context/GameContext';
import { toast } from 'sonner';
import RightPanel from '@/components/RightPanel';

export default function SettingsPage() {
  const { gameState, updateGameState, resetGame } = useGame();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState(gameState?.nickname || '');
  const [bio, setBio] = useState(gameState?.bio || '');
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  const [nicknameError, setNicknameError] = useState('');
  const [bioError, setBioError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const handleSaveProfile = async () => {
    let hasError = false;
    if (!nickname.trim()) {
      setNicknameError('昵称不能为空');
      hasError = true;
    } else if (nickname.length > 20) {
      setNicknameError('昵称不能超过 20 字');
      hasError = true;
    } else {
      setNicknameError('');
    }
    if (bio.length > 100) {
      setBioError('人设简介不能超过 100 字');
      hasError = true;
    } else {
      setBioError('');
    }
    if (hasError) return;

    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      updateGameState({ nickname: nickname.trim(), bio: bio.trim() });
      toast.success('个人信息已保存');
    } catch {
      toast.error('保存失败，请稍后再试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetGame = () => {
    resetGame();
    navigate('/start');
    toast.info('游戏已重置');
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
            <Settings className="h-6 w-6 text-primary" />
            设置
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">管理你的账号信息和游戏偏好</p>
        </div>

        <Card className="border-l-4 border-l-primary bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" />
              个人资料
            </CardTitle>
            <CardDescription>修改你的昵称和人设简介</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {gameState.nickname.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-card-foreground">{gameState.nickname}</div>
                <div className="text-sm text-muted-foreground">{gameState.mainCategory} 博主</div>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="nickname" className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />昵称
              </Label>
              <div className="relative">
                <Input
                  id="nickname" value={nickname}
                  onChange={(e) => { setNickname(e.target.value); if (nicknameError) setNicknameError(''); }}
                  maxLength={20}
                  className={`pr-14 bg-background ${nicknameError ? 'border-destructive' : ''}`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {nickname.length}/20
                </span>
              </div>
              {nicknameError && <p className="text-xs text-destructive">{nicknameError}</p>}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />主领域
              </Label>
              <div className="flex h-10 items-center rounded-md border border-border bg-muted/30 px-3 text-sm text-muted-foreground">
                {gameState.mainCategory}
                <span className="ml-2 text-xs">（创建后不可修改）</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />人设简介
              </Label>
              <div className="relative">
                <Textarea
                  id="bio" value={bio}
                  onChange={(e) => { setBio(e.target.value); if (bioError) setBioError(''); }}
                  maxLength={100} rows={3}
                  className={`pb-6 bg-background ${bioError ? 'border-destructive' : ''}`}
                />
                <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-muted-foreground">
                  {bio.length}/100
                </span>
              </div>
              {bioError && <p className="text-xs text-destructive">{bioError}</p>}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? (
                  <><svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>保存中...</>
                ) : (<><Save className="mr-2 h-4 w-4" />保存修改</>)}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-accent-foreground" />游戏偏好
            </CardTitle>
            <CardDescription>自定义你的游戏体验</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium text-card-foreground">消息通知</div>
                  <div className="text-xs text-muted-foreground">接收危机事件、商单邀请等通知</div>
                </div>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium text-card-foreground">音效提示</div>
                  <div className="text-xs text-muted-foreground">涨粉、危机等事件的音效提醒</div>
                </div>
              </div>
              <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                  <Save className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium text-card-foreground">自动保存</div>
                  <div className="text-xs text-muted-foreground">自动保存游戏进度到本地存储</div>
                </div>
              </div>
              <Switch checked={autoSave} onCheckedChange={setAutoSave} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-success" />游戏数据
            </CardTitle>
            <CardDescription>管理你的游戏存档</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="text-xs text-muted-foreground">游戏日</div>
                <div className="font-semibold text-card-foreground">{gameState.gameDay} 天</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="text-xs text-muted-foreground">粉丝数</div>
                <div className="font-semibold text-card-foreground">{gameState.followers.toLocaleString()}</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="text-xs text-muted-foreground">总收入</div>
                <div className="font-semibold text-card-foreground">¥{gameState.income.toLocaleString()}</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="text-xs text-muted-foreground">当前阶段</div>
                <div className="font-semibold text-card-foreground">
                  {gameState.stage === 'cold_start' ? '冷启动' : gameState.stage === 'growth' ? '成长期' : gameState.stage === 'boom' ? '爆发期' : '达人期'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="h-4 w-4" />危险操作
            </CardTitle>
            <CardDescription>以下操作不可逆，请谨慎操作</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <RotateCcw className="mr-2 h-4 w-4" />重新开始游戏
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />确认重置游戏？
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作将清除所有游戏进度，包括粉丝数、收入、历史记录等所有数据。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleResetGame}
                  >
                    确认重置
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Info className="h-4 w-4" />关于红人养成器
              </div>
              <span className="text-muted-foreground">v1.0.0</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <RightPanel />
    </div>
  );
}
