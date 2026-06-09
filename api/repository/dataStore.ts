import type {
  Task,
  TranscriptSegment,
  Chapter,
  Highlight,
  CopyContent,
  CheckItem,
} from '../../shared/types';
import { tasks as mockTasks, taskFullDataMap } from '../../shared/mockData';

function delay<T>(data: T, ms = 100): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

class DataStore {
  private tasks: Task[];
  private transcripts: Map<string, TranscriptSegment[]>;
  private chapters: Map<string, Chapter[]>;
  private highlights: Map<string, Highlight[]>;
  private copies: Map<string, CopyContent>;
  private checklists: Map<string, CheckItem[]>;

  constructor() {
    this.tasks = [...mockTasks];
    this.transcripts = new Map();
    this.chapters = new Map();
    this.highlights = new Map();
    this.copies = new Map();
    this.checklists = new Map();

    for (const [taskId, data] of Object.entries(taskFullDataMap)) {
      this.transcripts.set(taskId, [...data.transcript]);
      this.chapters.set(taskId, [...data.chapters]);
      this.highlights.set(taskId, [...data.highlights]);
      this.copies.set(taskId, { ...data.copy });
      this.checklists.set(taskId, [...data.checklist]);
    }
  }

  async getTasks(): Promise<Task[]> {
    return delay([...this.tasks]);
  }

  async getTaskById(taskId: string): Promise<Task | null> {
    const task = this.tasks.find((t) => t.id === taskId);
    return delay(task ? { ...task } : null);
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'retryCount' | 'currentStep'>): Promise<Task> {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      currentStep: 0,
    };
    this.tasks.unshift(newTask);
    return delay({ ...newTask });
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    const index = this.tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return delay(null);
    this.tasks[index] = { ...this.tasks[index], ...updates };
    return delay({ ...this.tasks[index] });
  }

  async retryTask(taskId: string): Promise<Task | null> {
    const index = this.tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return delay(null);
    this.tasks[index] = {
      ...this.tasks[index],
      status: 'pending',
      progress: 0,
      error: undefined,
      retryCount: this.tasks[index].retryCount + 1,
      currentStep: 0,
    };
    return delay({ ...this.tasks[index] });
  }

  async getTranscript(taskId: string): Promise<TranscriptSegment[] | null> {
    const transcript = this.transcripts.get(taskId);
    return delay(transcript ? [...transcript] : null);
  }

  async updateTranscript(taskId: string, segments: TranscriptSegment[]): Promise<TranscriptSegment[]> {
    this.transcripts.set(taskId, [...segments]);
    return delay([...segments]);
  }

  async getChapters(taskId: string): Promise<Chapter[] | null> {
    const chapters = this.chapters.get(taskId);
    return delay(chapters ? [...chapters] : null);
  }

  async updateChapters(taskId: string, chapters: Chapter[]): Promise<Chapter[]> {
    this.chapters.set(taskId, [...chapters]);
    return delay([...chapters]);
  }

  async getHighlights(taskId: string): Promise<Highlight[] | null> {
    const highlights = this.highlights.get(taskId);
    return delay(highlights ? [...highlights] : null);
  }

  async addHighlight(taskId: string, highlight: Omit<Highlight, 'id'>): Promise<Highlight> {
    const newHighlight: Highlight = {
      ...highlight,
      id: `hl-${Date.now()}`,
    };
    const current = this.highlights.get(taskId) || [];
    current.push(newHighlight);
    this.highlights.set(taskId, [...current]);
    return delay({ ...newHighlight });
  }

  async toggleFavorite(taskId: string, highlightId: string): Promise<Highlight | null> {
    const current = this.highlights.get(taskId);
    if (!current) return delay(null);
    const index = current.findIndex((h) => h.id === highlightId);
    if (index === -1) return delay(null);
    current[index] = { ...current[index], isFavorite: !current[index].isFavorite };
    this.highlights.set(taskId, [...current]);
    return delay({ ...current[index] });
  }

  async getCopy(taskId: string): Promise<CopyContent | null> {
    const copy = this.copies.get(taskId);
    return delay(copy ? { ...copy } : null);
  }

  async regenerateCopy(taskId: string): Promise<CopyContent | null> {
    const copy = this.copies.get(taskId);
    if (!copy) return delay(null);
    const regenerated: CopyContent = {
      titles: copy.titles.map((t, i) => `[重新生成] ${t}`),
      summary: `[重新生成] ${copy.summary}`,
      shownotes: `[重新生成]\n${copy.shownotes}`,
      socialPosts: {
        xiaohongshu: `[重新生成] ${copy.socialPosts.xiaohongshu}`,
        weibo: `[重新生成] ${copy.socialPosts.weibo}`,
        official: `[重新生成] ${copy.socialPosts.official}`,
      },
      coverPrompt: `[重新生成] ${copy.coverPrompt}`,
    };
    this.copies.set(taskId, { ...regenerated });
    return delay({ ...regenerated });
  }

  async getChecklist(taskId: string): Promise<CheckItem[] | null> {
    const checklist = this.checklists.get(taskId);
    return delay(checklist ? [...checklist] : null);
  }

  async runChecklist(taskId: string): Promise<CheckItem[]> {
    const current = this.checklists.get(taskId) || [];
    const updated = current.map((item) => ({
      ...item,
      status: (['pass', 'warning', 'fail'] as const)[Math.floor(Math.random() * 3)],
      message: item.status === 'pending' ? `检查已完成: ${item.name}` : item.message,
    }));
    this.checklists.set(taskId, [...updated]);
    return delay([...updated]);
  }

  async exportPackage(taskId: string): Promise<Record<string, unknown> | null> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return delay(null);
    const transcript = this.transcripts.get(taskId) || [];
    const chapters = this.chapters.get(taskId) || [];
    const highlights = this.highlights.get(taskId) || [];
    const copy = this.copies.get(taskId);
    const checklist = this.checklists.get(taskId) || [];

    return delay({
      task,
      transcript,
      chapters,
      highlights,
      copy,
      checklist,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    });
  }
}

export const dataStore = new DataStore();
