import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  Play,
  Loader2,
  FileArchive,
  ShieldCheck,
  Radio,
  Podcast,
  BookOpen,
  Heart,
  Download,
  Calendar,
  FileText,
  CheckCircle,
  XOctagon,
  AlertCircle,
  Trash2,
  Filter,
  MessageCircle,
  HardDrive,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import type { CheckStatus } from '../../shared/types';
import type { PlatformValidation } from '../store/useStore';

const platforms = [
  { key: 'xiaoyuzhou', label: '小宇宙', icon: Radio, color: 'text-orange-500' },
  { key: 'ximalaya', label: '喜马拉雅', icon: Podcast, color: 'text-red-500' },
  { key: 'official', label: '公众号', icon: BookOpen, color: 'text-emerald-600' },
  { key: 'xiaohongshu', label: '小红书', icon: Heart, color: 'text-rose-500' },
  { key: 'weibo', label: '微博', icon: MessageCircle, color: 'text-amber-600' },
];

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFieldStatusIcon(status: 'pass' | 'warning' | 'fail') {
  switch (status) {
    case 'pass':
      return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
    case 'warning':
      return <AlertCircle className="w-3.5 h-3.5 text-amber-500" />;
    case 'fail':
      return <XOctagon className="w-3.5 h-3.5 text-rose-500" />;
  }
}

function getFieldStatusColor(status: 'pass' | 'warning' | 'fail') {
  switch (status) {
    case 'pass':
      return 'bg-emerald-500';
    case 'warning':
      return 'bg-amber-500';
    case 'fail':
      return 'bg-rose-500';
  }
}

export default function ChecklistPage() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(['xiaoyuzhou', 'ximalaya']),
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [exportTaskFilter, setExportTaskFilter] = useState<string>('all');

  const {
    checklists,
    currentTaskId,
    runChecklist,
    exportZip,
    validateAllPlatforms,
    exports,
    tasks,
    deleteExportRecord,
    downloadExportRecord,
  } = useStore();
  const taskId = currentTaskId || 'task-002';
  const items = checklists[taskId] || [];

  const platformValidations = useMemo(() => {
    return validateAllPlatforms(taskId);
  }, [validateAllPlatforms, taskId, checklists]);

  const selectedValidations = useMemo(() => {
    return platformValidations.filter((v) => selectedPlatforms.has(v.key));
  }, [platformValidations, selectedPlatforms]);

  const failedPlatformSummary = useMemo(() => {
    const result: Array<{ platformLabel: string; fails: string[]; warns: string[] }> = [];
    for (const v of selectedValidations) {
      const fails = v.fields.filter((f) => f.status === 'fail').map((f) => f.label);
      const warns = v.fields.filter((f) => f.status === 'warning').map((f) => f.label);
      if (fails.length > 0 || warns.length > 0) {
        result.push({ platformLabel: v.label, fails, warns });
      }
    }
    return result;
  }, [selectedValidations]);

  const filteredExports = useMemo(() => {
    if (exportTaskFilter === 'all') return exports;
    if (exportTaskFilter === 'current') return exports.filter((e) => e.taskId === taskId);
    return exports.filter((e) => e.taskId === exportTaskFilter);
  }, [exports, exportTaskFilter, taskId]);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const togglePlatform = (key: string) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleRunChecklist = async () => {
    setIsRunning(true);
    setExpandedItems(new Set());
    await runChecklist(taskId);
    setTimeout(() => setIsRunning(false), items.length * 400 + 200);
  };

  const passCount = items.filter((i) => i.status === 'pass').length;
  const totalCount = items.length;
  const passRate = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;

  const getStatusIcon = (status: CheckStatus) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case 'fail':
        return <XCircle className="w-6 h-6 text-rose-500" />;
      case 'pending':
        return <Circle className="w-6 h-6 text-stone-300" />;
    }
  };

  const getStatusColor = (status: CheckStatus) => {
    switch (status) {
      case 'pass':
        return 'border-emerald-200 bg-emerald-50/30';
      case 'warning':
        return 'border-amber-200 bg-amber-50/30';
      case 'fail':
        return 'border-rose-200 bg-rose-50/30';
      case 'pending':
        return 'border-stone-200 bg-white';
    }
  };

  const getStatusChip = (status: CheckStatus) => {
    switch (status) {
      case 'pass':
        return (
          <span className="chip bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-3 h-3" />
            通过
          </span>
        );
      case 'warning':
        return (
          <span className="chip bg-amber-100 text-amber-700">
            <AlertTriangle className="w-3 h-3" />
            警告
          </span>
        );
      case 'fail':
        return (
          <span className="chip bg-rose-100 text-rose-700">
            <XCircle className="w-3 h-3" />
            未通过
          </span>
        );
      case 'pending':
        return (
          <span className="chip bg-stone-100 text-stone-500">
            <Circle className="w-3 h-3" />
            待检查
          </span>
        );
    }
  };

  const renderProgressRing = () => {
    const size = 200;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (passRate / 100) * circumference;

    let strokeColor = '#fbbf24';
    if (passRate >= 90) strokeColor = '#10b981';
    else if (passRate >= 70) strokeColor = '#f59e0b';
    else if (passRate < 70 && passRate > 0) strokeColor = '#f43f5e';

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e7e5e4"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold text-stone-900">{passRate}%</span>
          <span className="text-sm text-stone-500 mt-1">通过率</span>
          <span className="text-xs text-stone-400 mt-0.5">
            {passCount} / {totalCount} 项通过
          </span>
        </div>
      </div>
    );
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-brand-500" />
          发布包检查器
        </h1>
        <p className="text-sm text-stone-500 mt-1">自动检查内容质量，确保多平台分发合规</p>
      </div>
      <button
        onClick={handleRunChecklist}
        disabled={isRunning}
        className={cn(
          'btn-amber px-8 py-3.5 text-base flex items-center gap-2',
          isRunning && 'opacity-80 cursor-not-allowed',
        )}
      >
        {isRunning ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Play className="w-5 h-5 fill-current" />
        )}
        {isRunning ? '检查中...' : '开始检查'}
      </button>
    </div>
  );

  const renderStats = () => (
    <div className="glass-card p-8 mb-8">
      <div className="flex items-center justify-between">
        {renderProgressRing()}
        <div className="flex-1 ml-12 grid grid-cols-4 gap-6">
          <div className="text-center p-4 rounded-2xl bg-emerald-50">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-emerald-700">
              {items.filter((i) => i.status === 'pass').length}
            </p>
            <p className="text-sm text-stone-500 mt-1">通过</p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-amber-50">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-amber-700">
              {items.filter((i) => i.status === 'warning').length}
            </p>
            <p className="text-sm text-stone-500 mt-1">警告</p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-rose-50">
            <XCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-rose-700">
              {items.filter((i) => i.status === 'fail').length}
            </p>
            <p className="text-sm text-stone-500 mt-1">未通过</p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-stone-50">
            <Circle className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-stone-600">
              {items.filter((i) => i.status === 'pending').length}
            </p>
            <p className="text-sm text-stone-500 mt-1">待检</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChecklist = () => (
    <div className="space-y-3 mb-8">
      {items.map((item, idx) => {
        const isExpanded = expandedItems.has(item.id);
        const isAnimating = isRunning && item.status === 'pending';
        return (
          <div
            key={item.id}
            className={cn(
              'glass-card border-2 overflow-hidden transition-all duration-300',
              getStatusColor(item.status),
              isAnimating && 'animate-pulse-soft',
            )}
            style={{
              animationDelay: isRunning ? `${idx * 100}ms` : undefined,
            }}
          >
            <div
              className="p-5 flex items-center gap-4 cursor-pointer hover:bg-black/5 transition-colors"
              onClick={() => toggleExpand(item.id)}
            >
              <div className="flex-shrink-0">{getStatusIcon(item.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold text-stone-900">{item.name}</h3>
                  {getStatusChip(item.status)}
                </div>
                <p className="text-sm text-stone-600 mt-1">{item.message}</p>
              </div>
              <button
                className="p-2 hover:bg-stone-100 rounded-full transition-colors flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(item.id);
                }}
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-stone-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-stone-500" />
                )}
              </button>
            </div>
            {isExpanded && (
              <div className="px-5 pb-5 pt-2 border-t border-stone-100/60 animate-slide-in">
                <p className="text-xs font-medium text-stone-500 mb-3">检查详情</p>
                <ul className="space-y-2">
                  {item.details.map((detail, detailIdx) => (
                    <li
                      key={detailIdx}
                      className="flex items-start gap-2 text-sm text-stone-600"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-2 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderExport = () => (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
            <FileArchive className="w-5 h-5 text-brand-500" />
            导出发布包
          </h3>
          <p className="text-sm text-stone-500 mt-1">选择需要生成的平台发布格式</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-6">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const isSelected = selectedPlatforms.has(platform.key);
          const pv = platformValidations.find((v) => v.key === platform.key);
          const hasFail = pv?.fields.some((f) => f.status === 'fail');
          const hasWarn = pv?.fields.some((f) => f.status === 'warning');
          return (
            <label
              key={platform.key}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 relative',
                isSelected
                  ? 'border-brand-500 bg-brand-50/50'
                  : 'border-stone-200 bg-white hover:border-brand-300',
              )}
            >
              <div className="flex items-center gap-2 w-full">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => togglePlatform(platform.key)}
                  className="accent-brand-600 w-4 h-4 flex-shrink-0"
                />
                <Icon className={cn('w-5 h-5', platform.color)} />
                <span className="text-sm font-medium text-stone-700">{platform.label}</span>
              </div>
              {(hasFail || hasWarn) && (
                <div className="flex items-center gap-1 text-[11px]">
                  {hasFail && <span className="chip bg-rose-50 text-rose-600 !py-0.5 !px-2">有未通过</span>}
                  {!hasFail && hasWarn && <span className="chip bg-amber-50 text-amber-600 !py-0.5 !px-2">有警告</span>}
                </div>
              )}
            </label>
          );
        })}
      </div>

      {failedPlatformSummary.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 mb-2">
                以下选中平台存在未通过或警告字段，仍可导出草稿包：
              </p>
              <ul className="space-y-1">
                {failedPlatformSummary.map((s, idx) => (
                  <li key={idx} className="text-sm text-amber-700">
                    <span className="font-medium">【{s.platformLabel}】</span>
                    {s.fails.length > 0 && <span>未通过：{s.fails.join('、')}；</span>}
                    {s.warns.length > 0 && <span>警告：{s.warns.join('、')}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-stone-100">
        <div className="text-sm text-stone-500">
          已选择 <span className="font-semibold text-brand-700">{selectedPlatforms.size}</span> 个平台
        </div>
        <button
          disabled={selectedPlatforms.size === 0 || isExporting}
          onClick={async () => {
            if (selectedPlatforms.size === 0 || isExporting) return;
            setIsExporting(true);
            try {
              await exportZip(taskId, Array.from(selectedPlatforms));
            } finally {
              setTimeout(() => setIsExporting(false), 500);
            }
          }}
          className={cn(
            'btn-primary flex items-center gap-2',
            (selectedPlatforms.size === 0 || isExporting) && 'opacity-50 cursor-not-allowed',
          )}
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileArchive className="w-4 h-4" />
          )}
          {isExporting ? '打包中...' : failedPlatformSummary.length > 0 ? '导出草稿 ZIP 包' : '导出 ZIP 包'}
        </button>
      </div>
    </div>
  );

  const renderPlatformPreview = () => {
    return (
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-500" />
              平台发布预览
            </h2>
            <p className="text-sm text-stone-500 mt-1">各平台字段校验与字数检查，草稿状态不影响导出</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {platformValidations.map((validation) => {
            const platformMeta = platforms.find((p) => p.key === validation.key);
            const Icon = platformMeta?.icon || FileText;
            const iconColor = platformMeta?.color || 'text-brand-500';
            const passCount = validation.fields.filter((f) => f.status === 'pass').length;
            const warnCount = validation.fields.filter((f) => f.status === 'warning').length;
            const failCount = validation.fields.filter((f) => f.status === 'fail').length;

            return (
              <div key={validation.key} className="glass-card p-5 card-hover">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-stone-50 flex items-center justify-center">
                      <Icon className={cn('w-5 h-5', iconColor)} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-800">{validation.label}</h3>
                      <div className="flex items-center gap-2 text-xs mt-0.5">
                        <span className="text-emerald-600">{passCount} 通过</span>
                        {warnCount > 0 && <span className="text-amber-600">{warnCount} 警告</span>}
                        {failCount > 0 && <span className="text-rose-600">{failCount} 未通过</span>}
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'w-2.5 h-2.5 rounded-full',
                      failCount > 0 ? 'bg-rose-500' : warnCount > 0 ? 'bg-amber-500' : 'bg-emerald-500',
                    )}
                  />
                </div>

                <div className="space-y-3">
                  {validation.fields.map((field, fIdx) => {
                    const percentage =
                      field.max > 0 ? Math.min(100, Math.round((field.length / field.max) * 100)) : 0;

                    return (
                      <div key={fIdx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1.5">
                            {getFieldStatusIcon(field.status)}
                            <span className="font-medium text-stone-700">{field.label}</span>
                            <span className="text-stone-400 text-xs">
                              {field.length}
                              {field.max > 0 ? `/${field.max}` : ''}
                            </span>
                          </div>
                        </div>
                        {field.max > 0 && (
                          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-500',
                                getFieldStatusColor(field.status),
                              )}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        )}
                        {field.status !== 'pass' && (
                          <p className="text-xs text-stone-500 leading-relaxed">{field.message}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderExportHistory = () => {
    const platformNameMap: Record<string, string> = {
      xiaoyuzhou: '小宇宙',
      ximalaya: '喜马拉雅',
      official: '公众号',
      xiaohongshu: '小红书',
      weibo: '微博',
    };
    const currentTaskTitle = tasks.find((t) => t.id === taskId)?.title || '当前任务';

    return (
      <div className="glass-card p-6 mt-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-brand-500" />
              发布包管理
            </h3>
            <p className="text-sm text-stone-500 mt-1">
              共 {exports.length} 条历史记录，基于当时内容快照重新下载，包内容不变
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400" />
            <select
              value={exportTaskFilter}
              onChange={(e) => setExportTaskFilter(e.target.value)}
              className="input-base text-sm py-2 pr-8"
            >
              <option value="all">全部任务</option>
              <option value="current">当前任务（{currentTaskTitle}）</option>
              {tasks
                .filter((t) => t.id !== taskId && exports.some((e) => e.taskId === t.id))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {filteredExports.length === 0 ? (
          <div className="py-12 text-center">
            <HardDrive className="w-12 h-12 mx-auto mb-3 text-stone-300" />
            <p className="text-stone-500">该筛选条件下暂无导出记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExports.map((record) => {
              const rateColor =
                record.passRate >= 90
                  ? 'text-emerald-600'
                  : record.passRate >= 70
                    ? 'text-amber-600'
                    : 'text-rose-600';
              const ringColor =
                record.passRate >= 90
                  ? '#10b981'
                  : record.passRate >= 70
                    ? '#f59e0b'
                    : '#f43f5e';
              const size = 48;
              const strokeWidth = 5;
              const radius = (size - strokeWidth) / 2;
              const circumference = radius * 2 * Math.PI;
              const offset = circumference - (record.passRate / 100) * circumference;
              const gradId = `grad-${record.id}`;
              const ringStop2 =
                record.passRate >= 90 ? '#059669' : record.passRate >= 70 ? '#d97706' : '#e11d48';
              const isCurrentTask = record.taskId === taskId;

              return (
                <div
                  key={record.id}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-stone-200 bg-white hover:shadow-md hover:border-brand-200 transition-all"
                >
                  <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
                    <svg width={size} height={size} className="transform -rotate-90">
                      <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#e7e5e4"
                        strokeWidth={strokeWidth}
                        fill="none"
                      />
                      <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={`url(#${gradId})`}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                      />
                      <defs>
                        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={ringColor} />
                          <stop offset="100%" stopColor={ringStop2} />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={cn('text-xs font-bold', rateColor)}>{record.passRate}%</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-stone-800 truncate">{record.taskTitle}</p>
                      {isCurrentTask && (
                        <span className="chip bg-brand-50 text-brand-700 text-[10px] !py-0 !px-2">当前任务</span>
                      )}
                      {record.passRate >= 90 ? (
                        <span className="chip bg-emerald-50 text-emerald-600 text-[10px] !py-0 !px-2">
                          通过
                        </span>
                      ) : record.passRate >= 70 ? (
                        <span className="chip bg-amber-50 text-amber-600 text-[10px] !py-0 !px-2">
                          警告
                        </span>
                      ) : (
                        <span className="chip bg-rose-50 text-rose-600 text-[10px] !py-0 !px-2">
                          未通过
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(record.exportedAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {record.fileSizeBytes ? formatBytes(record.fileSizeBytes) : '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        {record.passedChecks}/{record.totalChecks} 项检查
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {record.platforms.map((p) => (
                          <span key={p} className="chip bg-stone-100 text-stone-600 text-[10px] !py-0 !px-1.5">
                            {platformNameMap[p] || p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      disabled={downloadingId === record.id}
                      onClick={async () => {
                        setDownloadingId(record.id);
                        try {
                          await downloadExportRecord(record.id);
                        } finally {
                          setTimeout(() => setDownloadingId(null), 500);
                        }
                      }}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                        downloadingId === record.id
                          ? 'bg-brand-100 text-brand-600 cursor-wait'
                          : 'bg-brand-50 text-brand-700 hover:bg-brand-100',
                      )}
                      title="重新下载原始内容快照"
                    >
                      {downloadingId === record.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      下载
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('确定删除这条导出记录吗？')) {
                          deleteExportRecord(record.id);
                        }
                      }}
                      className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                      title="删除记录"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-5xl mx-auto">
        {renderHeader()}
        {renderStats()}
        {renderChecklist()}
        {renderPlatformPreview()}
        {renderExport()}
        {renderExportHistory()}
      </div>
    </div>
  );
}
