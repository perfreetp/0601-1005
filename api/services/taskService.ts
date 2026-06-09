import { dataStore } from '../repository/dataStore';
import type {
  Task,
  TranscriptSegment,
  Chapter,
  Highlight,
  CopyContent,
  CheckItem,
} from '../../shared/types';

export const fetchTasks = async (): Promise<Task[]> => {
  return dataStore.getTasks();
};

export const getTask = async (id: string): Promise<Task | undefined> => {
  const task = await dataStore.getTaskById(id);
  return task ?? undefined;
};

interface FileInfo {
  title: string;
  fileName: string;
  fileSize: number;
  duration: number;
}

export const createTask = async (fileInfo: FileInfo): Promise<Task> => {
  return dataStore.createTask({
    title: fileInfo.title,
    fileName: fileInfo.fileName,
    fileSize: fileInfo.fileSize,
    duration: fileInfo.duration,
    status: 'pending',
    progress: 0,
  });
};

export const retryTask = async (id: string): Promise<Task | undefined> => {
  const task = await dataStore.retryTask(id);
  return task ?? undefined;
};

export const simulateProgress = async (taskId: string): Promise<void> => {
  const task = await dataStore.getTaskById(taskId);
  if (!task) return;
  await dataStore.updateTask(taskId, { status: 'processing', progress: 0 });
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(async () => {
      progress = Math.min(progress + 5, 100);
      const currentStep = Math.min(Math.floor(progress / 20) + 1, 5);
      if (progress < 100) {
        await dataStore.updateTask(taskId, { progress, currentStep });
      } else {
        clearInterval(interval);
        await dataStore.updateTask(taskId, {
          status: 'completed',
          progress: 100,
          currentStep: 5,
        });
        resolve();
      }
    }, 200);
  });
};

export const getTranscript = async (
  taskId: string
): Promise<TranscriptSegment[]> => {
  const transcript = await dataStore.getTranscript(taskId);
  return transcript ?? [];
};

export const updateTranscript = async (
  taskId: string,
  segments: TranscriptSegment[]
): Promise<TranscriptSegment[]> => {
  return dataStore.updateTranscript(taskId, segments);
};

export const getChapters = async (taskId: string): Promise<Chapter[]> => {
  const chapters = await dataStore.getChapters(taskId);
  return chapters ?? [];
};

export const updateChapters = async (
  taskId: string,
  chapters: Chapter[]
): Promise<Chapter[]> => {
  return dataStore.updateChapters(taskId, chapters);
};

export const getHighlights = async (taskId: string): Promise<Highlight[]> => {
  const highlights = await dataStore.getHighlights(taskId);
  return highlights ?? [];
};

export const addHighlight = async (
  taskId: string,
  highlight: Omit<Highlight, 'id' | 'isFavorite'>
): Promise<Highlight> => {
  return dataStore.addHighlight(taskId, { ...highlight, isFavorite: false });
};

export const toggleHighlightFavorite = async (
  taskId: string,
  highlightId: string
): Promise<Highlight | undefined> => {
  const highlight = await dataStore.toggleFavorite(taskId, highlightId);
  return highlight ?? undefined;
};

export const getCopy = async (taskId: string): Promise<CopyContent | undefined> => {
  const copy = await dataStore.getCopy(taskId);
  return copy ?? undefined;
};

export const regenerateCopy = async (
  taskId: string,
  type: keyof CopyContent | 'all'
): Promise<CopyContent | undefined> => {
  const copy = await dataStore.getCopy(taskId);
  if (!copy) return undefined;
  if (type === 'all' || type === 'titles') {
    copy.titles = [
      `AI生成标题-${Date.now()}-1`,
      `AI生成标题-${Date.now()}-2`,
      `AI生成标题-${Date.now()}-3`,
    ];
  }
  if (type === 'all' || type === 'summary') {
    copy.summary = `AI重新生成的摘要内容-${Date.now()}`;
  }
  if (type === 'all' || type === 'shownotes') {
    copy.shownotes = `AI重新生成的Shownotes内容-${Date.now()}`;
  }
  if (type === 'all' || type === 'socialPosts') {
    copy.socialPosts = {
      xiaohongshu: `小红书文案-${Date.now()}`,
      weibo: `微博文案-${Date.now()}`,
      official: `公众号文案-${Date.now()}`,
    };
  }
  if (type === 'all' || type === 'coverPrompt') {
    copy.coverPrompt = `AI重新生成的封面提示词-${Date.now()}`;
  }
  return copy;
};

export const getChecklist = async (taskId: string): Promise<CheckItem[]> => {
  const checklist = await dataStore.getChecklist(taskId);
  return checklist ?? [];
};

export const runChecklist = async (taskId: string): Promise<CheckItem[]> => {
  return dataStore.runChecklist(taskId);
};

interface ExportPackageResult {
  taskId: string;
  platforms: string[];
  exportedAt: string;
  packageUrl: string;
}

export const exportPackage = async (
  taskId: string,
  platforms: string[]
): Promise<ExportPackageResult> => {
  return {
    taskId,
    platforms,
    exportedAt: new Date().toISOString(),
    packageUrl: `/api/exports/${taskId}-${Date.now()}.zip`,
  };
};
