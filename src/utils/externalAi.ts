import { logger } from '@/lib/logger';
import { storage } from '@/lib/storage';

export interface ExternalAiStatus {
  configured: boolean;
  model: string;
}

export interface ExternalComment {
  nickname: string;
  profile: string;
  content: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  likes: number;
  isAd: boolean;
  isNoise: boolean;
}

export interface ExternalReply {
  content: string;
  shouldContinue: boolean;
}

export interface ExternalAiConfigInfo {
  success: boolean;
  configured: boolean;
  baseUrl: string;
  model: string;
  keyMasked: string | null;
  source: 'user' | 'default' | 'browser';
}

export interface AiConfigSaveResult {
  success: boolean;
  configured: boolean;
  model: string;
  keyMasked: string | null;
  baseUrl: string;
  error?: string;
}

export interface QualityAssessmentResult {
  domainClassification: string;
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
  estimatedExposure: number;
}

export interface GeneratedDeal {
  brand: string;
  productType: string;
  budget: number;
  requirement: string;
}

export interface CrisisEventResult {
  eventDescription: string;
  optionResults: Array<{
    option: string;
    followerChange: number;
    feedback: string;
  }>;
}

export interface CommunityMessage {
  nickname: string;
  profile: string;
  content: string;
}

const TIMEOUT_MS = 45000;
const LS_AI_CONFIG_KEY = 'external_ai_config';

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function getRuntimeConfig(): { apiKey: string; baseUrl: string; model: string } | null {
  try {
    const raw = storage.getItem(LS_AI_CONFIG_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { apiKey?: string; baseUrl?: string; model?: string };
    if (!data.apiKey || data.apiKey.length < 8) return null;
    return {
      apiKey: data.apiKey,
      baseUrl: data.baseUrl || 'https://api.deepseek.com/v1',
      model: data.model || 'deepseek-chat',
    };
  } catch {
    return null;
  }
}

function maskKey(key: string): string {
  if (key.length <= 7) return key.slice(0, 2) + '...';
  return key.slice(0, 3) + '...' + key.slice(-4);
}

async function directChatCompletion(params: {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
}): Promise<string> {
  const cfg = getRuntimeConfig();
  if (!cfg) throw new Error('未配置 AI API');

  const url = cfg.baseUrl.endsWith('/')
    ? `${cfg.baseUrl}chat/completions`
    : `${cfg.baseUrl}/chat/completions`;

  const messages: Array<{ role: string; content: string }> = [];
  if (params.systemPrompt) messages.push({ role: 'system', content: params.systemPrompt });
  messages.push({ role: 'user', content: params.prompt });

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature: params.temperature ?? 0.8,
      stream: false,
    }),
  }, TIMEOUT_MS);

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI 接口返回 ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI 返回内容为空');
  return content;
}

function parseJsonArray<T>(text: string): T[] {
  try {
    return JSON.parse(text) as T[];
  } catch {
    const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (codeMatch) {
      try { return JSON.parse(codeMatch[1]) as T[]; } catch { /* continue */ }
    }
    const first = text.indexOf('[');
    const last = text.lastIndexOf(']');
    if (first !== -1 && last !== -1 && last > first) {
      try { return JSON.parse(text.slice(first, last + 1)) as T[]; } catch { /* continue */ }
    }
    throw new Error('无法解析 AI 返回的 JSON 数组');
  }
}

function parseJsonObject<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (codeMatch) {
      try { return JSON.parse(codeMatch[1]) as T; } catch { /* continue */ }
    }
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      try { return JSON.parse(text.slice(first, last + 1)) as T; } catch { /* continue */ }
    }
    throw new Error('无法解析 AI 返回的 JSON 对象');
  }
}

export async function checkAiStatus(): Promise<ExternalAiStatus> {
  const cfg = getRuntimeConfig();
  return {
    configured: !!cfg,
    model: cfg?.model || '',
  };
}

export async function loadAiConfig(): Promise<ExternalAiConfigInfo | null> {
  try {
    const cfg = getRuntimeConfig();
    if (!cfg) {
      return {
        success: true,
        configured: false,
        baseUrl: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat',
        keyMasked: null,
        source: 'default',
      };
    }
    return {
      success: true,
      configured: true,
      baseUrl: cfg.baseUrl,
      model: cfg.model,
      keyMasked: maskKey(cfg.apiKey),
      source: 'browser',
    };
  } catch (e) {
    logger.error('loadAiConfig failed:', e);
    return null;
  }
}

export async function saveAiConfig(config: {
  apiKey: string;
  baseUrl: string;
  model: string;
}): Promise<AiConfigSaveResult> {
  try {
    storage.setItem(LS_AI_CONFIG_KEY, JSON.stringify({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
    }));
    logger.info('AI 配置已保存（浏览器模式）');
    return {
      success: true,
      configured: true,
      model: config.model,
      keyMasked: maskKey(config.apiKey),
      baseUrl: config.baseUrl,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error('saveAiConfig failed:', msg);
    return {
      success: false,
      configured: false,
      model: '',
      keyMasked: null,
      baseUrl: '',
      error: msg,
    };
  }
}

export async function clearAiConfig(): Promise<{ success: boolean; configured: boolean; error?: string }> {
  try {
    storage.removeItem(LS_AI_CONFIG_KEY);
    logger.info('AI 配置已清除');
    return { success: true, configured: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, configured: false, error: msg };
  }
}

export async function generateComments(params: {
  title: string;
  content: string;
  category: string;
  bio: string;
  imageDescriptions?: string[];
  fanCount: number;
  count: number;
}): Promise<ExternalComment[] | null> {
  const cfg = getRuntimeConfig();
  if (!cfg) return null;

  try {
    const systemPrompt = '你是一个社交媒体内容分析助手，擅长模拟真实粉丝评论。';
    const userPrompt = `请为以下社交媒体帖子生成 ${params.count} 条模拟粉丝评论。

【博主信息】
主领域：${params.category}
人设简介：${params.bio}
当前粉丝数：${params.fanCount}

【帖子标题】
${params.title}

【帖子正文】
${params.content}

请输出一个 JSON 数组，每条评论包含以下字段：
- nickname: 评论者昵称（中文）
- profile: 画像标签，格式如 "25岁女白领/关注3个月/轻度粉丝"
- content: 评论内容（15-60字，自然口语化）
- sentiment: "positive" | "neutral" | "negative"
- likes: 点赞数（数字）
- isAd: 是否是广告评论（boolean）
- isNoise: 是否是水贴/无关评论（boolean）

要求：
1. 评论情绪以正面为主，少量中性，极少数负面
2. 评论内容要跟帖子主题相关，有细节感
3. 画像标签要多样化
4. 大约 5%-10% 的 isAd 或 isNoise 评论
5. 只输出 JSON 数组，不要任何解释文字`;

    const content = await directChatCompletion({
      prompt: userPrompt,
      systemPrompt,
      temperature: 0.9,
    });

    const comments = parseJsonArray<ExternalComment>(content);
    if (Array.isArray(comments) && comments.length > 0) {
      logger.info(`评论生成成功，共 ${comments.length} 条（浏览器直连）`);
      return comments;
    }
    return null;
  } catch (e) {
    logger.error('generateComments failed:', e);
    return null;
  }
}

export async function generatePrivateReply(params: {
  originalMessage: string;
  originalType: 'praise' | 'request' | 'question' | 'hostile' | 'business';
  bloggerReply: string;
  fanProfile: string;
  bio: string;
}): Promise<ExternalReply | null> {
  const cfg = getRuntimeConfig();
  if (!cfg) return null;

  try {
    const typeLabels: Record<string, string> = {
      praise: '夸赞', request: '求助', question: '提问',
      hostile: '不友善', business: '商务合作',
    };

    const systemPrompt = '你是一个社交媒体博主的私信回复助手。';
    const userPrompt = `【博主人设】
${params.bio}

【粉丝画像】
${params.fanProfile}

【粉丝私信类型】
${typeLabels[params.originalType] || params.originalType}

【粉丝私信内容】
${params.originalMessage}

【博主回复草稿】
${params.bloggerReply || '(空)'}

请基于博主的人设和已输入的回复草稿，生成一段完整自然的私信回复。

输出 JSON 对象，包含：
- content: 完整的回复内容（50-150字，口语化）
- shouldContinue: 是否建议继续对话（boolean）

只输出 JSON，不要解释。`;

    const content = await directChatCompletion({
      prompt: userPrompt,
      systemPrompt,
      temperature: 0.8,
    });

    const reply = parseJsonObject<ExternalReply>(content);
    if (reply && typeof reply.content === 'string') {
      logger.info('私信回复生成成功（浏览器直连）');
      return reply;
    }
    return null;
  } catch (e) {
    logger.error('generatePrivateReply failed:', e);
    return null;
  }
}

export async function generateQualityAssessment(params: {
  title: string;
  content: string;
  mainCategory: string;
  verticality: number;
}): Promise<QualityAssessmentResult | null> {
  const cfg = getRuntimeConfig();
  if (!cfg) return null;

  try {
    const systemPrompt = '你是一个专业的社交媒体内容质量评估师。';
    const userPrompt = `请对以下社交媒体帖子进行质量评估。

【博主主领域】
${params.mainCategory}
【当前垂直度】${params.verticality}/100

【帖子标题】
${params.title}

【帖子正文】
${params.content}

请输出 JSON 对象，包含：
- domainClassification: 内容所属领域（字符串）
- categoryMatch: "high" | "medium" | "low"（与主领域的匹配度）
- scores: {
    titleAppeal: 0-100 数字（标题吸引力）
    infoDensity: 0-100 数字（信息密度）
    emotionalResonance: 0-100 数字（情绪共鸣）
    topicality: 0-100 数字（话题时效性）
  }
- overallScore: 0-100 数字（综合评分）
- riskLevel: "none" | "low" | "medium" | "high"（内容风险等级）
- algorithmFeedback: 算法反馈文字（100字内，说明优缺点和改进建议）
- estimatedExposure: 预估曝光量（整数，基于评分和当前垂直度估算）

只输出 JSON，不要任何解释文字。`;

    const content = await directChatCompletion({
      prompt: userPrompt,
      systemPrompt,
      temperature: 0.3,
    });

    const result = parseJsonObject<QualityAssessmentResult>(content);
    if (result && result.scores && typeof result.overallScore === 'number') {
      logger.info(`内容质量评估完成，综合分 ${result.overallScore}（浏览器直连）`);
      return result;
    }
    return null;
  } catch (e) {
    logger.error('generateQualityAssessment failed:', e);
    return null;
  }
}

export async function generateDeals(params: {
  followers: number;
  mainCategory: string;
  verticality: number;
  count?: number;
}): Promise<GeneratedDeal[]> {
  const cfg = getRuntimeConfig();
  if (!cfg) return [];

  try {
    const n = params.count ?? 3;
    const systemPrompt = '你是一个品牌商务合作经纪。';
    const userPrompt = `请为一位社交媒体博主生成 ${n} 个商单合作邀请。

【博主信息】
主领域：${params.mainCategory}
粉丝数：${params.followers}
垂直度：${params.verticality}/100

请输出 JSON 数组，每个商单包含：
- brand: 品牌名称（中文，听起来像真实品牌）
- productType: 产品类型（如"护肤品"、"智能设备"等）
- budget: 预算金额（人民币，数字，根据粉丝数合理定价）
- requirement: 合作要求描述（如"发布一篇深度测评文，配图不少于3张"）

要求：
1. 品牌和产品要与博主主领域相关，也可以有1-2个跨界合作
2. 预算金额要符合粉丝量级的市场行情
3. 只输出 JSON 数组，不要解释`;

    const content = await directChatCompletion({
      prompt: userPrompt,
      systemPrompt,
      temperature: 0.9,
    });

    const deals = parseJsonArray<GeneratedDeal>(content);
    if (Array.isArray(deals) && deals.length > 0) {
      logger.info(`商单生成成功，共 ${deals.length} 个（浏览器直连）`);
      return deals;
    }
    return [];
  } catch (e) {
    logger.error('generateDeals failed:', e);
    return [];
  }
}

// ========== 本地兜底实现（页面兼容用） ==========

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

export async function evaluateContent(
  title: string,
  content: string,
  mainCategory: string,
  verticality: number,
): Promise<EvaluateResult> {
  // 先尝试外部 API
  const apiResult = await generateQualityAssessment({ title, content, mainCategory, verticality });
  if (apiResult) {
    return {
      category: apiResult.domainClassification,
      categoryMatch: apiResult.categoryMatch,
      scores: apiResult.scores,
      overallScore: apiResult.overallScore,
      riskLevel: apiResult.riskLevel,
      algorithmFeedback: apiResult.algorithmFeedback,
    };
  }

  // 本地兜底
  const wordCount = content.length;
  let titleAppeal = 50 + Math.random() * 20;
  if (title.length >= 10 && title.length <= 25) titleAppeal += 15;
  if (/[!?！？]/.test(title)) titleAppeal += 10;

  let infoDensity = 40 + Math.random() * 20;
  if (wordCount >= 100) infoDensity += 15;
  if (wordCount >= 300) infoDensity += 10;

  let emotionalResonance = 45 + Math.random() * 20;
  if (/[我你他她]/.test(content)) emotionalResonance += 10;

  const topicality = 50 + Math.random() * 30;

  const overallScore = Math.round(
    (titleAppeal + infoDensity + emotionalResonance + topicality) / 4,
  );

  const categoryKeywords: Record<string, string[]> = {
    美妆: ['口红', '粉底', '眼影', '护肤', '化妆', '面膜'],
    科技: ['手机', '电脑', '芯片', 'AI', '智能', '数码'],
    美食: ['好吃', '食谱', '烹饪', '探店', '餐厅'],
    情感: ['恋爱', '分手', '婚姻', '友情', '孤独'],
    游戏: ['游戏', '电竞', '攻略', '主播', '排位'],
    财经: ['股票', '基金', '理财', '投资', '赚钱'],
    健身: ['减肥', '增肌', '跑步', '瑜伽', '运动'],
    旅行: ['旅行', '旅游', '攻略', '景点', '酒店'],
  };
  const keywords = categoryKeywords[mainCategory] || [];
  const matchCount = keywords.filter(k => content.includes(k) || title.includes(k)).length;
  const categoryMatch: 'high' | 'medium' | 'low' =
    matchCount >= 2 ? 'high' : matchCount >= 1 ? 'medium' : 'low';

  const riskLevel: 'none' | 'low' | 'medium' | 'high' =
    overallScore < 30 ? 'medium' : 'none';

  const feedbacks = [
    '内容质量不错，标题有吸引力，建议增加更多细节',
    '整体表现良好，信息密度适中，可以尝试更有争议性的话题',
    '内容偏短，建议增加深度分析和个人观点',
    '情绪共鸣不错，继续保持个人风格',
  ];

  return {
    category: mainCategory,
    categoryMatch,
    scores: {
      titleAppeal: Math.min(100, Math.round(titleAppeal)),
      infoDensity: Math.min(100, Math.round(infoDensity)),
      emotionalResonance: Math.min(100, Math.round(emotionalResonance)),
      topicality: Math.min(100, Math.round(topicality)),
    },
    overallScore,
    riskLevel,
    algorithmFeedback: feedbacks[Math.floor(Math.random() * feedbacks.length)],
  };
}

export interface FanCommentStream {
  id: string;
  avatarLabel: string;
  profile: string;
  content: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export async function generateFanComments(
  stage: string,
  avgScore: number,
  verticality: number,
  category: string,
  onComment: (comment: FanCommentStream) => void,
): Promise<void> {
  const count = Math.min(12, Math.max(4, Math.round(avgScore / 10)));
  const nicknames = ['橘子汽水', '代码搬运工', '深夜食堂', '奶茶三分糖', '一只咸鱼', '晴天娃娃', '月亮不睡', '晚风撩人', '芝士不加糖', '柠檬不萌'];
  const profiles = ['22岁大学生/新粉', '28岁产品经理/轻度粉', '35岁宝妈/核心粉', '25岁设计师/轻度粉', '19岁高中生/新粉', '40岁自由职业/死忠粉'];

  const positiveContents = [
    `太棒了！${category}这个话题我一直在关注`,
    '终于等到更新了！这期内容超有干货',
    '跟着博主学到好多，每次更新都必看',
    '质量真的高，每一句话都说到我心坎里了',
    '这个角度好新颖，之前从来没这么想过',
    '已转发到朋友圈，朋友们都说好！',
  ];
  const neutralContents = ['还行吧，感觉一般般', '内容可以，但节奏有点慢', '路过看看，顺便留个言', '支持一下，希望继续加油'];
  const negativeContents = ['就这？也太水了吧', '感觉质量下降了', '不同意你的观点，太片面了'];

  for (let i = 0; i < count; i++) {
    await new Promise(r => setTimeout(r, 300 + Math.random() * 500));
    const rand = Math.random();
    const positiveRatio = avgScore >= 70 ? 0.75 : avgScore >= 50 ? 0.55 : 0.35;
    let sentiment: 'positive' | 'neutral' | 'negative';
    let contentPool: string[];
    if (rand < positiveRatio) {
      sentiment = 'positive';
      contentPool = positiveContents;
    } else if (rand < positiveRatio + 0.2) {
      sentiment = 'neutral';
      contentPool = neutralContents;
    } else {
      sentiment = 'negative';
      contentPool = negativeContents;
    }

    const nickname = nicknames[Math.floor(Math.random() * nicknames.length)];
    onComment({
      id: `comment_${Date.now()}_${i}`,
      avatarLabel: nickname.charAt(0),
      profile: profiles[Math.floor(Math.random() * profiles.length)],
      content: contentPool[Math.floor(Math.random() * contentPool.length)],
      sentiment,
    });
  }
}

export async function generatePartnershipDeals(
  followers: number,
  mainCategory: string,
  verticality: number,
): Promise<GeneratedDeal[]> {
  const apiDeals = await generateDeals({ followers, mainCategory, verticality });
  if (apiDeals.length > 0) return apiDeals;

  const brands = [`${mainCategory}优选`, '品质生活家', '新锐品牌', '好物推荐官', '精选商城'];
  const productTypes = [`${mainCategory}产品`, '生活用品', '数码配件', '食品饮料', '美妆个护'];
  const count = 3;
  const deals: GeneratedDeal[] = [];

  for (let i = 0; i < count; i++) {
    const baseBudget = Math.max(500, followers * 0.5);
    const budget = Math.round(baseBudget * (0.5 + Math.random()));
    deals.push({
      brand: brands[Math.floor(Math.random() * brands.length)],
      productType: productTypes[Math.floor(Math.random() * productTypes.length)],
      budget,
      requirement: `发布一篇${productTypes[i % productTypes.length]}相关的推广内容，要求真实体验分享`,
    });
  }
  return deals;
}

export async function resolveDealAcceptance(
  brand: string,
  productType: string,
  requirement: string,
  mainCategory: string,
  verticality: number,
  followers: number,
): Promise<{ followerChange: number; feedback: string }> {
  const isRelevant = productType.includes(mainCategory) || mainCategory.includes(productType);
  const baseChange = isRelevant ? Math.round(followers * 0.02) : -Math.round(followers * 0.01);
  const followerChange = baseChange + Math.round((Math.random() - 0.3) * 100);

  const feedbacks = isRelevant
    ? [
        `与${brand}的合作非常成功，粉丝反响热烈，品牌方表示满意`,
        `推广内容自然不生硬，粉丝接受度高，合作效果超出预期`,
        `产品与你的账号定位契合，粉丝信任度高，转化效果不错`,
      ]
    : [
        `粉丝对${productType}类广告不太买账，出现了一些掉粉`,
        `广告内容与账号定位差异较大，部分粉丝表示不满`,
        `虽然获得了收入，但粉丝体验有所下降，建议谨慎接这类商单`,
      ];

  return {
    followerChange,
    feedback: feedbacks[Math.floor(Math.random() * feedbacks.length)],
  };
}

export async function generateCommunityChat(
  loyalty: number,
  topic: string,
  type: string,
  onMessage: (msg: FanCommentStream) => void,
): Promise<void> {
  const count = Math.min(10, Math.max(4, Math.round(loyalty / 15)));
  const nicknames = ['小粉丝', '阿杰', '米米', '豆子', '果然', '呀呀呀', '快乐星球', '温柔一刀'];
  const contents = [
    `关于「${topic}」，我觉得说得很对！`,
    '这个话题我也很感兴趣，期待更多分享',
    '博主说得太好了，完全认同！',
    '有没有更详细的教程呀？想学学',
    '我也有类似的经历，感同身受',
    '支持博主！继续加油~',
    '这个观点很新颖，学到了',
    '已经收藏了，慢慢看',
  ];

  for (let i = 0; i < count; i++) {
    await new Promise(r => setTimeout(r, 400 + Math.random() * 600));
    const nickname = nicknames[Math.floor(Math.random() * nicknames.length)];
    onMessage({
      id: `chat_${Date.now()}_${i}`,
      avatarLabel: nickname.charAt(0),
      profile: `${nickname}/粉丝`,
      content: contents[Math.floor(Math.random() * contents.length)],
      sentiment: 'positive',
    });
  }
}

export async function runCommunityActivity(
  loyalty: number,
  activityType: string,
  mainCategory: string,
): Promise<{ feedback: string; loyaltyGain: number; messages: FanCommentStream[] }> {
  const loyaltyGain = activityType === 'lottery' ? 8 + Math.floor(Math.random() * 8) : 5 + Math.floor(Math.random() * 6);
  const activityNames: Record<string, string> = {
    lottery: '抽奖活动',
    checkin: '打卡活动',
    qa: '问答互动',
  };
  const name = activityNames[activityType] || '社群活动';

  const messages: FanCommentStream[] = [];
  const nicknames = ['幸运儿', '打卡达人', '好学宝宝', '活跃粉丝', '热心网友'];
  const contents = [
    '太开心了！参与活动~',
    '已打卡！期待下次活动',
    '这个活动太棒了，博主真好',
    '学到了很多，感谢博主分享',
    '已经转发给朋友了',
  ];
  for (let i = 0; i < 5; i++) {
    const nickname = nicknames[i];
    messages.push({
      id: `act_msg_${Date.now()}_${i}`,
      avatarLabel: nickname.charAt(0),
      profile: `${nickname}/粉丝`,
      content: contents[i],
      sentiment: 'positive',
    });
  }

  return {
    feedback: `${name}圆满结束！粉丝参与度很高，社群氛围更加活跃了。大家纷纷表示期待下一次活动~`,
    loyaltyGain,
    messages,
  };
}

export async function generateCrisisEvent(
  mainCategory: string,
  followers: number,
): Promise<{ title: string; description: string; options: string[] }> {
  const crises = [
    {
      title: '水军刷差评',
      description: '有大量疑似水军账号在你的评论区刷负面评论，声称你的内容是抄袭的，已经开始影响其他粉丝的判断。',
      options: ['无视，清者自清', '置顶澄清声明', '发长文举证反驳', '联系平台举报水军'],
    },
    {
      title: '内容被断章取义',
      description: '有营销号截取了你某期内容的片段，歪曲你的原意并配上误导性标题，已经在网上传播开来。',
      options: ['沉默等待热度过去', '公开道歉平息争议', '发布完整内容举证', '用幽默化解尴尬'],
    },
    {
      title: '竞品拉踩对比',
      description: '同领域的另一位博主发布了对比视频，暗中贬低你的内容质量，抬高自己，已经引发了双方粉丝的骂战。',
      options: ['不理会，专注做内容', '发视频暗讽回去', '主动联系对方联动', '用数据说话发对比'],
    },
    {
      title: '老粉脱粉回踩',
      description: '一位关注你很久的核心粉丝突然发布长文，声称你变了，内容质量下降，还爆出了一些私下聊天记录，引发了热议。',
      options: ['私下沟通了解情况', '公开回应质疑', '冷处理等待平息', '发福利安抚粉丝'],
    },
  ];

  const crisis = crises[Math.floor(Math.random() * crises.length)];
  return crisis;
}

export async function resolveCrisisChoice(
  title: string,
  description: string,
  choice: string,
  loyalty: number,
): Promise<{ followerChange: number; loyaltyChange: number; feedback: string }> {
  const goodChoices = ['举证', '澄清', '举报', '幽默', '联动', '数据', '沟通'];
  const badChoices = ['无视', '沉默', '道歉', '暗讽', '冷处理'];

  const isGood = goodChoices.some(c => choice.includes(c));
  const isBad = badChoices.some(c => choice.includes(c));

  let baseFollowerChange: number;
  let baseLoyaltyChange: number;
  let feedback: string;

  if (isGood) {
    baseFollowerChange = Math.round(Math.random() * 200);
    baseLoyaltyChange = 3 + Math.floor(Math.random() * 5);
    feedback = `你的应对非常明智！「${choice}」成功化解了危机，粉丝们纷纷表示支持，反而吸引了更多人关注。危机也是机遇，你的公关能力得到了大家的认可。`;
  } else if (isBad) {
    baseFollowerChange = -Math.round(100 + Math.random() * 300);
    baseLoyaltyChange = -5 - Math.floor(Math.random() * 8);
    feedback = `「${choice}」的应对方式不太理想，危机没有得到有效控制，反而愈演愈烈。部分粉丝感到失望，选择了离开。建议下次遇到类似情况时，更积极主动地回应。`;
  } else {
    baseFollowerChange = -Math.round(Math.random() * 100);
    baseLoyaltyChange = -1 - Math.floor(Math.random() * 3);
    feedback = `「${choice}」的应对中规中矩，危机暂时平息了，但也留下了一些隐患。粉丝们的反应比较平淡，建议下次可以更主动一些。`;
  }

  const loyaltyBonus = Math.round(loyalty / 50);
  const followerChange = baseFollowerChange + loyaltyBonus * (baseFollowerChange >= 0 ? 1 : -1);
  const loyaltyChange = baseLoyaltyChange;

  return { followerChange, loyaltyChange, feedback };
}

export async function generateDmReply(params: {
  fanName: string;
  fanProfile: string;
  conversationHistory: Array<{ role: string; content: string }>;
  userReply: string;
  tone: string;
}): Promise<string | null> {
  const config = loadAiConfig();
  if (!config?.apiKey) {
    const replies = [
      `好的呀，谢谢博主回复~`,
      `收到！博主真好`,
      `嗯嗯，明白了`,
      `谢谢博主，我会继续支持你的！`,
      `哇，博主亲自回复我了，好开心！`,
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  try {
    const messages = [
      {
        role: 'system',
        content: `你是一个社交媒体粉丝，正在与博主私信互动。请根据博主的回复内容，给出自然、个性化的回应。语气：${params.tone}。`,
      },
      ...params.conversationHistory.slice(-4),
      { role: 'user', content: params.userReply },
    ];

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.8,
        max_tokens: 100,
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error('generateDmReply failed:', e);
    return `好的呀，谢谢博主回复~`;
  }
}
