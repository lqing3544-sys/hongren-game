export interface IGameState {
  nickname: string;
  bio: string;
  mainCategory: string;
  followers: number;
  verticality: number;
  loyalty: number;
  income: number;
  gameDay: number;
  idleDays: number;
  stage: 'cold_start' | 'growth' | 'boom' | 'influencer';
  communityUnlocked: boolean;
  partnershipUnlocked: boolean;
  privateMessageCount: number;
  unreadMessageCount: number;
}

export interface IQualityResult {
  domainClassification: string;
  scores: {
    titleAppeal: number;
    infoDensity: number;
    emotionalResonance: number;
    topicality: number;
  };
  overallScore: number;
  riskLevel: string;
  algorithmFeedback: string;
}

export interface IPost {
  id: string;
  title: string;
  content: string;
  gameDay: number;
  result: {
    category: string;
    categoryMatch: 'high' | 'medium' | 'low';
    scores: {
      titleAppeal: number;
      infoDensity: number;
      emotionalResonance: number;
      topicality: number;
    };
    overallScore: number;
    exposure: number;
    likes: number;
    comments: number;
    shares: number;
    followerChange: number;
    verticalityChange: number;
    algorithmFeedback: string;
    riskLevel: string;
  };
  fanComments: IFanComment[];
  source?: 'original' | 'stock';
  isAd?: boolean;
  adBrand?: string;
  adBudget?: number;
  viralLevel?: 'none' | 'small' | 'big';
  imageDescriptions?: IImageDescription[];
}

export interface IStockItem {
  id: string;
  title: string;
  content: string;
  category: string;
  quality: 'S' | 'A' | 'B' | 'C';
  wordCount: number;
  aiHint: string;
  style: string;
  isAd?: boolean;
  adBrand?: string;
  adProductType?: string;
  adBudget?: number;
  imageDescriptions?: IImageDescription[];
}

export const STOCK_QUALITY_LEVELS = [
  { key: 'S', label: 'S级', colorClass: 'text-amber-600', bgClass: 'bg-amber-500', borderClass: 'border-amber-300' },
  { key: 'A', label: 'A级', colorClass: 'text-purple-600', bgClass: 'bg-purple-500', borderClass: 'border-purple-300' },
  { key: 'B', label: 'B级', colorClass: 'text-blue-600', bgClass: 'bg-blue-500', borderClass: 'border-blue-300' },
  { key: 'C', label: 'C级', colorClass: 'text-gray-500', bgClass: 'bg-gray-400', borderClass: 'border-gray-300' },
] as const;

export interface IImageDescription {
  id: string;
  description: string;
  type?: string;
}

export interface ICommentReply {
  id: string;
  content: string;
  timeAgo: string;
  effectFeedback?: string;
  loyaltyChange?: number;
  followerChange?: number;
  likeIncrease?: number;
}

export interface IFanComment {
  id: string;
  nickname: string;
  profile: string;
  content: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  fanLevel?: string;
  likeCount?: number;
  timeAgo?: string;
  isSuspectedBot?: boolean;
  bloggerReply?: ICommentReply;
  followUpReply?: {
    id: string;
    content: string;
    timeAgo: string;
  };
}

export interface IDeal {
  id: string;
  brand: string;
  productType: string;
  budget: number;
  requirement: string;
  status: 'pending' | 'accepted' | 'rejected';
  gameDay: number;
  result?: {
    followerChange: number;
    feedback: string;
  };
}

export interface IGameEvent {
  id: string;
  type: 'crisis' | 'milestone' | 'deal' | 'post';
  title: string;
  description: string;
  gameDay: number;
  resolved: boolean;
  resolution?: string;
}

export type PrivateMessageType = 'praise' | 'request' | 'question' | 'malicious' | 'business';

export interface IPrivateMessage {
  id: string;
  direction: 'from_fan' | 'from_blogger';
  content: string;
  timeAgo: string;
  read?: boolean;
}

export interface IPrivateConversation {
  id: string;
  nickname: string;
  profile: string;
  avatarColor: string;
  type: PrivateMessageType;
  messages: IPrivateMessage[];
  lastTimeAgo: string;
  businessInfo?: {
    brand: string;
    productType: string;
    budget: number;
    requirement: string;
    status: 'pending' | 'accepted' | 'rejected';
  };
  blocked?: boolean;
}

export const MAIN_CATEGORIES = [
  '美妆', '科技', '美食', '情感', '游戏', '财经', '健身', '旅行',
];

export const STAGES = [
  { key: 'cold_start', label: '冷启动期', min: 0, max: 1000, color: 'text-muted-foreground' },
  { key: 'growth', label: '成长期', min: 1000, max: 10000, color: 'text-info' },
  { key: 'boom', label: '爆发期', min: 10000, max: 100000, color: 'text-warning' },
  { key: 'influencer', label: '达人期', min: 100000, max: Infinity, color: 'text-primary' },
];

export const CRISIS_TYPES = [
  { key: '水军', label: '水军刷差评', options: ['无视', '置顶澄清', '发长文回应', '联系平台举报'] },
  { key: '断章取义', label: '内容被断章取义', options: ['沉默', '道歉', '举证反驳', '幽默化解'] },
  { key: '竞品拉踩', label: '竞品拉踩对比', options: ['不理会', '暗讽回去', '主动联动对方', '发数据对比'] },
  { key: '老粉回踩', label: '老粉脱粉回踩', options: ['私下沟通', '公开回应', '冷处理', '送福利安抚'] },
];

export function getStageByFollowers(followers: number) {
  return STAGES.find(s => followers >= s.min && followers < s.max) || STAGES[0];
}

export function formatNumber(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return Math.floor(num).toString();
}

export function getLoyaltyLevel(loyalty: number): string {
  if (loyalty >= 70) return '高粘性';
  if (loyalty >= 40) return '中粘性';
  return '低粘性';
}

export function getVerticalityLevel(verticality: number): string {
  if (verticality >= 80) return '高';
  if (verticality >= 50) return '中';
  return '低';
}

export function getFollowerStageLabel(followers: number): string {
  if (followers < 1000) return '刚起步（0-1000粉）';
  if (followers < 10000) return '千粉阶段（1k-10k粉）';
  if (followers < 100000) return '万粉阶段（10k-100k粉）';
  return '十万粉以上';
}

export function getScoreLevel(score: number): string {
  if (score >= 80) return '优质';
  if (score >= 60) return '良好';
  if (score >= 40) return '一般';
  return '较差';
}

export function generateRelativeTime(index: number, total: number): string {
  if (index === 0) return '刚刚';
  if (index < 3) return `${index * 5}分钟前`;
  if (index < total / 2) return `${Math.floor(index * 0.5)}小时前`;
  if (index < total * 0.8) return '昨天';
  return '2天前';
}

export function generateFallbackComments(
  postTitle: string,
  postContent: string,
  category: string,
  overallScore: number,
  count: number = 6,
  _imageDescriptions?: { description: string }[],
): IFanComment[] {
  const nicknames = [
    '橘子汽水', '代码搬运工', '深夜食堂', '奶茶三分糖', '一只咸鱼',
    '晴天娃娃', '月亮不睡', '晚风撩人', '芝士不加糖', '柠檬不萌',
    '故事的小黄花', '等风来', '爱笑的女孩', '佛系青年', '路人甲',
    '追风少年', '吃瓜群众', '咸鱼翻身', '快乐星球', '温柔一刀',
  ];
  const profiles = [
    '22岁大学生/关注1个月/新粉',
    '28岁产品经理/关注半年/轻度粉',
    '35岁宝妈/关注1年/核心粉',
    '25岁设计师/关注3个月/轻度粉',
    '19岁高中生/关注2周/新粉',
    '40岁自由职业/关注2年/死忠粉',
    '23岁运营/关注5个月/中度粉',
    '30岁程序员/关注1年半/核心粉',
  ];
  const positiveContents = [
    `太棒了！${postTitle.slice(0, 10)}这个话题我一直在关注，up主讲得好清楚`,
    '终于等到更新了！这期内容超有干货，已收藏反复看',
    '跟着up主学到好多，每次更新都像拆礼物一样期待',
    '质量真的高，每一句话都说到我心坎里了',
    '这个角度好新颖，之前从来没这么想过',
    'up主的表达能力真的强，复杂的事情讲得明明白白',
    '已转发到朋友圈，朋友们都说好！',
    '这期是我看过最好的一期，没有之一',
  ];
  const neutralContents = [
    '还行吧，感觉一般般',
    '内容可以，但节奏有点慢',
    '路过看看，顺便留个言',
    '标题党了，实际内容没那么夸张',
    '支持一下，希望继续加油',
    '这个话题有点过时了',
  ];
  const negativeContents = [
    '就这？也太水了吧',
    '感觉质量下降了，没有以前好看',
    '不同意你的观点，太片面了',
    '能不能别打广告了？取关了',
    '讲得乱七八糟，不知道在说什么',
  ];

  const result: IFanComment[] = [];
  const positiveRatio = overallScore >= 70 ? 0.75 : overallScore >= 50 ? 0.55 : 0.35;
  const neutralRatio = 0.2;

  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let sentiment: 'positive' | 'neutral' | 'negative';
    let contentPool: string[];
    if (rand < positiveRatio) {
      sentiment = 'positive';
      contentPool = positiveContents;
    } else if (rand < positiveRatio + neutralRatio) {
      sentiment = 'neutral';
      contentPool = neutralContents;
    } else {
      sentiment = 'negative';
      contentPool = negativeContents;
    }

    const fanLevel = sentiment === 'positive'
      ? (Math.random() > 0.6 ? '核心粉' : '轻度粉')
      : sentiment === 'negative'
        ? (Math.random() > 0.8 ? '黑粉' : '路人粉')
        : '路人粉';

    result.push({
      id: `fallback-${Date.now()}-${i}`,
      nickname: nicknames[(i * 3 + Math.floor(Math.random() * 5)) % nicknames.length],
      profile: profiles[i % profiles.length],
      content: contentPool[Math.floor(Math.random() * contentPool.length)],
      sentiment,
      fanLevel,
      likeCount: Math.floor(Math.random() * 50 + 5),
      timeAgo: generateRelativeTime(i, count),
      isSuspectedBot: false,
    });
  }

  return result;
}
