import { create } from 'zustand';
import JSZip from 'jszip';
import type {
  Task,
  TranscriptSegment,
  Chapter,
  Highlight,
  CopyContent,
  CheckItem,
  CheckStatus,
} from '../../shared/types';
import {
  initialTasks,
  initialTranscripts,
  initialChapters,
  initialHighlights,
  initialCopies,
  initialChecklists,
} from '../../shared/mockData';
import { generateAllTaskContent } from '../utils/contentGenerator';
import { scanAllContent, type SensitiveHit } from '../utils/sensitiveWords';

const STORAGE_KEY = 'podforge-store-v1';

export interface ExportRecord {
  id: string;
  taskId: string;
  taskTitle: string;
  platforms: string[];
  exportedAt: string;
  passRate: number;
  totalChecks: number;
  passedChecks: number;
}

type PersistedState = {
  tasks: Task[];
  transcripts: Record<string, TranscriptSegment[]>;
  chapters: Record<string, Chapter[]>;
  highlights: Record<string, Highlight[]>;
  copies: Record<string, CopyContent>;
  checklists: Record<string, CheckItem[]>;
  exports: ExportRecord[];
};

function loadFromStorage(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed as PersistedState;
  } catch {
    return null;
  }
}

function saveToStorage(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

const persisted = loadFromStorage();

export interface PlatformValidation {
  key: string;
  label: string;
  fields: {
    name: string;
    label: string;
    value: string;
    length: number;
    min: number;
    max: number;
    status: 'pass' | 'warning' | 'fail';
    message: string;
  }[];
}

interface StoreState extends PersistedState {
  currentTaskId: string | null;
  isLoading: boolean;

  setCurrentTaskId: (id: string | null) => void;
  setLoading: (v: boolean) => void;

  persist: () => void;

  createTask: (file: { fileName: string; fileSize: number; duration: number; title: string }) => Promise<void>;
  retryTask: (taskId: string) => Promise<void>;
  simulateProgress: (taskId: string) => void;

  updateSegment: (taskId: string, segmentId: string, updates: Partial<TranscriptSegment>) => void;
  toggleMistake: (taskId: string, segmentId: string) => void;

  updateChapter: (taskId: string, chapterId: string, updates: Partial<Chapter>) => void;
  updateChapters: (taskId: string, chapters: Chapter[]) => void;
  addChapter: (taskId: string, chapter: Chapter) => void;
  deleteChapter: (taskId: string, chapterId: string) => void;

  addHighlight: (taskId: string, highlight: Omit<Highlight, 'id' | 'isFavorite'>) => void;
  toggleFavorite: (taskId: string, highlightId: string) => void;
  removeHighlight: (taskId: string, highlightId: string) => void;

  regenerateCopy: (taskId: string, type: string) => Promise<void>;
  updateCopyField: (taskId: string, field: keyof CopyContent, value: any) => void;

  validatePlatform: (taskId: string, platformKey: string) => PlatformValidation;
  validateAllPlatforms: (taskId: string) => PlatformValidation[];

  runChecklist: (taskId: string) => Promise<void>;

  exportZip: (taskId: string, platforms: string[]) => Promise<void>;
  addExportRecord: (record: ExportRecord) => void;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function validateField(value: string, label: string, min: number, max: number, note = '') {
  const length = value.length;
  let status: 'pass' | 'warning' | 'fail' = 'pass';
  let message = `字数 ${length}，符合要求`;
  if (length < min) {
    status = length === 0 ? 'fail' : 'warning';
    message = `字数不足（${length}/${min}）${note ? '，' + note : ''}`;
  } else if (length > max) {
    status = 'fail';
    message = `超出字数限制（${length}/${max}），请精简`;
  }
  return { length, min, max, status, message, value, name: label.toLowerCase(), label };
}

function checkShownotesTimeline(shownotes: string): { hasTimeline: boolean; message: string } {
  const timelineRegex = /\d{1,2}:\d{2}/;
  const hasTimeline = timelineRegex.test(shownotes);
  return {
    hasTimeline,
    message: hasTimeline ? '已包含时间线标注' : '未检测到时间线（如 05:30），建议补充',
  };
}

export const useStore = create<StoreState>((set, get) => ({
  tasks: persisted?.tasks || initialTasks,
  transcripts: persisted?.transcripts || initialTranscripts,
  chapters: persisted?.chapters || initialChapters,
  highlights: persisted?.highlights || initialHighlights,
  copies: persisted?.copies || initialCopies,
  checklists: persisted?.checklists || initialChecklists,
  exports: persisted?.exports || [],
  currentTaskId: null,
  isLoading: false,

  setCurrentTaskId: (id) => set({ currentTaskId: id }),
  setLoading: (v) => set({ isLoading: v }),

  persist: () => {
    const s = get();
    saveToStorage({
      tasks: s.tasks,
      transcripts: s.transcripts,
      chapters: s.chapters,
      highlights: s.highlights,
      copies: s.copies,
      checklists: s.checklists,
      exports: s.exports,
    });
  },

  createTask: async (file) => {
    set({ isLoading: true });
    const id = 'task-' + Date.now();
    const newTask: Task = {
      id,
      title: file.title,
      fileName: file.fileName,
      fileSize: file.fileSize,
      duration: file.duration,
      status: 'processing',
      progress: 0,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      currentStep: 1,
    };
    set((s) => ({ tasks: [newTask, ...s.tasks] }));
    get().persist();
    get().simulateProgress(id);
    set({ isLoading: false });
  },

  retryTask: async (taskId) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: 'processing' as const, progress: 0, retryCount: t.retryCount + 1, error: undefined, currentStep: 1 }
          : t,
      ),
    }));
    get().persist();
    get().simulateProgress(taskId);
  },

  simulateProgress: (taskId) => {
    const interval = setInterval(() => {
      const state = get();
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) {
        clearInterval(interval);
        return;
      }
      if (task.progress >= 100) {
        if (!state.transcripts[taskId] || state.transcripts[taskId].length === 0) {
          const { transcript, chapters, highlights, copy, checklist } = generateAllTaskContent(task);
          set((s) => ({
            tasks: s.tasks.map((t) =>
              t.id === taskId ? { ...t, progress: 100, status: 'completed', currentStep: 6 } : t,
            ),
            transcripts: { ...s.transcripts, [taskId]: transcript },
            chapters: { ...s.chapters, [taskId]: chapters },
            highlights: { ...s.highlights, [taskId]: highlights },
            copies: { ...s.copies, [taskId]: copy },
            checklists: { ...s.checklists, [taskId]: checklist },
          }));
          get().persist();
        } else {
          set((s) => ({
            tasks: s.tasks.map((t) =>
              t.id === taskId ? { ...t, progress: 100, status: 'completed', currentStep: 6 } : t,
            ),
          }));
          get().persist();
        }
        clearInterval(interval);
        return;
      }
      const nextProgress = Math.min(task.progress + 5, 100);
      const nextStep = Math.min(Math.floor(nextProgress / 20) + 1, 6);
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId ? { ...t, progress: nextProgress, currentStep: nextStep } : t,
        ),
      }));
      if (nextProgress % 25 === 0) {
        get().persist();
      }
    }, 300);
  },

  updateSegment: (taskId, segmentId, updates) => {
    set((s) => ({
      transcripts: {
        ...s.transcripts,
        [taskId]: (s.transcripts[taskId] || []).map((seg) =>
          seg.id === segmentId ? { ...seg, ...updates } : seg,
        ),
      },
    }));
    get().persist();
  },

  toggleMistake: (taskId, segmentId) => {
    set((s) => ({
      transcripts: {
        ...s.transcripts,
        [taskId]: (s.transcripts[taskId] || []).map((seg) =>
          seg.id === segmentId
            ? { ...seg, isMistake: !seg.isMistake, mistakeType: seg.isMistake ? undefined : 'filler' }
            : seg,
        ),
      },
    }));
    get().persist();
  },

  updateChapter: (taskId, chapterId, updates) => {
    set((s) => ({
      chapters: {
        ...s.chapters,
        [taskId]: (s.chapters[taskId] || []).map((c) =>
          c.id === chapterId ? { ...c, ...updates } : c,
        ),
      },
    }));
    get().persist();
  },

  updateChapters: (taskId, chapters) => {
    set((s) => ({
      chapters: { ...s.chapters, [taskId]: chapters },
    }));
    get().persist();
  },

  addChapter: (taskId, chapter) => {
    set((s) => ({
      chapters: {
        ...s.chapters,
        [taskId]: [...(s.chapters[taskId] || []), chapter].sort((a, b) => a.startTime - b.startTime),
      },
    }));
    get().persist();
  },

  deleteChapter: (taskId, chapterId) => {
    set((s) => {
      const list = [...(s.chapters[taskId] || [])];
      if (list.length <= 1) return s;
      const idx = list.findIndex((c) => c.id === chapterId);
      if (idx === -1) return s;
      const removed = list[idx];
      const updated = list.filter((c) => c.id !== chapterId);
      if (idx > 0) {
        updated[idx - 1] = { ...updated[idx - 1], endTime: removed.endTime };
      } else if (updated.length > 0) {
        updated[0] = { ...updated[0], startTime: removed.startTime };
      }
      return { chapters: { ...s.chapters, [taskId]: updated } };
    });
    get().persist();
  },

  addHighlight: (taskId, highlight) => {
    const newH: Highlight = { ...highlight, id: 'hl-' + Date.now(), isFavorite: false };
    set((s) => ({
      highlights: {
        ...s.highlights,
        [taskId]: [...(s.highlights[taskId] || []), newH],
      },
    }));
    get().persist();
  },

  toggleFavorite: (taskId, highlightId) => {
    set((s) => ({
      highlights: {
        ...s.highlights,
        [taskId]: (s.highlights[taskId] || []).map((h) =>
          h.id === highlightId ? { ...h, isFavorite: !h.isFavorite } : h,
        ),
      },
    }));
    get().persist();
  },

  removeHighlight: (taskId, highlightId) => {
    set((s) => ({
      highlights: {
        ...s.highlights,
        [taskId]: (s.highlights[taskId] || []).filter((h) => h.id !== highlightId),
      },
    }));
    get().persist();
  },

  regenerateCopy: async (taskId, type) => {
    const current = get().copies[taskId];
    if (!current) return;
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const generated = generateAllTaskContent(task);
    let newCopy = { ...current };
    if (type === 'all') {
      newCopy = generated.copy;
    } else if (type === 'titles') {
      newCopy.titles = generated.copy.titles;
    } else if (type === 'summary') {
      newCopy.summary = generated.copy.summary;
    } else if (type === 'shownotes') {
      newCopy.shownotes = generated.copy.shownotes;
    } else if (type === 'socialPosts') {
      newCopy.socialPosts = generated.copy.socialPosts;
    } else if (type === 'coverPrompt') {
      newCopy.coverPrompt = generated.copy.coverPrompt;
    }
    set((s) => ({ copies: { ...s.copies, [taskId]: newCopy } }));
    get().persist();
  },

  updateCopyField: (taskId, field, value) => {
    set((s) => {
      const current = s.copies[taskId];
      if (!current) return s;
      return { copies: { ...s.copies, [taskId]: { ...current, [field]: value } } };
    });
    get().persist();
  },

  validatePlatform: (taskId, platformKey) => {
    const copy = get().copies[taskId];
    const chapters = get().chapters[taskId] || [];
    const sensitive = scanAllContent(copy);
    const labelMap: Record<string, string> = {
      xiaoyuzhou: '小宇宙',
      ximalaya: '喜马拉雅',
      official: '公众号',
      xiaohongshu: '小红书',
      weibo: '微博',
    };
    const label = labelMap[platformKey] || platformKey;
    const fields: PlatformValidation['fields'] = [];

    if (!copy) {
      return {
        key: platformKey,
        label,
        fields: [{ name: 'copy', label: '文案', value: '', length: 0, min: 1, max: 1, status: 'fail', message: '文案尚未生成' }],
      };
    }

    if (platformKey === 'xiaohongshu') {
      fields.push(validateField(copy.titles[0] || '', '标题', 5, 20, '小红书标题建议 5-20 字'));
      fields.push(validateField(copy.socialPosts.xiaohongshu, '正文', 50, 1000, '建议图文结合 200-800 字'));
      if (!copy.socialPosts.xiaohongshu.includes('#')) {
        fields.push({ name: '话题', label: '话题标签', value: copy.socialPosts.xiaohongshu, length: 0, min: 1, max: 10, status: 'warning', message: '建议添加 3-5 个话题标签（#xxx）' });
      } else {
        const tags = copy.socialPosts.xiaohongshu.match(/#\S+/g) || [];
        fields.push({ name: '话题', label: '话题标签', value: copy.socialPosts.xiaohongshu, length: tags.length, min: 2, max: 8, status: tags.length >= 2 ? 'pass' : 'warning', message: tags.length >= 2 ? `已添加 ${tags.length} 个话题` : `仅 ${tags.length} 个话题，建议增加到 2-8 个` });
      }
      if (sensitive.totalHits > 0) {
        fields.push({ name: '敏感词', label: '敏感词检测', value: '', length: sensitive.totalHits, min: 0, max: 0, status: 'fail', message: `检测到 ${sensitive.totalHits} 处敏感/极限词` });
      }
    } else if (platformKey === 'weibo') {
      fields.push(validateField(copy.titles[0] || '', '标题', 5, 30));
      fields.push(validateField(copy.socialPosts.weibo, '正文', 20, 140, '微博正文不超过 140 字（长微博除外）'));
      if (!copy.socialPosts.weibo.includes('#')) {
        fields.push({ name: '话题', label: '话题标签', value: copy.socialPosts.weibo, length: 0, min: 1, max: 3, status: 'warning', message: '建议添加 1-3 个话题标签' });
      }
      if (sensitive.totalHits > 0) {
        fields.push({ name: '敏感词', label: '敏感词检测', value: '', length: sensitive.totalHits, min: 0, max: 0, status: 'fail', message: `检测到 ${sensitive.totalHits} 处敏感/极限词` });
      }
    } else if (platformKey === 'official') {
      fields.push(validateField(copy.titles[0] || '', '标题', 10, 32, '公众号标题建议 15-25 字'));
      fields.push(validateField(copy.summary, '摘要', 50, 120, '摘要会在分享卡片中显示'));
      fields.push(validateField(copy.socialPosts.official, '正文', 500, 10000, '公众号长文建议 800-3000 字'));
      fields.push({ name: '封面词', label: '封面提示词', value: copy.coverPrompt, length: copy.coverPrompt.length, min: 30, max: 500, status: copy.coverPrompt.length >= 30 ? 'pass' : 'warning', message: copy.coverPrompt.length >= 30 ? `封面提示词 ${copy.coverPrompt.length} 字` : '封面提示词描述不够详细，建议补充' });
      if (sensitive.totalHits > 0) {
        fields.push({ name: '敏感词', label: '敏感词检测', value: '', length: sensitive.totalHits, min: 0, max: 0, status: 'fail', message: `检测到 ${sensitive.totalHits} 处敏感/极限词` });
      }
    } else if (platformKey === 'xiaoyuzhou' || platformKey === 'ximalaya') {
      fields.push(validateField(copy.titles[0] || '', '节目标题', 6, 30));
      fields.push(validateField(copy.summary, '简介', 40, 500, '简介会在列表页显示'));
      const tl = checkShownotesTimeline(copy.shownotes);
      fields.push({ name: '时间线', label: 'Shownotes 时间线', value: copy.shownotes, length: chapters.length, min: 1, max: 999, status: tl.hasTimeline ? 'pass' : 'warning', message: tl.message });
      fields.push(validateField(copy.shownotes, 'Shownotes', 200, 5000, 'Shownotes 建议包含嘉宾介绍、时间线、核心观点等'));
      if (sensitive.totalHits > 0) {
        fields.push({ name: '敏感词', label: '敏感词检测', value: '', length: sensitive.totalHits, min: 0, max: 0, status: 'fail', message: `检测到 ${sensitive.totalHits} 处敏感/极限词` });
      }
    }

    return { key: platformKey, label, fields };
  },

  validateAllPlatforms: (taskId) => {
    return ['xiaoyuzhou', 'ximalaya', 'official', 'xiaohongshu'].map((k) =>
      get().validatePlatform(taskId, k),
    );
  },

  runChecklist: async (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    const copy = get().copies[taskId];
    const transcript = get().transcripts[taskId] || [];
    const chapters = get().chapters[taskId] || [];
    const highlights = get().highlights[taskId] || [];

    const baseItems = get().checklists[taskId] || [];
    set((s) => ({
      checklists: {
        ...s.checklists,
        [taskId]: baseItems.map((i) => ({ ...i, status: 'pending' as CheckStatus, details: [], message: '检查中...' })),
      },
    }));

    const sensitiveResult = scanAllContent(copy);

    const itemConfigs: Array<() => { status: CheckStatus; message: string; details: string[] }> = [
      () => {
        const mistakes = transcript.filter((s) => s.isMistake).length;
        const total = transcript.length;
        const accuracy = total > 0 ? Math.round(((total - mistakes) / total) * 100) : 100;
        return {
          status: accuracy >= 90 ? 'pass' : 'warning',
          message: accuracy >= 90 ? '转写准确率良好' : `转写准确率约${accuracy}%，建议人工复核`,
          details: [
            `共检测 ${total} 个转写段落`,
            `标记口误 ${mistakes} 处`,
            `估算准确率约 ${accuracy}%`,
            mistakes > 0 ? `建议：在转写校对页逐一审核${mistakes}处标记` : '口误标记数量在合理范围内',
          ],
        };
      },
      () => {
        const count = chapters.length;
        const avgDuration = count > 0 ? Math.round(chapters.reduce((a, c) => a + (c.endTime - c.startTime), 0) / count / 60) : 0;
        return {
          status: count >= 3 ? 'pass' : 'warning',
          message: count >= 3 ? `章节划分合理（${count}章）` : `章节数量偏少（${count}章），建议补充`,
          details: [
            `共划分 ${count} 个章节`,
            `平均时长约 ${avgDuration} 分钟`,
            chapters.map((c) => `「${c.title}」${formatTime(c.startTime)}-${formatTime(c.endTime)}`).join('；'),
            count >= 3 ? '章节结构清晰完整' : '建议至少划分3个章节',
          ],
        };
      },
      () => {
        const count = highlights.length;
        const favorites = highlights.filter((h) => h.isFavorite).length;
        return {
          status: count >= 4 ? 'pass' : 'warning',
          message: count >= 4 ? `金句提取充足（${count}条）` : `金句数量偏少（${count}条），建议补充`,
          details: [
            `共提取 ${count} 条金句`,
            `其中精选 ${favorites} 条`,
            count > 0 ? `涉及说话人：${[...new Set(highlights.map((h) => h.speaker))].join('、')}` : '尚无金句',
            count >= 4 ? '金句覆盖核心观点' : '建议再补充3-5条有传播价值的金句',
          ],
        };
      },
      () => {
        if (!copy) return { status: 'fail' as CheckStatus, message: '文案尚未生成', details: ['请先进入文案生成页面'] };
        const issues: string[] = [];
        if (copy.titles.length < 3) issues.push('标题变体不足3个');
        if (copy.summary.length < 100) issues.push('摘要字数偏少（建议150-500字）');
        if (copy.shownotes.length < 200) issues.push('Shownotes内容不够丰富');
        if (!copy.coverPrompt || copy.coverPrompt.length < 30) issues.push('封面提示词描述不够详细');
        return {
          status: issues.length === 0 ? 'pass' : 'warning',
          message: issues.length === 0 ? '文案整体质量良好' : `文案有${issues.length}项可优化`,
          details: [
            `标题：${copy.titles.length} 个变体`,
            `摘要：约 ${copy.summary.length} 字`,
            `Shownotes：约 ${copy.shownotes.length} 字`,
            `社媒文案：小红书${copy.socialPosts.xiaohongshu.length}字 / 微博${copy.socialPosts.weibo.length}字 / 公众号${copy.socialPosts.official.length}字`,
            ...issues,
          ],
        };
      },
      () => {
        if (sensitiveResult.totalHits === 0) {
          return {
            status: 'pass',
            message: '未检测到敏感或违规词汇',
            details: ['已扫描标题、摘要、Shownotes、社媒文案、封面提示词', '未命中敏感词库'],
          };
        }
        const grouped = sensitiveResult.groupedHits;
        const details: string[] = [];
        details.push(`⚠️ 共检测到 ${sensitiveResult.totalHits} 处敏感/极限词命中`);
        for (const [fieldName, hits] of Object.entries(grouped)) {
          const words = [...new Set(hits.map((h) => h.word))].join('、');
          details.push(`【${fieldName}】命中词：${words}`);
          hits.slice(0, 2).forEach((h) => {
            details.push(`   → 上下文：${h.context}`);
          });
        }
        details.push('建议：在文案生成页人工替换上述词汇，避免广告法风险');
        return {
          status: 'fail',
          message: `检测到 ${sensitiveResult.totalHits} 处敏感/极限词，需人工处理`,
          details,
        };
      },
      () => {
        if (transcript.length === 0) {
          return { status: 'warning' as CheckStatus, message: '转写数据缺失，无法校验', details: ['请先生成转写内容'] };
        }
        const totalDuration = task?.duration || 0;
        const lastSeg = transcript[transcript.length - 1];
        const transcriptEnd = lastSeg?.endTime || 0;
        const diff = Math.abs(totalDuration - transcriptEnd);
        const issues: string[] = [];
        if (diff > 60) issues.push(`转写末尾与总时长相差${Math.round(diff)}秒，可能有遗漏`);
        let overlap = 0;
        for (let i = 1; i < transcript.length; i++) {
          if (transcript[i].startTime < transcript[i - 1].endTime) overlap++;
        }
        if (overlap > 0) issues.push(`发现${overlap}处时间重叠`);
        return {
          status: issues.length === 0 ? 'pass' : 'warning',
          message: issues.length === 0 ? '时间戳数据一致' : `时间戳有${issues.length}项异常`,
          details: [
            `任务总时长：${formatTime(totalDuration)}`,
            `转写末尾：${formatTime(transcriptEnd)}`,
            `段落数量：${transcript.length}`,
            issues.length === 0 ? '所有时间戳连续无重叠' : issues.join('；'),
          ],
        };
      },
      () => {
        if (!copy || !copy.coverPrompt) {
          return { status: 'fail' as CheckStatus, message: '封面提示词缺失', details: ['请先在文案生成页填写封面提示词'] };
        }
        const prompt = copy.coverPrompt;
        const checks = [
          { key: '设计风格', has: /风格|简约|复古|现代|科技|商务/.test(prompt) },
          { key: '色彩方案', has: /颜色|配色|渐变|蓝|紫|橙|红|黑|白/.test(prompt) },
          { key: '画面元素', has: /人物|剪影|插画|图标|波形|几何|文字|标题/.test(prompt) },
          { key: '尺寸规格', has: /尺寸|像素|px|3000|1400|1080/.test(prompt) },
        ];
        const missing = checks.filter((c) => !c.has).map((c) => c.key);
        return {
          status: missing.length === 0 ? 'pass' : 'warning',
          message: missing.length === 0 ? '封面提示词描述完整' : `封面提示词建议补充：${missing.join('、')}`,
          details: [
            `当前长度：约 ${prompt.length} 字`,
            ...checks.map((c) => `${c.key}：${c.has ? '✅ 已描述' : '⚠️ 建议补充'}`),
            missing.length > 0 ? `建议：在文案生成页完善「${missing.join('」「')}」相关描述` : '提示词可直接用于AI绘图生成',
          ],
        };
      },
    ];

    itemConfigs.forEach((build, i) => {
      setTimeout(() => {
        const result = build();
        set((s) => {
          const current = s.checklists[taskId] || [];
          const updated = current.map((it, idx) => (idx === i ? { ...it, ...result } : it));
          return { checklists: { ...s.checklists, [taskId]: updated } };
        });
        if (i === itemConfigs.length - 1) {
          get().persist();
        }
      }, (i + 1) * 500);
    });
  },

  addExportRecord: (record) => {
    set((s) => ({
      exports: [record, ...s.exports].slice(0, 50),
    }));
    get().persist();
  },

  exportZip: async (taskId, platforms) => {
    if (platforms.length === 0) return;
    const task = get().tasks.find((t) => t.id === taskId);
    const copy = get().copies[taskId];
    const transcript = get().transcripts[taskId] || [];
    const chapters = get().chapters[taskId] || [];
    const highlights = get().highlights[taskId] || [];
    const checklist = get().checklists[taskId] || [];
    if (!task || !copy) return;

    const validations = get().validateAllPlatforms(taskId);

    const zip = new JSZip();
    const safeTitle = task.title.replace(/[\\/:*?"<>|]/g, '_');

    const platformNameMap: Record<string, string> = {
      xiaoyuzhou: '小宇宙',
      ximalaya: '喜马拉雅',
      official: '公众号',
      xiaohongshu: '小红书',
    };

    const chapterTimeline = chapters
      .map((c, i) => `${i + 1}. ${formatTime(c.startTime)} - ${c.title}（${c.keywords.join('、')}）\n   ${c.summary}`)
      .join('\n\n');

    const transcriptText = transcript
      .map((s) => `[${formatTime(s.startTime)} - ${formatTime(s.endTime)}] ${s.speaker}${s.isMistake ? ' ⚠️' : ''}\n${s.text}`)
      .join('\n\n');

    const highlightsText = highlights
      .map((h, i) => `${i + 1}. ${h.isFavorite ? '⭐ ' : ''}"${h.text}"\n   —— ${h.speaker} @ ${formatTime(h.startTime)}`)
      .join('\n\n');

    const checkReport = checklist
      .map((c) => {
        const icon = c.status === 'pass' ? '✅' : c.status === 'warning' ? '⚠️' : c.status === 'fail' ? '❌' : '⚪';
        return `${icon} ${c.name}：${c.message}\n${c.details.map((d) => `   · ${d}`).join('\n')}`;
      })
      .join('\n\n');

    function generatePlatformReport(pKey: string): string {
      const v = validations.find((x) => x.key === pKey) || get().validatePlatform(taskId, pKey);
      const passCount = v.fields.filter((f) => f.status === 'pass').length;
      const warnCount = v.fields.filter((f) => f.status === 'warning').length;
      const failCount = v.fields.filter((f) => f.status === 'fail').length;
      let report = `【${v.label}】发布校验报告\n`;
      report += `生成时间：${new Date().toLocaleString()}\n`;
      report += `任务标题：${task.title}\n`;
      report += `校验结果：${passCount} 通过 / ${warnCount} 警告 / ${failCount} 未通过\n\n`;
      report += `==== 各字段校验 ====\n`;
      for (const f of v.fields) {
        const icon = f.status === 'pass' ? '✅' : f.status === 'warning' ? '⚠️' : '❌';
        report += `${icon} ${f.label}：${f.message}\n`;
        if (f.status !== 'pass' && f.value) {
          const preview = f.value.length > 80 ? f.value.slice(0, 80) + '…' : f.value;
          report += `   内容预览：${preview}\n`;
        }
      }
      report += `\n==== 当前内容 ====\n`;
      report += `标题：${copy.titles[0]}\n\n`;
      report += `摘要：\n${copy.summary}\n\n`;
      report += `Shownotes：\n${copy.shownotes}\n\n`;
      if (pKey === 'xiaohongshu') {
        report += `小红书文案：\n${copy.socialPosts.xiaohongshu}\n\n`;
      } else if (pKey === 'weibo') {
        report += `微博文案：\n${copy.socialPosts.weibo}\n\n`;
      } else if (pKey === 'official') {
        report += `公众号文案：\n${copy.socialPosts.official}\n\n`;
      }
      report += `封面提示词：\n${copy.coverPrompt}\n\n`;
      report += `章节时间线：\n${chapterTimeline}\n\n`;
      report += `金句集锦：\n${highlightsText}\n`;
      return report;
    }

    for (const platform of platforms) {
      const folder = zip.folder(`${safeTitle}-${platformNameMap[platform] || platform}`);
      if (!folder) continue;

      let titlesContent = copy.titles.join('\n\n');
      if (platform === 'xiaohongshu') {
        titlesContent += '\n\n（小红书建议标题不超过20字，带emoji增强吸引力）';
      } else if (platform === 'weibo') {
        titlesContent += '\n\n（微博建议标题不超过30字，带话题标签）';
      }
      folder.file('01-标题.txt', titlesContent);
      folder.file('02-摘要.txt', copy.summary);
      folder.file('03-Shownotes.md', copy.shownotes);

      if (platform === 'xiaohongshu') {
        folder.file('04-小红书文案.txt', copy.socialPosts.xiaohongshu);
      } else if (platform === 'weibo') {
        folder.file('04-微博文案.txt', copy.socialPosts.weibo);
      } else if (platform === 'official') {
        folder.file('04-公众号文案.txt', copy.socialPosts.official);
      } else if (platform === 'ximalaya' || platform === 'xiaoyuzhou') {
        folder.file('04-平台简介.txt', copy.summary + '\n\n' + copy.shownotes);
      }

      folder.file('05-封面提示词.txt', copy.coverPrompt);
      folder.file('06-章节时间线.txt', chapterTimeline);
      folder.file('07-金句集锦.txt', highlightsText);
      folder.file('08-检查报告.txt', generatePlatformReport(platform));
    }

    const common = zip.folder(`${safeTitle}-通用素材`);
    if (common) {
      common.file('完整逐字稿.txt', transcriptText);
      common.file('章节时间线.txt', chapterTimeline);
      common.file('金句集锦.txt', highlightsText);
      common.file(
        '总检查报告.txt',
        `任务：${task.title}\n导出时间：${new Date().toLocaleString()}\n\n` + checkReport,
      );
    }

    const passed = checklist.filter((c) => c.status === 'pass').length;
    const exportRecord: ExportRecord = {
      id: 'exp-' + Date.now(),
      taskId,
      taskTitle: task.title,
      platforms,
      exportedAt: new Date().toISOString(),
      passRate: checklist.length > 0 ? Math.round((passed / checklist.length) * 100) : 0,
      totalChecks: checklist.length,
      passedChecks: passed,
    };
    get().addExportRecord(exportRecord);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PodForge-${safeTitle}-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
}));
