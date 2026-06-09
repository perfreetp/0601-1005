import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Plus,
  RefreshCw,
  ArrowRight,
  FileAudio,
  Clock,
  Calendar,
  CheckCircle2,
  Loader2,
  XCircle,
  Circle,
  X,
  Search,
  Filter,
  ArrowUpDown,
  AlertOctagon,
  Layers,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Task, TaskStatus } from '../../shared/types';
import { cn } from '@/lib/utils';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface StatusBadgeProps {
  status: TaskStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    pending: {
      label: '等待中',
      icon: Circle,
      className: 'bg-stone-100 text-stone-600',
    },
    processing: {
      label: '处理中',
      icon: Loader2,
      className: 'bg-brand-100 text-brand-700',
    },
    completed: {
      label: '已完成',
      icon: CheckCircle2,
      className: 'bg-emerald-100 text-emerald-700',
    },
    failed: {
      label: '失败',
      icon: XCircle,
      className: 'bg-rose-100 text-rose-700',
    },
  }[status];

  const Icon = config.icon;

  return (
    <span className={cn('chip', config.className)}>
      <Icon className={cn('w-3.5 h-3.5', status === 'processing' && 'animate-spin')} />
      {config.label}
    </span>
  );
}

interface PendingFile {
  id: string;
  name: string;
  size: number;
  duration: number;
}

const STEP_LABELS: Record<number, string> = {
  1: '上传解析',
  2: '音频转写',
  3: '章节切分',
  4: '亮点提取',
  5: '文案生成',
  6: '发布检查',
};

type SortKey = 'createdAt' | 'duration' | 'progress';
type SortOrder = 'asc' | 'desc';

export default function TasksPage() {
  const navigate = useNavigate();
  const { tasks, createTask, retryTask } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch =
        searchKeyword.trim() === '' ||
        task.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        task.fileName.toLowerCase().includes(searchKeyword.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let diff = 0;
      if (sortKey === 'createdAt') {
        diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortKey === 'duration') {
        diff = a.duration - b.duration;
      } else if (sortKey === 'progress') {
        diff = a.progress - b.progress;
      }
      return sortOrder === 'asc' ? diff : -diff;
    });

  const statusFilters: Array<{ key: 'all' | TaskStatus; label: string }> = [
    { key: 'all', label: '全部' },
    { key: 'processing', label: '处理中' },
    { key: 'completed', label: '已完成' },
    { key: 'failed', label: '失败' },
  ];

  const sortOptions: Array<{ key: SortKey; label: string }> = [
    { key: 'createdAt', label: '创建时间' },
    { key: 'duration', label: '音频时长' },
    { key: 'progress', label: '任务进度' },
  ];

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const addPendingFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const newFiles: PendingFile[] = arr.map((f) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: f.name,
      size: f.size,
      duration: Math.floor(60 + Math.random() * 3000),
    }));
    setPendingFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addPendingFiles(e.dataTransfer.files);
      }
    },
    [addPendingFiles],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addPendingFiles(e.target.files);
        e.target.value = '';
      }
    },
    [addPendingFiles],
  );

  const removePendingFile = useCallback((id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleCreateTasks = useCallback(async () => {
    for (const f of pendingFiles) {
      await createTask({
        fileName: f.name,
        fileSize: f.size,
        duration: f.duration,
        title: f.name.replace(/\.[^/.]+$/, ''),
      });
    }
    setPendingFiles([]);
  }, [pendingFiles, createTask]);

  const STEP_ROUTE_MAP: Record<number, string> = {
    1: '/transcript',
    2: '/transcript',
    3: '/chapters',
    4: '/highlights',
    5: '/copy',
    6: '/publish',
  };

  const getRouteForTask = (task: Task) => {
    if (task.status === 'completed') return `/publish/${task.id}`;
    if (task.status === 'failed') return null;
    if (task.status === 'pending') return `/transcript/${task.id}`;
    const route = STEP_ROUTE_MAP[task.currentStep] || '/transcript';
    return `${route}/${task.id}`;
  };

  const handleRowClick = useCallback(
    (task: Task) => {
      const route = getRouteForTask(task);
      if (route) navigate(route);
    },
    [navigate],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-brand-50/30 to-amber-50/40 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 font-display">任务面板</h1>
            <p className="text-stone-500 mt-1">上传音频文件，AI 自动为您转写整理</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            新建任务
          </button>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'glass-card cursor-pointer transition-all duration-300',
            isDragging ? 'border-brand-400 bg-brand-50/50 scale-[1.01]' : 'hover:border-brand-300 hover:bg-brand-50/30',
          )}
        >
          <div className="border-2 border-dashed border-stone-300 rounded-xl p-12 text-center">
            <div
              className={cn(
                'w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300',
                isDragging
                  ? 'bg-gradient-brand scale-110'
                  : 'bg-gradient-to-br from-brand-100 to-amber-100',
              )}
            >
              <Upload
                className={cn(
                  'w-10 h-10 transition-all duration-300',
                  isDragging ? 'text-white animate-float' : 'text-brand-700',
                )}
              />
            </div>
            <h3 className="text-xl font-semibold text-stone-800 mb-2">
              {isDragging ? '释放文件以上传' : '拖拽音频文件到此处'}
            </h3>
            <p className="text-stone-500 mb-4">或点击选择文件，支持 MP3、WAV、M4A 等格式</p>
            <div className="flex items-center justify-center gap-4 text-sm text-stone-400">
              <span className="flex items-center gap-1">
                <FileAudio className="w-4 h-4" />
                单文件最大 500MB
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                最长 6 小时
              </span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {pendingFiles.length > 0 && (
          <div className="glass-card p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-stone-800">
                待上传文件 ({pendingFiles.length})
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setPendingFiles([])}
                  className="btn-ghost"
                >
                  清空
                </button>
                <button onClick={handleCreateTasks} className="btn-primary">
                  开始转写
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {pendingFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200 animate-slide-in"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-amber-100 flex items-center justify-center flex-shrink-0">
                    <FileAudio className="w-6 h-6 text-brand-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 truncate">{f.name}</p>
                    <p className="text-sm text-stone-500 mt-0.5">
                      {formatFileSize(f.size)} · 约 {formatDuration(f.duration)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePendingFile(f.id);
                    }}
                    className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200/60">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <h3 className="text-lg font-semibold text-stone-800">任务队列</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="搜索任务名或文件名..."
                    className="input-base pl-9 pr-4 py-2 text-sm w-64"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-stone-400" />
                  {statusFilters.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setStatusFilter(f.key)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                        statusFilter === f.key
                          ? 'bg-gradient-brand text-white shadow-md shadow-brand-700/20'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 border-l border-stone-200 pl-3">
                  <ArrowUpDown className="w-4 h-4 text-stone-400" />
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => toggleSort(opt.key)}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1',
                        sortKey === opt.key
                          ? 'bg-stone-800 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
                      )}
                    >
                      {opt.label}
                      {sortKey === opt.key && (
                        <span className="text-[10px] opacity-70">
                          {sortOrder === 'desc' ? '↓' : '↑'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-stone-500 mt-3">
              共 <span className="font-semibold text-brand-600">{filteredTasks.length}</span> 条任务
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50/50">
                  <th className="text-left py-3 px-6 text-sm font-medium text-stone-500">任务名</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-stone-500">文件</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-stone-500">时长</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-stone-500">状态 / 当前阶段</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-stone-500 w-56">进度</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-stone-500">创建时间</th>
                  <th className="text-right py-3 px-6 text-sm font-medium text-stone-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="text-stone-400">
                        <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>没有找到匹配的任务</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task, idx) => {
                    const stepLabel = STEP_LABELS[task.currentStep] || '处理中';
                    return (
                      <tr
                        key={task.id}
                        onClick={() => handleRowClick(task)}
                        className={cn(
                          'transition-all duration-200',
                          task.status === 'failed'
                            ? 'bg-rose-50/30 cursor-default'
                            : 'cursor-pointer hover:bg-brand-50/30',
                        )}
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <td className="py-4 px-6">
                          <p className="font-medium text-stone-800 line-clamp-1">{task.title}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm text-stone-600 line-clamp-1">{task.fileName}</p>
                          <p className="text-xs text-stone-400 mt-0.5">{formatFileSize(task.fileSize)}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className="flex items-center gap-1.5 text-sm text-stone-600">
                            <Clock className="w-4 h-4 text-stone-400" />
                            {formatDuration(task.duration)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <StatusBadge status={task.status} />
                          {task.status === 'processing' && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-brand-600">
                              <Layers className="w-3 h-3" />
                              <span className="font-medium">{stepLabel}</span>
                              <span className="text-stone-400">（第 {task.currentStep}/6 步）</span>
                            </div>
                          )}
                          {task.status === 'failed' && task.error && (
                            <div className="mt-2 p-2 rounded-lg bg-rose-100/60 border border-rose-200">
                              <div className="flex items-start gap-1.5">
                                <AlertOctagon className="w-3.5 h-3.5 text-rose-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-rose-700">失败原因</p>
                                  <p className="text-xs text-rose-600 mt-0.5 line-clamp-2">
                                    {task.error}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="progress-bar flex-1">
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${task.progress}%`,
                                  background:
                                    task.status === 'failed'
                                      ? 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)'
                                      : undefined,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium text-stone-700 w-10 text-right">
                              {task.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="flex items-center gap-1.5 text-sm text-stone-600">
                            <Calendar className="w-4 h-4 text-stone-400" />
                            {formatDate(task.createdAt)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {task.status === 'failed' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  retryTask(task.id);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-all shadow-sm hover:shadow"
                              >
                                <RefreshCw className="w-4 h-4" />
                                重试
                              </button>
                            )}
                            {task.status !== 'failed' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const route = getRouteForTask(task);
                                  if (route) navigate(route);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-brand text-white hover:shadow-lg hover:shadow-brand-700/30 transition-all"
                              >
                                {task.status === 'processing'
                                  ? `前往 ${STEP_LABELS[task.currentStep] || '处理中'}`
                                  : task.status === 'pending'
                                    ? '开始处理'
                                    : '进入'}
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
