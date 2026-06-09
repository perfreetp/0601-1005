import { create } from 'zustand';
import type {
  Task,
  TranscriptSegment,
  Chapter,
  Highlight,
  CopyContent,
  CheckItem,
} from '../../shared/types';
import { initialTasks, initialTranscripts, initialChapters, initialHighlights, initialCopies, initialChecklists } from '../../shared/mockData';

interface StoreState {
  tasks: Task[];
  transcripts: Record<string, TranscriptSegment[]>;
  chapters: Record<string, Chapter[]>;
  highlights: Record<string, Highlight[]>;
  copies: Record<string, CopyContent>;
  checklists: Record<string, CheckItem[]>;
  currentTaskId: string | null;
  isLoading: boolean;

  setCurrentTaskId: (id: string | null) => void;
  setLoading: (v: boolean) => void;

  fetchTasks: () => Promise<void>;
  createTask: (file: { fileName: string; fileSize: number; duration: number; title: string }) => Promise<void>;
  retryTask: (taskId: string) => Promise<void>;
  simulateProgress: (taskId: string) => void;

  fetchTranscript: (taskId: string) => Promise<void>;
  updateSegment: (taskId: string, segmentId: string, updates: Partial<TranscriptSegment>) => void;
  toggleMistake: (taskId: string, segmentId: string) => void;

  fetchChapters: (taskId: string) => Promise<void>;
  updateChapter: (taskId: string, chapterId: string, updates: Partial<Chapter>) => void;

  fetchHighlights: (taskId: string) => Promise<void>;
  addHighlight: (taskId: string, highlight: Omit<Highlight, 'id' | 'isFavorite'>) => void;
  toggleFavorite: (taskId: string, highlightId: string) => void;
  removeHighlight: (taskId: string, highlightId: string) => void;

  fetchCopy: (taskId: string) => Promise<void>;
  regenerateCopy: (taskId: string, type: string) => Promise<void>;
  updateCopyField: (taskId: string, field: keyof CopyContent, value: any) => void;

  fetchChecklist: (taskId: string) => Promise<void>;
  runChecklist: (taskId: string) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  tasks: initialTasks,
  transcripts: initialTranscripts,
  chapters: initialChapters,
  highlights: initialHighlights,
  copies: initialCopies,
  checklists: initialChecklists,
  currentTaskId: null,
  isLoading: false,

  setCurrentTaskId: (id) => set({ currentTaskId: id }),
  setLoading: (v) => set({ isLoading: v }),

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/tasks');
      const json = await res.json();
      if (json.success) set({ tasks: json.data });
    } catch {
      set({ tasks: initialTasks });
    }
    set({ isLoading: false });
  },

  createTask: async (file) => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/tasks/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(file),
      });
      const json = await res.json();
      if (json.success) {
        set((s) => ({ tasks: [json.data, ...s.tasks] }));
        get().simulateProgress(json.data.id);
      }
    } catch {
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
      get().simulateProgress(id);
    }
    set({ isLoading: false });
  },

  retryTask: async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/retry`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === taskId ? json.data : t)),
        }));
        get().simulateProgress(taskId);
      }
    } catch {
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId ? { ...t, status: 'processing', progress: 0, retryCount: t.retryCount + 1, error: undefined } : t,
        ),
      }));
      get().simulateProgress(taskId);
    }
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
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, progress: 100, status: 'completed', currentStep: 6 } : t)),
        }));
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
    }, 300);
  },

  fetchTranscript: async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/transcript`);
      const json = await res.json();
      if (json.success) {
        set((s) => ({ transcripts: { ...s.transcripts, [taskId]: json.data } }));
      }
    } catch {
      // 保持 mock 数据
    }
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
  },

  toggleMistake: (taskId, segmentId) => {
    set((s) => ({
      transcripts: {
        ...s.transcripts,
        [taskId]: (s.transcripts[taskId] || []).map((seg) =>
          seg.id === segmentId ? { ...seg, isMistake: !seg.isMistake, mistakeType: seg.isMistake ? undefined : 'filler' } : seg,
        ),
      },
    }));
  },

  fetchChapters: async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/chapters`);
      const json = await res.json();
      if (json.success) {
        set((s) => ({ chapters: { ...s.chapters, [taskId]: json.data } }));
      }
    } catch {
      // 保持 mock
    }
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
  },

  fetchHighlights: async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/highlights`);
      const json = await res.json();
      if (json.success) {
        set((s) => ({ highlights: { ...s.highlights, [taskId]: json.data } }));
      }
    } catch {
      // 保持 mock
    }
  },

  addHighlight: (taskId, highlight) => {
    const newH: Highlight = { ...highlight, id: 'hl-' + Date.now(), isFavorite: false };
    set((s) => ({
      highlights: {
        ...s.highlights,
        [taskId]: [...(s.highlights[taskId] || []), newH],
      },
    }));
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
  },

  removeHighlight: (taskId, highlightId) => {
    set((s) => ({
      highlights: {
        ...s.highlights,
        [taskId]: (s.highlights[taskId] || []).filter((h) => h.id !== highlightId),
      },
    }));
  },

  fetchCopy: async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/copy`);
      const json = await res.json();
      if (json.success) {
        set((s) => ({ copies: { ...s.copies, [taskId]: json.data } }));
      }
    } catch {
      // 保持 mock
    }
  },

  regenerateCopy: async (taskId, type) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/copy/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const json = await res.json();
      if (json.success) {
        set((s) => ({ copies: { ...s.copies, [taskId]: json.data } }));
      }
    } catch {
      const current = get().copies[taskId];
      if (!current) return;
      const variants = [
        ['深度对话：成功创业者的底层思维模型', '从零到一：创始人亲述产品破局之道', '创业者必读：打造爆款产品的六个秘诀'],
        ['AI时代的创业心法', '连续创业者的思考框架', '产品从0到1的实战指南'],
      ];
      const idx = Math.floor(Math.random() * variants.length);
      set((s) => ({
        copies: {
          ...s.copies,
          [taskId]: { ...current, titles: variants[idx] },
        },
      }));
    }
  },

  updateCopyField: (taskId, field, value) => {
    set((s) => {
      const current = s.copies[taskId];
      if (!current) return s;
      return { copies: { ...s.copies, [taskId]: { ...current, [field]: value } } };
    });
  },

  fetchChecklist: async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/checklist`);
      const json = await res.json();
      if (json.success) {
        set((s) => ({ checklists: { ...s.checklists, [taskId]: json.data } }));
      }
    } catch {
      // 保持 mock
    }
  },

  runChecklist: async (taskId) => {
    set((s) => ({
      checklists: {
        ...s.checklists,
        [taskId]: (s.checklists[taskId] || []).map((i) => ({ ...i, status: 'pending' as const })),
      },
    }));
    const items = get().checklists[taskId] || [];
    items.forEach((_, i) => {
      setTimeout(() => {
        set((s) => ({
          checklists: {
            ...s.checklists,
            [taskId]: (s.checklists[taskId] || []).map((it, idx) =>
              idx === i ? { ...it, status: (i === 2 ? 'warning' : 'pass') as CheckItem['status'] } : it,
            ),
          },
        }));
      }, (i + 1) * 400);
    });
  },
}));
