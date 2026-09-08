import { useState, useEffect, useCallback, useRef } from 'react';
import {
  IGameState, IPost, IDeal, IGameEvent, IPrivateConversation,
  ICommentReply, IFanComment, MAIN_CATEGORIES, getStageByFollowers,
  formatNumber, generateFallbackComments,
} from '@/data/game';
import { storage } from '@/lib/storage';
import { logger } from '@/lib/logger';
import {
  generateComments, generatePrivateReply, generateQualityAssessment,
  generateDeals, checkAiStatus,
} from '@/utils/externalAi';

const STORAGE_KEY = 'game_state_v1';
const POSTS_KEY = 'game_posts_v1';
const DEALS_KEY = 'game_deals_v1';
const EVENTS_KEY = 'game_events_v1';
const CONVERSATIONS_KEY = 'game_conversations_v1';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = storage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch (e) {
    logger.error(`Failed to load ${key}:`, e);
  }
  return defaultValue;
}

function saveToStorage(key: string, value: unknown) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (e) {
    logger.error(`Failed to save ${key}:`, e);
  }
}

const initialState: IGameState = {
  nickname: '',
  bio: '',
  mainCategory: '',
  followers: 0,
  verticality: 50,
  loyalty: 50,
  income: 0,
  gameDay: 1,
  idleDays: 0,
  stage: 'cold_start',
  communityUnlocked: false,
  partnershipUnlocked: false,
  privateMessageCount: 0,
  unreadMessageCount: 0,
};

export function useGameState() {
  const [gameState, setGameState] = useState<IGameState | null>(null);
  const [posts, setPosts] = useState<IPost[]>([]);
  const [deals, setDeals] = useState<IDeal[]>([]);
  const [events, setEvents] = useState<IGameEvent[]>([]);
  const [conversations, setConversations] = useState<IPrivateConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const savedState = loadFromStorage<IGameState | null>(STORAGE_KEY, null);
    const savedPosts = loadFromStorage<IPost[]>(POSTS_KEY, []);
    const savedDeals = loadFromStorage<IDeal[]>(DEALS_KEY, []);
    const savedEvents = loadFromStorage<IGameEvent[]>(EVENTS_KEY, []);
    const savedConversations = loadFromStorage<IPrivateConversation[]>(CONVERSATIONS_KEY, []);

    setGameState(savedState);
    setPosts(savedPosts);
    setDeals(savedDeals);
    setEvents(savedEvents);
    setConversations(savedConversations);
    setIsLoading(false);

    logger.info('游戏状态已加载', {
      hasGame: !!savedState,
      postCount: savedPosts.length,
      dealCount: savedDeals.length,
    });
  }, []);

  useEffect(() => {
    if (!isLoading && gameState) {
      saveToStorage(STORAGE_KEY, gameState);
    }
  }, [gameState, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      saveToStorage(POSTS_KEY, posts);
    }
  }, [posts, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      saveToStorage(DEALS_KEY, deals);
    }
  }, [deals, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      saveToStorage(EVENTS_KEY, events);
    }
  }, [events, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      saveToStorage(CONVERSATIONS_KEY, conversations);
    }
  }, [conversations, isLoading]);

  const startGame = useCallback((nickname: string, bio: string, mainCategory: string) => {
    const newState: IGameState = {
      ...initialState,
      nickname,
      bio,
      mainCategory,
    };
    setGameState(newState);
    setPosts([]);
    setDeals([]);
    setEvents([]);
    setConversations([]);
    logger.info('新游戏已开始', { nickname, mainCategory });
  }, []);

  const resetGame = useCallback(() => {
    setGameState(null);
    setPosts([]);
    setDeals([]);
    setEvents([]);
    setConversations([]);
    storage.removeItem(STORAGE_KEY);
    storage.removeItem(POSTS_KEY);
    storage.removeItem(DEALS_KEY);
    storage.removeItem(EVENTS_KEY);
    storage.removeItem(CONVERSATIONS_KEY);
    logger.info('游戏已重置');
  }, []);

  const updateGameState = useCallback((updater: ((prev: IGameState) => IGameState) | Partial<IGameState>) => {
    setGameState(prev => {
      if (!prev) return prev;
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      const stage = getStageByFollowers(next.followers);
      return { ...next, stage: stage.key as IGameState['stage'] };
    });
  }, []);

  const addPost = useCallback((post: IPost) => {
    setPosts(prev => [post, ...prev]);
  }, []);

  const advanceDay = useCallback(() => {
    setGameState(prev => {
      if (!prev) return prev;
      return { ...prev, gameDay: prev.gameDay + 1, idleDays: 0 };
    });
  }, []);

  const checkUnlocks = useCallback(() => {
    setGameState(prev => {
      if (!prev) return prev;
      const partnershipUnlocked = prev.partnershipUnlocked || prev.followers >= 500 || posts.length >= 1;
      const communityUnlocked = prev.communityUnlocked || prev.followers >= 1000;
      if (partnershipUnlocked === prev.partnershipUnlocked && communityUnlocked === prev.communityUnlocked) {
        return prev;
      }
      return { ...prev, partnershipUnlocked, communityUnlocked };
    });
  }, [posts.length]);

  const markEventRead = useCallback((eventId: string) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, resolved: true } : e));
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const localQualityAssessment = useCallback((
    title: string,
    content: string,
    mainCategory: string,
    verticality: number,
  ) => {
    const wordCount = content.length;
    const titleLength = title.length;

    let titleAppeal = 50;
    if (titleLength >= 10 && titleLength <= 25) titleAppeal += 20;
    if (titleLength > 25) titleAppeal -= 10;
    if (/[!?！？]/.test(title)) titleAppeal += 10;
    if (/[0-9]/.test(title)) titleAppeal += 5;

    let infoDensity = 40;
    if (wordCount >= 100) infoDensity += 15;
    if (wordCount >= 300) infoDensity += 15;
    if (wordCount >= 500) infoDensity += 10;
    if (wordCount < 30) infoDensity -= 20;

    let emotionalResonance = 45;
    if (/[我你他她]/.test(content)) emotionalResonance += 10;
    if (/[！？!?]/.test(content)) emotionalResonance += 10;
    if (/[，。、]/.test(content)) emotionalResonance += 5;

    let topicality = 50 + Math.random() * 20;

    titleAppeal = Math.min(100, Math.max(0, titleAppeal));
    infoDensity = Math.min(100, Math.max(0, infoDensity));
    emotionalResonance = Math.min(100, Math.max(0, emotionalResonance));
    topicality = Math.min(100, Math.max(0, topicality));

    const overallScore = Math.round(
      titleAppeal * 0.25 + infoDensity * 0.3 + emotionalResonance * 0.25 + topicality * 0.2,
    );

    let categoryMatch: 'high' | 'medium' | 'low' = 'medium';
    const categoryKeywords: Record<string, string[]> = {
      美妆: ['口红', '粉底', '眼影', '护肤', '化妆', '面膜', '精华', '卸妆', '防晒', '眉笔'],
      科技: ['手机', '电脑', '芯片', 'AI', '智能', '数码', '软件', '硬件', '编程', '代码'],
      美食: ['好吃', '食谱', '烹饪', '探店', '餐厅', '食材', '烘焙', '咖啡', '甜品', '家常菜'],
      情感: ['恋爱', '分手', '婚姻', '友情', '孤独', '成长', '治愈', '心事', '情绪', '关系'],
      游戏: ['游戏', '电竞', '攻略', '主播', '排位', '皮肤', '角色', '副本', '装备', '上分'],
      财经: ['股票', '基金', '理财', '投资', '赚钱', '副业', '经济', '市场', '资产', '收益'],
      健身: ['减肥', '增肌', '跑步', '瑜伽', '运动', '训练', '饮食', '塑形', '体能', '健康'],
      旅行: ['旅行', '旅游', '攻略', '景点', '酒店', '机票', '打卡', '风景', '度假', '出行'],
    };
    const keywords = categoryKeywords[mainCategory] || [];
    const matchCount = keywords.filter(k =>
      content.includes(k) || title.includes(k),
    ).length;
    if (matchCount >= 2) categoryMatch = 'high';
    else if (matchCount >= 1) categoryMatch = 'medium';
    else categoryMatch = 'low';

    const riskLevel = overallScore < 30 ? 'medium' : 'none';

    const feedbacks = [
      '内容质量不错，标题有吸引力，建议增加更多细节',
      '整体表现良好，信息密度适中，可以尝试更有争议性的话题',
      '内容偏短，建议增加深度分析和个人观点',
      '标题吸引力一般，建议优化标题结构',
      '情绪共鸣不错，继续保持个人风格',
    ];

    return {
      domainClassification: mainCategory,
      categoryMatch,
      scores: { titleAppeal, infoDensity, emotionalResonance, topicality },
      overallScore,
      riskLevel,
      algorithmFeedback: feedbacks[Math.floor(Math.random() * feedbacks.length)],
      estimatedExposure: 0,
    };
  }, []);

  const calculatePostMetrics = useCallback((
    quality: any,
    followers: number,
    verticality: number,
    categoryMatch: 'high' | 'medium' | 'low',
  ) => {
    const score = quality.overallScore;
    const verticalityBonus = verticality / 100;
    const matchMultiplier = categoryMatch === 'high' ? 1.3 : categoryMatch === 'medium' ? 1.0 : 0.6;

    const baseExposure = Math.max(50, followers * 0.1 + 100);
    const scoreMultiplier = score / 50;
    let exposure = Math.round(baseExposure * scoreMultiplier * verticalityBonus * matchMultiplier);

    const viralChance = score >= 80 ? 0.15 : score >= 70 ? 0.08 : score >= 60 ? 0.03 : 0.01;
    let viralLevel: 'none' | 'small' | 'big' = 'none';
    if (Math.random() < viralChance) {
      if (Math.random() < 0.3) {
        viralLevel = 'big';
        exposure = Math.round(exposure * 10);
      } else {
        viralLevel = 'small';
        exposure = Math.round(exposure * 3);
      }
    }

    const likes = Math.round(exposure * (0.03 + Math.random() * 0.05));
    const comments = Math.round(exposure * (0.005 + Math.random() * 0.01));
    const shares = Math.round(exposure * (0.002 + Math.random() * 0.008));

    let followerChange = 0;
    if (score >= 70) {
      followerChange = Math.round(exposure * (0.02 + Math.random() * 0.03));
    } else if (score >= 50) {
      followerChange = Math.round(exposure * (0.005 + Math.random() * 0.01));
    } else if (score >= 30) {
      followerChange = -Math.round(followers * 0.005);
    } else {
      followerChange = -Math.round(followers * 0.02);
    }

    const verticalityChange = categoryMatch === 'high' ? 2 : categoryMatch === 'medium' ? 0 : -5;

    return {
      exposure,
      likes,
      comments,
      shares,
      followerChange,
      verticalityChange,
      viralLevel,
    };
  }, []);

  const applyPostResult = useCallback((post: IPost, income?: number) => {
    setPosts(prev => [post, ...prev]);
    setGameState(prev => {
      if (!prev) return prev;
      const newFollowers = Math.max(0, prev.followers + post.result.followerChange);
      const newVerticality = Math.min(100, Math.max(0, prev.verticality + post.result.verticalityChange));
      const newIncome = prev.income + (income || 0);
      const newGameDay = prev.gameDay + 1;
      const stage = getStageByFollowers(newFollowers);

      const partnershipUnlocked = prev.partnershipUnlocked || newFollowers >= 500 || posts.length >= 1;
      const communityUnlocked = prev.communityUnlocked || newFollowers >= 1000;

      return {
        ...prev,
        followers: newFollowers,
        verticality: newVerticality,
        income: newIncome,
        gameDay: newGameDay,
        idleDays: 0,
        stage: stage.key as IGameState['stage'],
        partnershipUnlocked,
        communityUnlocked,
      };
    });
  }, [posts.length]);

  const addDeal = useCallback((deal: IDeal) => {
    setDeals(prev => [deal, ...prev]);
  }, []);

  const updateDeal = useCallback((dealId: string, updates: Partial<IDeal>) => {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, ...updates } : d));
  }, []);

  const applyDealResult = useCallback((
    dealId: string,
    accepted: boolean,
    followerChange: number,
    feedback: string,
  ) => {
    setDeals(prev => prev.map(d => {
      if (d.id !== dealId) return d;
      return {
        ...d,
        status: accepted ? 'accepted' : 'rejected',
        result: { followerChange, feedback },
      };
    }));
    if (accepted) {
      setGameState(prev => {
        if (!prev) return prev;
        const deal = deals.find(d => d.id === dealId);
        const budget = deal?.budget || 0;
        return {
          ...prev,
          followers: Math.max(0, prev.followers + followerChange),
          income: prev.income + budget,
        };
      });
    }
  }, [deals]);

  const addEvent = useCallback((event: IGameEvent) => {
    setEvents(prev => [event, ...prev]);
  }, []);

  const updateEvent = useCallback((eventId: string, updates: Partial<IGameEvent>) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...updates } : e));
  }, []);

  const addCommentReply = useCallback((postId: string, commentId: string, reply: ICommentReply) => {
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      return {
        ...post,
        fanComments: post.fanComments.map(c => {
          if (c.id !== commentId) return c;
          return { ...c, bloggerReply: reply };
        }),
      };
    }));
    if (reply.loyaltyChange || reply.followerChange) {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          loyalty: Math.min(100, Math.max(0, prev.loyalty + (reply.loyaltyChange || 0))),
          followers: Math.max(0, prev.followers + (reply.followerChange || 0)),
        };
      });
    }
  }, []);

  const removeCommentReply = useCallback((postId: string, commentId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      return {
        ...post,
        fanComments: post.fanComments.map(c => {
          if (c.id !== commentId) return c;
          return { ...c, bloggerReply: undefined };
        }),
      };
    }));
  }, []);

  const addFollowUpReply = useCallback((
    postId: string,
    commentId: string,
    followUp: { id: string; content: string; timeAgo: string },
  ) => {
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      return {
        ...post,
        fanComments: post.fanComments.map(c => {
          if (c.id !== commentId) return c;
          return { ...c, followUpReply: followUp };
        }),
      };
    }));
  }, []);

  const incrementCommentLikes = useCallback((postId: string, commentId: string, delta: number) => {
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      return {
        ...post,
        fanComments: post.fanComments.map(c => {
          if (c.id !== commentId) return c;
          return { ...c, likeCount: (c.likeCount || 0) + delta };
        }),
      };
    }));
  }, []);

  const addConversation = useCallback((conv: IPrivateConversation) => {
    setConversations(prev => [conv, ...prev]);
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        privateMessageCount: prev.privateMessageCount + 1,
        unreadMessageCount: prev.unreadMessageCount + 1,
      };
    });
  }, []);

  const markConversationRead = useCallback((convId: string) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c;
      return {
        ...c,
        messages: c.messages.map(m => ({ ...m, read: true })),
      };
    }));
    setGameState(prev => {
      if (!prev) return prev;
      const conv = conversations.find(c => c.id === convId);
      const unreadCount = conv?.messages.filter(m => !m.read && m.direction === 'from_fan').length || 0;
      return {
        ...prev,
        unreadMessageCount: Math.max(0, prev.unreadMessageCount - unreadCount),
      };
    });
  }, [conversations]);

  const sendMessage = useCallback((convId: string, content: string) => {
    const newMessage = {
      id: `msg-${Date.now()}`,
      direction: 'from_blogger' as const,
      content,
      timeAgo: '刚刚',
      read: true,
    };
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c;
      return { ...c, messages: [...c.messages, newMessage], lastTimeAgo: '刚刚' };
    }));
  }, []);

  const appendFanMessage = useCallback((convId: string, content: string, read?: boolean) => {
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      direction: 'from_fan' as const,
      content,
      timeAgo: '刚刚',
      read: read ?? false,
    };
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c;
      return { ...c, messages: [...c.messages, newMessage], lastTimeAgo: '刚刚' };
    }));
    if (!read) {
      setGameState(prev => {
        if (!prev) return prev;
        return { ...prev, unreadMessageCount: prev.unreadMessageCount + 1 };
      });
    }
  }, []);

  const blockConversation = useCallback((convId: string) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c;
      return { ...c, blocked: true };
    }));
  }, []);

  const acceptBusinessFromMessage = useCallback((convId: string) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c;
      return { ...c, businessInfo: { ...c.businessInfo!, status: 'accepted' as const } };
    }));
    const conv = conversations.find(c => c.id === convId);
    if (conv?.businessInfo) {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          income: prev.income + conv.businessInfo!.budget,
          followers: Math.max(0, prev.followers + Math.round(conv.businessInfo!.budget * 0.001)),
        };
      });
    }
  }, [conversations]);

  const rejectBusinessFromMessage = useCallback((convId: string) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c;
      return { ...c, businessInfo: { ...c.businessInfo!, status: 'rejected' as const } };
    }));
  }, []);

  const generateRandomDmConversations = useCallback((
    followers: number,
    mainCategory: string,
    recentPostTitle?: string,
  ) => {
    const types: Array<'praise' | 'request' | 'question' | 'malicious' | 'business'> =
      ['praise', 'praise', 'request', 'question', 'malicious'];
    if (followers >= 1000) types.push('business');

    const type = types[Math.floor(Math.random() * types.length)];
    const nicknames = ['小粉丝', '路人甲', '热心网友', '吃瓜群众', '忠实粉丝', '新来的'];
    const profiles = [
      '20岁大学生/关注1个月',
      '28岁上班族/关注半年',
      '35岁宝妈/关注1年',
      '25岁自由职业/关注3个月',
    ];

    let content = '';
    switch (type) {
      case 'praise':
        content = `博主你好！我特别喜欢你的内容${recentPostTitle ? `，尤其是最近那篇《${recentPostTitle.slice(0, 15)}》` : ''}，每次更新都必看，加油！`;
        break;
      case 'request':
        content = `博主能不能出一期关于${mainCategory}相关的教程呀？一直想学但是找不到好的资料~`;
        break;
      case 'question':
        content = `请问博主，你觉得${mainCategory}领域新手最容易踩的坑是什么？`;
        break;
      case 'malicious':
        content = `就这水平也敢出来做博主？内容越来越水了，取关了。`;
        break;
      case 'business':
        content = `您好，我们是一家${mainCategory}相关品牌，想邀请您合作推广，预算可观，请问有兴趣吗？`;
        break;
    }

    const conv: IPrivateConversation = {
      id: `conv-${Date.now()}-${Math.random()}`,
      nickname: nicknames[Math.floor(Math.random() * nicknames.length)],
      profile: profiles[Math.floor(Math.random() * profiles.length)],
      avatarColor: ['#ff3d8a', '#c77dff', '#5b9cf2', '#4ecdc4', '#ffd93d'][Math.floor(Math.random() * 5)],
      type,
      messages: [{
        id: `msg-${Date.now()}`,
        direction: 'from_fan',
        content,
        timeAgo: '刚刚',
        read: false,
      }],
      lastTimeAgo: '刚刚',
      businessInfo: type === 'business' ? {
        brand: `${mainCategory}品牌合作`,
        productType: mainCategory,
        budget: Math.round(followers * 0.5 + 500),
        requirement: '发布一篇推广内容',
        status: 'pending',
      } : undefined,
    };

    addConversation(conv);
    logger.info('生成随机私信', { type });
  }, [addConversation]);

  return {
    gameState,
    posts,
    deals,
    events,
    conversations,
    isLoading,
    startGame,
    resetGame,
    updateGameState,
    applyPostResult,
    addPost,
    advanceDay,
    checkUnlocks,
    markEventRead,
    clearEvents,
    addDeal,
    updateDeal,
    applyDealResult,
    addEvent,
    updateEvent,
    addCommentReply,
    removeCommentReply,
    addFollowUpReply,
    incrementCommentLikes,
    addConversation,
    markConversationRead,
    sendMessage,
    appendFanMessage,
    blockConversation,
    acceptBusinessFromMessage,
    rejectBusinessFromMessage,
    generateRandomDmConversations,
    localQualityAssessment,
    calculatePostMetrics,
  };
}
