export interface IGameState {
  nickname: string;
  bio: string;
  mainCategory: string;
  followers: number;
  income: number;
  verticality: number;
  loyalty: number;
  gameDay: number;
  idleDays: number;
  stage: 'cold_start' | 'growth' | 'boom' | 'master';
  partnershipUnlocked: boolean;
  communityUnlocked: boolean;
  posts?: number;
}

export interface ICommentReply {
  id: string;
  content: string;
  timeAgo: string;
}

export interface IComment {
  id: string;
  author: string;
  avatarLabel?: string;
  content: string;
  likes: number;
  timeAgo: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  reply?: ICommentReply;
  followUps?: { id: string; content: string; timeAgo: string }[];
}

export interface IPost {
  id: string;
  title: string;
  content: string;
  imageDescriptions?: string[];
  category: string;
  createdAt: string;
  likes: number;
  comments: IComment[];
  shares: number;
  views: number;
  qualityScore?: number;
  isViral?: boolean;
}

export interface IDeal {
  id: string;
  brand: string;
  productType: string;
  budget: number;
  requirement: string;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  createdAt: string;
  completedAt?: string;
}

export interface IGameEvent {
  id: string;
  type: 'crisis' | 'milestone' | 'notification';
  title: string;
  description?: string;
  options?: string[];
  severity?: 'low' | 'medium' | 'high';
  resolved: boolean;
  resolution?: string;
  result?: string;
  followerChange?: number;
  timeAgo: string;
  read?: boolean;
}

export interface IPrivateMessage {
  id?: string;
  sender: 'me' | 'fan';
  content: string;
  time: string;
}

export interface IPrivateConversation {
  id: string;
  fanName: string;
  fanProfile: string;
  type: 'praise' | 'request' | 'business' | 'malicious' | 'normal';
  preview: string;
  lastMessageTime: string;
  read: boolean;
  blocked: boolean;
  messages: IPrivateMessage[];
}

export interface EvaluateResult {
  category: string;
  categoryMatch: 'high' | 'medium' | 'low';
  scores: {
    titleAppeal: number;
    infoDensity: number;
    emotionalResonance: number;
    topicality: number;
  };
  overallScore: number;
  riskLevel: 'none' | 'low' | 'medium' | 'high';
  algorithmFeedback: string;
}

export interface FanCommentStream {
  id: string;
  avatarLabel: string;
  profile: string;
  content: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface GeneratedDeal {
  brand: string;
  productType: string;
  budget: number;
  requirement: string;
}
