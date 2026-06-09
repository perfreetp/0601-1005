import type {
  Task,
  TranscriptSegment,
  Chapter,
  Highlight,
  CopyContent,
  CheckItem,
} from '../../shared/types';

const SPEAKERS = ['主持人-林子', '嘉宾-陈明', '嘉宾-王芳', '嘉宾-张伟'];

const SAMPLE_TEMPLATES = [
  {
    topic: '创业者访谈',
    intro: '大家好，欢迎收听本期播客节目，我是主持人林子。今天我们非常荣幸邀请到了一位特别的嘉宾，来和我们聊聊他的创业故事和心得体会。',
    themes: ['行业洞察', '方法论分享', '个人经历', '用户思维', '未来展望'],
  },
  {
    topic: 'AI技术前沿',
    intro: '大家好，欢迎来到《AI前沿对话》，我是主持人林子。今天我们将深入探讨人工智能领域的最新进展，以及这些技术如何改变我们的工作和生活。',
    themes: ['技术原理', '应用场景', '行业影响', '伦理思考', '发展趋势'],
  },
  {
    topic: '产品思维',
    intro: '欢迎收听《产品思维》播客，我是林子。今天我们一起来聊聊如何打造一款真正解决用户问题的好产品。',
    themes: ['用户需求', '产品设计', '数据驱动', '迭代优化', '商业化'],
  },
];

export function generateTranscript(task: Task): TranscriptSegment[] {
  const template = SAMPLE_TEMPLATES[Math.floor(Math.random() * SAMPLE_TEMPLATES.length)];
  const duration = task.duration || 3600;
  const segmentCount = Math.max(12, Math.floor(duration / 180));
  const segments: TranscriptSegment[] = [];
  const speaker1 = SPEAKERS[0];
  const speaker2 = SPEAKERS[1 + Math.floor(Math.random() * 3)];
  const avgDuration = duration / segmentCount;

  const sampleSentences = [
    `我觉得这个话题其实非常值得深入讨论，因为它触及了我们工作中最核心的部分。`,
    `从我的经验来看，最重要的是保持对用户的同理心，真正站在他们的角度思考问题。`,
    `我们之前做过一个调研，数据显示超过70%的用户都有类似的困扰。`,
    `这个问题可以从几个维度来分析，首先是技术层面，其次是业务层面，最后是用户体验层面。`,
    `嗯……怎么说呢，其实这个问题没有标准答案，关键在于你如何定义"成功"。`,
    `我非常认同你的观点，补充一点，就是团队协作在这个过程中也起到了至关重要的作用。`,
    `在我们的实践中，有一个方法论框架反复被验证是有效的，那就是"假设-验证"循环。`,
    `当然我们也踩过很多坑，比如早期过于追求功能的完备性，忽略了产品的核心价值。`,
    `用户反馈其实是最好的指路明灯，他们的真实需求往往隐藏在模糊的表达背后。`,
    `展望未来，我认为这个领域还有非常大的发展空间，特别是结合AI技术之后。`,
    `其实我们可以用一个更通俗的比喻来理解这个概念，就像搭积木一样，先打好基础。`,
    `做决策的时候，我通常会问自己三个问题：用户价值是什么？长期影响是什么？最坏的情况能不能接受？`,
  ];

  let currentTime = 0;

  for (let i = 0; i < segmentCount; i++) {
    const isSpeaker1 = i % 2 === 0;
    const speaker = isSpeaker1 ? speaker1 : speaker2;
    const segDuration = Math.floor(avgDuration * (0.7 + Math.random() * 0.6));
    const endTime = Math.min(currentTime + segDuration, duration);
    const sentencesCount = 2 + Math.floor(Math.random() * 2);
    let text = '';

    if (i === 0) {
      text = template.intro + ` 今天的主题是《${task.title}》。我们会从多个角度来展开讨论，希望能给大家带来一些启发。`;
    } else if (i === segmentCount - 1) {
      text = `非常感谢今天的精彩分享，也感谢各位听众的收听。如果你喜欢我们的节目，欢迎订阅和分享。我们下期再见！`;
    } else {
      const chosen: string[] = [];
      for (let j = 0; j < sentencesCount; j++) {
        chosen.push(sampleSentences[Math.floor(Math.random() * sampleSentences.length)]);
      }
      text = chosen.join('');
    }

    const hasMistake = Math.random() < 0.15 && i > 0 && i < segmentCount - 1;

    segments.push({
      id: `seg-${task.id}-${i.toString().padStart(3, '0')}`,
      startTime: currentTime,
      endTime,
      speaker,
      text,
      isMistake: hasMistake,
      mistakeType: hasMistake ? (['filler', 'pronunciation', 'grammar'] as const)[Math.floor(Math.random() * 3)] : undefined,
    });

    currentTime = endTime;
  }

  return segments;
}

export function generateChapters(task: Task, transcript: TranscriptSegment[]): Chapter[] {
  const template = SAMPLE_TEMPLATES[Math.floor(Math.random() * SAMPLE_TEMPLATES.length)];
  const themes = template.themes;
  const duration = task.duration || 3600;
  const chapterCount = Math.min(themes.length, 4 + Math.floor(Math.random() * 3));
  const chapters: Chapter[] = [];
  const segDuration = duration / chapterCount;

  const chapterTitles = [
    `开场：引入主题「${task.title.slice(0, 15)}」`,
    `核心观点：${themes[0] || '深度解析'}`,
    `案例分享：真实实践中的经验`,
    `方法论：可复用的思考框架`,
    `总结与展望：下一步行动建议`,
  ];

  for (let i = 0; i < chapterCount; i++) {
    const startTime = Math.floor(i * segDuration);
    const endTime = Math.floor((i + 1) * segDuration);
    const segsInChapter = transcript.filter(
      (s) => s.startTime >= startTime && s.startTime < endTime,
    );
    const summaryText = segsInChapter.slice(0, 3).map((s) => s.text.slice(0, 40)).join('…');

    chapters.push({
      id: `ch-${task.id}-${i}`,
      title: chapterTitles[i] || `第${i + 1}章节`,
      startTime,
      endTime,
      keywords: [themes[i % themes.length], '播客', '深度对话', '行业洞察'].slice(
        0,
        3 + Math.floor(Math.random() * 2),
      ),
      summary: `本章节${summaryText ? '围绕' + summaryText + '…展开讨论' : '聚焦核心议题'}，嘉宾分享了独到见解。`,
    });
  }

  return chapters;
}

export function generateHighlights(task: Task, transcript: TranscriptSegment[]): Highlight[] {
  const highlights: Highlight[] = [];
  const candidates = transcript.filter((s) => !s.isMistake && s.text.length > 20);
  const sampleCount = Math.min(7, Math.max(4, Math.floor(candidates.length / 4)));
  const usedIndices = new Set<number>();

  while (highlights.length < sampleCount && usedIndices.size < candidates.length) {
    const idx = Math.floor(Math.random() * candidates.length);
    if (usedIndices.has(idx)) continue;
    usedIndices.add(idx);
    const seg = candidates[idx];
    const text = seg.text.length > 80 ? seg.text.slice(0, 80) + '…' : seg.text;

    highlights.push({
      id: `hl-${task.id}-${highlights.length}`,
      text,
      startTime: seg.startTime,
      speaker: seg.speaker,
      isFavorite: highlights.length < 3,
    });
  }

  return highlights.sort((a, b) => a.startTime - b.startTime);
}

export function generateCopy(task: Task): CopyContent {
  return {
    titles: [
      `深度对话：${task.title}`,
      `${task.title}｜${task.title.length > 10 ? '嘉宾亲述' : '完整实录'}`,
      `独家｜关于${task.title.slice(0, 12)}，你必须知道的几件事`,
    ],
    summary: `本期节目聚焦《${task.title}》这一核心话题。主持人与特邀嘉宾展开深度对谈，从行业背景切入，结合真实案例与一线经验，拆解关键概念的底层逻辑。嘉宾分享了个人实践中总结的方法论框架，讨论了常见误区与踩坑经历，并对未来发展趋势给出了独到预判。无论你是从业者还是关注该领域的爱好者，都能从中获得启发与思考。全程约${Math.floor((task.duration || 3600) / 60)}分钟，建议收藏反复收听。`,
    shownotes: `## 本期要点

📌 **主题**：${task.title}

🎙️ **嘉宾介绍**
本期邀请行业资深从业者，拥有多年一线经验，曾主导多个标杆项目。

⏱️ **时间线**
- 00:00 开场与话题引入
- 05:30 行业背景与现状分析
- 15:00 核心方法论拆解
- 30:00 真实案例分享
- 45:00 常见误区与避坑指南
- 55:00 总结与未来展望

💡 **核心观点**
1. 真正的竞争力来源于对底层逻辑的深刻理解
2. 用户价值是所有决策的唯一准绳
3. 快速试错比完美规划更重要
4. 长期主义是穿越周期的唯一路径

📚 **延伸阅读**
- 推荐相关书籍与文章
- 嘉宾推荐的学习资源

📱 **互动方式**
欢迎在评论区分享你的观点和问题，我们下期节目可能会回复！`,
    socialPosts: {
      xiaohongshu: `✨新一期播客上线啦！\n\n今天聊的是「${task.title.slice(0, 15)}」\n\n嘉宾真的太敢说了！\n把多年经验总结成了一套可复用的方法论🔥\n\n🎧 全程高能，建议收藏慢慢看\n\n#播客推荐 #${task.title.slice(0, 6)} #干货分享 #创业心得 #深度思考 #个人成长`,
      weibo: `【新播客上线】本期对话围绕「${task.title}」展开，嘉宾从一线视角拆解了行业底层逻辑，分享了独家方法论和避坑指南。干货满满，值得一听！👉收听链接 #播客# #深度对话#`,
      official: `各位听众朋友大家好：\n\n本期节目，我们邀请到了资深行业从业者，一同探讨「${task.title}」这一重要话题。\n\n在本次对话中，嘉宾结合自身多年实践经验，为我们系统梳理了行业发展脉络，分享了可落地的方法论框架，并针对从业者普遍关心的问题给出了独到解答。\n\n我们相信，无论你是身处该领域的专业人士，还是对这一话题感兴趣的朋友，都能从这期节目中获益。\n\n欢迎大家收听并分享你的感受，也可以在评论区留下你的问题，我们会在后续节目中回应。\n\n——《播客工作室》编辑部`,
    },
    coverPrompt: `播客封面设计，现代风格。画面主体为深色渐变背景（从深蓝到紫色），中央醒目的白色标题文字"${task.title.slice(0, 20)}"，字体简洁有力。左下角有主持人和嘉宾的剪影轮廓，点缀一些抽象的音频波形和几何装饰元素。整体感觉专业、有品质、有科技感。文字层次分明，突出主题。尺寸3000x3000像素。`,
  };
}

export function generateChecklist(task: Task): CheckItem[] {
  return [
    {
      id: `ci-${task.id}-001`,
      name: '转写准确率检查',
      status: 'pending',
      message: '等待执行检查',
      details: [],
    },
    {
      id: `ci-${task.id}-002`,
      name: '章节划分合理性',
      status: 'pending',
      message: '等待执行检查',
      details: [],
    },
    {
      id: `ci-${task.id}-003`,
      name: '金句提取质量',
      status: 'pending',
      message: '等待执行检查',
      details: [],
    },
    {
      id: `ci-${task.id}-004`,
      name: '文案生成质量',
      status: 'pending',
      message: '等待执行检查',
      details: [],
    },
    {
      id: `ci-${task.id}-005`,
      name: '敏感内容检测',
      status: 'pending',
      message: '等待执行检查',
      details: [],
    },
    {
      id: `ci-${task.id}-006`,
      name: '时间戳一致性',
      status: 'pending',
      message: '等待执行检查',
      details: [],
    },
    {
      id: `ci-${task.id}-007`,
      name: '封面提示词完整性',
      status: 'pending',
      message: '等待执行检查',
      details: [],
    },
  ];
}

export function generateAllTaskContent(task: Task): {
  transcript: TranscriptSegment[];
  chapters: Chapter[];
  highlights: Highlight[];
  copy: CopyContent;
  checklist: CheckItem[];
} {
  const transcript = generateTranscript(task);
  const chapters = generateChapters(task, transcript);
  const highlights = generateHighlights(task, transcript);
  const copy = generateCopy(task);
  const checklist = generateChecklist(task);
  return { transcript, chapters, highlights, copy, checklist };
}
