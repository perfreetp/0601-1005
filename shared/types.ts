export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Task {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  duration: number;
  status: TaskStatus;
  progress: number;
  createdAt: string;
  error?: string;
  retryCount: number;
  currentStep: number;
}

export type MistakeType = 'pronunciation' | 'grammar' | 'filler';

export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  speaker: string;
  text: string;
  isMistake?: boolean;
  mistakeType?: MistakeType;
}

export interface Chapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  keywords: string[];
  summary: string;
}

export interface Highlight {
  id: string;
  text: string;
  startTime: number;
  speaker: string;
  isFavorite: boolean;
}

export interface CopyContent {
  titles: string[];
  summary: string;
  shownotes: string;
  socialPosts: {
    xiaohongshu: string;
    weibo: string;
    official: string;
  };
  coverPrompt: string;
}

export type CheckStatus = 'pass' | 'fail' | 'warning' | 'pending';

export interface CheckItem {
  id: string;
  name: string;
  status: CheckStatus;
  message: string;
  details: string[];
}

export interface TermItem {
  id: string;
  original: string;
  replacement: string;
  category: 'sensitive' | 'term' | 'custom';
}

export interface TaskFullData {
  task: Task;
  transcript: TranscriptSegment[];
  chapters: Chapter[];
  highlights: Highlight[];
  copy: CopyContent;
  checklist: CheckItem[];
}
