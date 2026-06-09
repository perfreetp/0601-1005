import type { Task, TaskFullData, TranscriptSegment, Chapter, Highlight, CopyContent, CheckItem } from './types';

export const tasks: Task[] = [
  {
    id: 'task-001',
    title: 'AI大模型时代的创业者机会在哪里',
    fileName: 'ai-startup-opportunities.mp3',
    fileSize: 52428800,
    duration: 3600,
    status: 'processing',
    progress: 45,
    createdAt: '2026-06-08T10:30:00Z',
    retryCount: 0,
    currentStep: 2,
  },
  {
    id: 'task-002',
    title: '对话连续创业者：从0到1打造爆款产品的方法论',
    fileName: 'serial-entrepreneur-interview.mp3',
    fileSize: 78643200,
    duration: 5400,
    status: 'completed',
    progress: 100,
    createdAt: '2026-06-07T14:00:00Z',
    retryCount: 1,
    currentStep: 5,
  },
  {
    id: 'task-003',
    title: '深度解析：AGI何时会真正到来',
    fileName: 'agi-timeline-analysis.mp3',
    fileSize: 41943040,
    duration: 2700,
    status: 'failed',
    progress: 30,
    createdAt: '2026-06-06T09:15:00Z',
    error: '音频转写服务连接超时，请检查网络后重试',
    retryCount: 3,
    currentStep: 1,
  },
];

const transcriptTask002: TranscriptSegment[] = [
  {
    id: 'seg-001',
    startTime: 0,
    endTime: 180,
    speaker: '主持人-林子',
    text: '大家好，欢迎来到《创业者说》节目，我是主持人林子。今天我们非常荣幸邀请到了连续创业者、前字节跳动产品总监李明远老师。明远你好，先跟听众朋友们打个招呼吧。',
  },
  {
    id: 'seg-002',
    startTime: 180,
    endTime: 320,
    speaker: '嘉宾-李明远',
    text: '大家好，我是李明远，很高兴能来到这个节目。其实也不太敢当什么连续创业者，就是一路折腾过来的，踩过不少坑，也有一些小小的收获吧。',
  },
  {
    id: 'seg-003',
    startTime: 320,
    endTime: 520,
    speaker: '主持人-林子',
    text: '太谦虚了。明远你从2015年开始创业，到现在已经做了三家公司，其中两家都做到了过亿营收，这个成绩在创业圈绝对是头部水平。我们今天就想好好聊聊，从0到1打造一个爆款产品，到底有没有方法论可循？',
  },
  {
    id: 'seg-004',
    startTime: 520,
    endTime: 780,
    speaker: '嘉宾-李明远',
    text: '方法论肯定是有的，但我更愿意称之为"底层逻辑"。因为每家公司、每个产品面对的情况都不一样，生搬硬套肯定不行。不过我确实总结了几个关键的决策点，嗯……那个……怎么说呢，就叫那个——「产品验证四步法」吧，对，产品验证四步法。',
    isMistake: true,
    mistakeType: 'filler',
  },
  {
    id: 'seg-005',
    startTime: 780,
    endTime: 1020,
    speaker: '主持人-林子',
    text: '产品验证四步法，听起来很有意思，能具体展开讲讲吗？',
  },
  {
    id: 'seg-006',
    startTime: 1020,
    endTime: 1350,
    speaker: '嘉宾-李明远',
    text: '好的。第一步是"伪需求筛选"。很多创业者一开始想到的点子，其实都是伪需求。怎么判断呢？很简单，你去找10个目标用户，问他们愿不愿意为这个产品付钱。如果有7个以上说愿意，而且当场就想掏钱，那这个需求可能是真的。如果只是说"听起来不错"，那基本就是伪需求。',
  },
  {
    id: 'seg-007',
    startTime: 1350,
    endTime: 1620,
    speaker: '主持人-林子',
    text: '这个方法听起来很简单，但其实很多人做不到。大家总觉得自己的想法很独特，不愿意去面对真实的用户反馈。',
  },
  {
    id: 'seg-008',
    startTime: 1620,
    endTime: 1980,
    speaker: '嘉宾-李明远',
    text: '对，创业者最大的敌人就是"自嗨"。我在做第二家公司的时候就踩过这个坑。当时我们做了一个社交产品，团队觉得设计得特别棒，结果上线三个月，日活连500都不到。后来我们才发现，用户根本不需要我们提供的那些功能——那些功能都是我们自己觉得很酷的。',
  },
  {
    id: 'seg-009',
    startTime: 1980,
    endTime: 2280,
    speaker: '主持人-林子',
    text: '那后来是怎么调整的呢？',
  },
  {
    id: 'seg-010',
    startTime: 2280,
    endTime: 2650,
    speaker: '嘉宾-李明远',
    text: '我们把产品直接停掉了，然后团队每个人每天去跟5个用户聊天，聊了整整两个礼拜。最后发现用户真正需要的是一个能帮助他们管理客户关系的工具，而不是社交产品。于是我们调转方向，就是那个CRM——客户关系管理系统，对，客户关系管理系统，后来做成了，现在还在盈利。',
    isMistake: true,
    mistakeType: 'pronunciation',
  },
  {
    id: 'seg-011',
    startTime: 2650,
    endTime: 2950,
    speaker: '主持人-林子',
    text: '这个转变太戏剧化了。所以第二步是什么呢？',
  },
  {
    id: 'seg-012',
    startTime: 2950,
    endTime: 3320,
    speaker: '嘉宾-李明远',
    text: '第二步是"最小可行性产品"，也就是大家常说的MVP。但这里我有个不同的观点：很多人理解的MVP是功能最少的产品，我认为MVP应该是"价值最小闭环"。也就是说，你的产品可以很简陋，但必须让用户完整地感受到核心价值。',
  },
  {
    id: 'seg-013',
    startTime: 3320,
    endTime: 3680,
    speaker: '主持人-林子',
    text: '价值最小闭环，这个概念很有意思。能举个例子吗？',
  },
  {
    id: 'seg-014',
    startTime: 3680,
    endTime: 4080,
    speaker: '嘉宾-李明远',
    text: '比如你要做一个在线教育产品，不要一开始就做App、做支付系统、做课程管理后台。你可以先拉一个微信群，每天在群里分享内容，然后收9块9的入群费。如果有100个人愿意付钱，而且他们听了之后觉得有价值，愿意续——那个……续……续费，对，愿意续费，那这个产品的核心价值就被验证了。',
    isMistake: true,
    mistakeType: 'filler',
  },
  {
    id: 'seg-015',
    startTime: 4080,
    endTime: 4380,
    speaker: '主持人-林子',
    text: '太有启发了。那第三步和第四步呢？',
  },
  {
    id: 'seg-016',
    startTime: 4380,
    endTime: 4780,
    speaker: '嘉宾-李明远',
    text: '第三步是"增长假设验证"。就是你要想清楚，你的产品靠什么增长。是口碑传播？是付费投放？还是渠道合作？每种增长方式对应的产品策略完全不同。第四步是"商业化验证"。很多产品用户量很大，但就是赚不到钱，这就是商业化验证没做好。在产品只有1000个用户的时候，你就要开始想怎么从他们身上赚钱了。',
  },
  {
    id: 'seg-017',
    startTime: 4780,
    endTime: 5100,
    speaker: '主持人-林子',
    text: '非常精彩的分享。我想很多听众朋友跟我一样，听完之后都有一种"原来是这样"的感觉。由于时间关系，我们今天的节目就要接近尾声了。明远最后还有什么话想对正在创业路上的朋友们说吗？',
  },
  {
    id: 'seg-018',
    startTime: 5100,
    endTime: 5400,
    speaker: '嘉宾-李明远',
    text: '我想说，创业是一场马拉松，不是百米冲刺。不要追求一时的快慢，要追求长期的节奏。保持学习，保持谦逊，永远和用户站在一起。祝大家都能做出自己心中的那款产品。谢谢大家。',
  },
];

const chaptersTask002: Chapter[] = [
  {
    id: 'ch-001',
    title: '开场与嘉宾介绍',
    startTime: 0,
    endTime: 520,
    keywords: ['开场', '嘉宾介绍', '创业经历'],
    summary: '主持人林子介绍节目主题，邀请嘉宾李明远出场，并简要回顾其连续创业的辉煌经历，引出本期讨论话题——从0到1打造爆款产品的方法论。',
  },
  {
    id: 'ch-002',
    title: '产品验证四步法之伪需求筛选',
    startTime: 520,
    endTime: 1620,
    keywords: ['伪需求', '用户验证', '付费意愿', '自嗨陷阱'],
    summary: '李明远提出"产品验证四步法"框架，并详细讲解第一步"伪需求筛选"：通过询问目标用户的付费意愿来判断需求真伪，强调创业者要避免"自嗨"心态。',
  },
  {
    id: 'ch-003',
    title: '实战案例：从社交产品到CRM的转型',
    startTime: 1620,
    endTime: 2650,
    keywords: ['创业失败', '用户访谈', '产品转型', 'CRM'],
    summary: '李明远分享自己第二次创业的失败教训：团队闭门造车做社交产品惨败，后通过深入用户访谈发现真实需求，成功转型做CRM工具并实现盈利。',
  },
  {
    id: 'ch-004',
    title: 'MVP的真正含义：价值最小闭环',
    startTime: 2650,
    endTime: 4080,
    keywords: ['MVP', '最小可行性产品', '价值闭环', '在线教育案例'],
    summary: '讲解第二步"最小可行性产品"，提出MVP的核心不是功能最少，而是"价值最小闭环"。以在线教育产品为例，说明如何用微信群+9.9元入群费验证核心价值。',
  },
  {
    id: 'ch-005',
    title: '增长假设与商业化验证',
    startTime: 4080,
    endTime: 4780,
    keywords: ['增长策略', '商业化', '变现模式', '早期验证'],
    summary: '介绍第三步"增长假设验证"和第四步"商业化验证"，强调在产品早期就要明确增长方式和变现路径，避免用户量大却无法盈利的困境。',
  },
  {
    id: 'ch-006',
    title: '总结与创业寄语',
    startTime: 4780,
    endTime: 5400,
    keywords: ['创业心态', '长期主义', '用户至上'],
    summary: '主持人总结本期核心观点，李明远以"创业是马拉松"为喻，寄语创业者保持学习、保持谦逊、永远和用户站在一起。',
  },
];

const highlightsTask002: Highlight[] = [
  {
    id: 'hl-001',
    text: '创业者最大的敌人就是"自嗨"。',
    startTime: 1750,
    speaker: '李明远',
    isFavorite: true,
  },
  {
    id: 'hl-002',
    text: '去找10个目标用户，问他们愿不愿意为这个产品付钱。如果有7个以上说愿意而且当场就想掏钱，那这个需求可能是真的。',
    startTime: 1150,
    speaker: '李明远',
    isFavorite: true,
  },
  {
    id: 'hl-003',
    text: 'MVP不是功能最少的产品，而是"价值最小闭环"。你的产品可以很简陋，但必须让用户完整地感受到核心价值。',
    startTime: 3050,
    speaker: '李明远',
    isFavorite: true,
  },
  {
    id: 'hl-004',
    text: '我们把产品直接停掉了，然后团队每个人每天去跟5个用户聊天，聊了整整两个礼拜。',
    startTime: 2400,
    speaker: '李明远',
    isFavorite: false,
  },
  {
    id: 'hl-005',
    text: '在产品只有1000个用户的时候，你就要开始想怎么从他们身上赚钱了。',
    startTime: 4600,
    speaker: '李明远',
    isFavorite: true,
  },
  {
    id: 'hl-006',
    text: '创业是一场马拉松，不是百米冲刺。不要追求一时的快慢，要追求长期的节奏。',
    startTime: 5200,
    speaker: '李明远',
    isFavorite: true,
  },
  {
    id: 'hl-007',
    text: '每种增长方式对应的产品策略完全不同。',
    startTime: 4500,
    speaker: '李明远',
    isFavorite: false,
  },
];

const copyTask002: CopyContent = {
  titles: [
    '连续创业者李明远：从0到1打造爆款产品的四步法',
    '三家公司两家过亿营收，他总结了这四条创业铁律',
    '别再自嗨了！真正的爆款产品都是这样验证出来的',
  ],
  summary:
    '本期《创业者说》邀请连续创业者、前字节跳动产品总监李明远，分享从0到1打造爆款产品的核心方法论。他提出"产品验证四步法"：伪需求筛选、价值最小闭环、增长假设验证、商业化验证。结合自身从社交产品惨败到成功转型CRM的真实案例，深度剖析创业者如何避免"自嗨"陷阱、用最低成本验证产品价值、在早期就规划好增长和变现路径。无论你是正在创业还是准备创业，这期节目都将为你提供可落地的实操框架。',
  shownotes: `## 本期嘉宾
李明远，连续创业者，前字节跳动产品总监。2015年开始创业，先后创立3家公司，其中2家实现过亿营收，在产品方法论和创业实战方面拥有丰富经验。

## 时间线
- 00:00 开场与嘉宾介绍
- 08:40 产品验证四步法之伪需求筛选
- 27:00 实战案例：从社交产品到CRM的转型
- 44:10 MVP的真正含义：价值最小闭环
- 1:08:00 增长假设与商业化验证
- 1:19:40 总结与创业寄语

## 核心观点
1. 创业者最大的敌人是"自嗨"，要通过付费意愿验证真实需求
2. MVP的本质是"价值最小闭环"，而非功能最少
3. 产品早期就要明确增长方式和变现路径
4. 保持学习、保持谦逊、永远和用户站在一起

## 延伸阅读
- 《精益创业》- 埃里克·莱斯
- 《从0到1》- 彼得·蒂尔
- 《增长黑客》- 肖恩·埃利斯

## 联系我们
公众号：创业者说播客
听友群：添加微信 cyz2026 入群`,
  socialPosts: {
    xiaohongshu: `🔥三位连续创业者亲测有效的产品验证方法论！

姐妹们谁懂啊😅，之前做产品总觉得自己想法超棒，结果上线没人用…

直到听了李明远老师的分享，才知道自己一直在"自嗨"😭

他的"产品验证四步法"真的太绝了👇
✅ 伪需求筛选：找10个用户问愿不愿意付钱
✅ 价值最小闭环：MVP不是功能少，是让用户感受到核心价值
✅ 增长假设验证：想好靠什么增长再动手
✅ 商业化验证：1000个用户时就要想怎么赚钱

尤其是他讲自己把社交产品砍掉、团队每天跟5个用户聊天聊了两周的故事，真的很震撼🥹

创业不是靠一腔热血，是靠正确的方法论！

强烈推荐给所有正在创业或准备创业的宝子们！

#创业 #产品经理 #MVP #精益创业 #干货分享`,
    weibo: `【播客推荐】连续创业者李明远：从0到1打造爆款产品的四步法

从社交产品惨败到CRM工具过亿营收，他踩过的坑比你听过的创业故事还多。

分享4个可直接落地的产品验证步骤：
1️⃣ 用付费意愿筛选伪需求
2️⃣ 做"价值最小闭环"而非简陋MVP
3️⃣ 早期验证增长假设
4️⃣ 1000用户时就开始商业化

创业是马拉松，不是百米冲刺。转发给你身边正在创业的朋友👉

#创业者说 #产品方法论 #精益创业`,
    official: `《创业者说》EP23 正式上线！

本期嘉宾：连续创业者、前字节跳动产品总监 李明远

他是如何在三次创业中两次做到过亿营收？
从社交产品的惨败中，他悟出了怎样的产品哲学？
"产品验证四步法"又如何帮助创业者降低90%的失败风险？

本期节目，李明远将结合自身真实经历，为你拆解从0到1打造爆款产品的完整路径。

收听方式：
🎙️ 小宇宙APP：搜索《创业者说》
🎧 喜马拉雅：搜索《创业者说》
📱 苹果播客：搜索《创业者说》

评论区聊聊：你踩过最大的创业坑是什么？`,
  },
  coverPrompt:
    '播客封面设计，现代简约风格。左侧是主持人林子和嘉宾李明远的半身剪影插画，右侧是醒目的节目标题文字"创业者说"，下方是本期主题"从0到1打造爆款产品"。背景采用深蓝到紫色的渐变，点缀一些抽象的几何图形和数据可视化元素，整体感觉专业、科技感强、有品质感。文字使用白色无衬线字体，层次分明。尺寸3000x3000像素。',
};

const checklistTask002: CheckItem[] = [
  {
    id: 'ci-001',
    name: '转写准确率检查',
    status: 'pass',
    message: '转写内容整体准确率良好',
    details: ['共检测18个转写段落', '识别出3处口误标记（2处填充词、1处发音重复）', '专有名词识别准确：CRM、MVP、字节跳动', '说话人区分清晰：主持人-林子、嘉宾-李明远'],
  },
  {
    id: 'ci-002',
    name: '章节划分合理性',
    status: 'pass',
    message: '章节划分完整，逻辑清晰',
    details: ['共划分6个章节', '章节时长分布合理（最短420秒，最长1030秒）', '每章有关键词和摘要', '时间节点与转写内容对应准确'],
  },
  {
    id: 'ci-003',
    name: '金句提取质量',
    status: 'pass',
    message: '金句提取精准，具有传播价值',
    details: ['共提取7条金句', '覆盖核心观点：避免自嗨、用户验证、MVP定义、商业化等', '4条标记为精选金句', '说话人归属正确，时间戳准确'],
  },
  {
    id: 'ci-004',
    name: '文案生成质量',
    status: 'warning',
    message: '文案整体良好，建议微调部分表述',
    details: ['标题3个变体，角度多样且有吸引力', '摘要完整覆盖核心内容（约350字）', 'Shownotes结构清晰，时间线准确', '小红书文案：可增加1-2个emoji增强视觉效果', '微博文案：话题标签设置合理', '官方公众号文案：格式规范'],
  },
  {
    id: 'ci-005',
    name: '敏感内容检测',
    status: 'pass',
    message: '未检测到敏感内容',
    details: ['未检测到政治敏感词汇', '未检测到违规广告内容', '未检测到低俗或攻击性语言', '人物提及均符合事实陈述'],
  },
  {
    id: 'ci-006',
    name: '时间戳一致性',
    status: 'pass',
    message: '所有时间戳数据一致',
    details: ['总时长5400秒，与任务信息一致', '转写段落首尾时间连续无重叠', '金句时间戳均落在对应转写段落内', '章节起止时间与转写内容对齐'],
  },
  {
    id: 'ci-007',
    name: '封面提示词完整性',
    status: 'pass',
    message: '封面提示词描述详细',
    details: ['明确了设计风格：现代简约', '包含人物元素描述', '配色方案具体：深蓝到紫色渐变', '尺寸规格清晰：3000x3000像素'],
  },
];

export const taskFullDataMap: Record<string, TaskFullData> = {
  'task-002': {
    task: tasks[1],
    transcript: transcriptTask002,
    chapters: chaptersTask002,
    highlights: highlightsTask002,
    copy: copyTask002,
    checklist: checklistTask002,
  },
};

export const initialTasks = tasks;
export const initialTranscripts: Record<string, TranscriptSegment[]> = {
  'task-002': transcriptTask002,
};
export const initialChapters: Record<string, Chapter[]> = {
  'task-002': chaptersTask002,
};
export const initialHighlights: Record<string, Highlight[]> = {
  'task-002': highlightsTask002,
};
export const initialCopies: Record<string, CopyContent> = {
  'task-002': copyTask002,
};
export const initialChecklists: Record<string, CheckItem[]> = {
  'task-002': checklistTask002,
};
