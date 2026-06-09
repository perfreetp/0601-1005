import { useState, useMemo, useEffect } from 'react';
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
  X,
  Info,
  Edit3,
  Tag,
  User,
  Link2,
  Package2,
  Send,
  Rocket,
  Save,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import type { CheckStatus } from '../../shared/types';
import type { PlatformValidation } from '../store/useStore';
import { scanAllContent } from '../utils/sensitiveWords';

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
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [exportTaskFilter, setExportTaskFilter] = useState<string>('all');
  const [exportStatusFilter, setExportStatusFilter] = useState<string>('all');
  const [detailRecordId, setDetailRecordId] = useState<string | null>(null);
  const [detailEditingNote, setDetailEditingNote] = useState('');
  const [detailEditingStatus, setDetailEditingStatus] = useState<'draft' | 'delivered' | 'published'>('draft');
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailLocalLinks, setDetailLocalLinks] = useState<Record<string, string>>({});
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [plannedPublishAt, setPlannedPublishAt] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [platformLinksDraft, setPlatformLinksDraft] = useState<Record<string, string>>({});

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
    updateExportRecord,
    isExportRecordComplete,
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

  const DELIVER_STATUS_META: Record<string, { label: string; className: string; icon: any }> = {
    draft: { label: '草稿', className: 'bg-stone-100 text-stone-600', icon: Circle },
    delivered: { label: '已交付', className: 'bg-brand-100 text-brand-700', icon: Send },
    published: { label: '已发布', className: 'bg-emerald-100 text-emerald-700', icon: Rocket },
  };

  const detailRecord = useMemo(
    () => exports.find((e) => e.id === detailRecordId) || null,
    [exports, detailRecordId],
  );

  useEffect(() => {
    if (detailRecord) {
      setDetailEditingNote(detailRecord.operatorNote || '');
      setDetailEditingStatus(detailRecord.deliverStatus || 'draft');
      const out: Record<string, string> = {};
      for (const p of detailRecord.platforms) {
        out[p] =
          detailRecord.scheduleInfo?.platformLinks?.[p]?.actual ||
          detailRecord.scheduleInfo?.platformLinks?.[p]?.placeholder ||
          '';
      }
      setDetailLocalLinks(out);
    }
  }, [detailRecord?.id, detailRecord?.operatorNote, detailRecord?.deliverStatus, detailRecord?.scheduleInfo?.platformLinks]);

  const filteredExports = useMemo(() => {
    let list = exports;
    if (exportTaskFilter === 'current') list = list.filter((e) => e.taskId === taskId);
    else if (exportTaskFilter !== 'all') list = list.filter((e) => e.taskId === exportTaskFilter);
    if (exportStatusFilter !== 'all') {
      list = list.filter((e) => (e.deliverStatus || 'draft') === exportStatusFilter);
    }
    return list;
  }, [exports, exportTaskFilter, exportStatusFilter, taskId]);

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

  const renderExport = () => {
    const handleExport = async () => {
      if (selectedPlatforms.size === 0 || isExporting) return;
      setIsExporting(true);
      try {
        const schedule =
          showScheduleForm && (plannedPublishAt || operatorName || Object.values(platformLinksDraft).some(Boolean))
            ? {
                plannedPublishAt: plannedPublishAt || undefined,
                operator: operatorName || undefined,
                platformLinks: Object.fromEntries(
                  Object.entries(platformLinksDraft)
                    .filter(([, v]) => v)
                    .map(([k, v]) => [k, { placeholder: v }]),
              }
            : undefined;
        await exportZip(taskId, Array.from(selectedPlatforms), schedule);
        setPlannedPublishAt('');
        setOperatorName('');
        setPlatformLinksDraft({});
        setShowScheduleForm(false);
      } finally {
        setTimeout(() => setIsExporting(false), 500);
      }
    };

    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
              <FileArchive className="w-5 h-5 text-brand-500" />
              导出发布包
            </h3>
            <p className="text-sm text-stone-500 mt-1">选择需要生成的平台发布格式，可附带排期信息</p>
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

        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowScheduleForm((v) => !v}
            className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            <Edit3 className="w-4 h-4" />
            {showScheduleForm ? '收起排期信息' : '填写排期信息（可选）'}
            {showScheduleForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showScheduleForm && (
            <div className="mt-4 p-4 rounded-2xl bg-brand-50/70 border border-brand-100 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> 计划发布时间
                </label>
                <input
                  type="datetime-local"
                  value={plannedPublishAt}
                  onChange={(e) => setPlannedPublishAt(e.target.value)}
                  className="input-base text-sm py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> 负责人
                </label>
                <input
                  type="text"
                  placeholder="运营同学姓名"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="input-base text-sm py-2"
                />
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium text-stone-600 mb-2 flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5" /> 发布链接占位（可选）
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {Array.from(selectedPlatforms).map((key) => {
                    const meta = platforms.find((p) => p.key === key);
                    return (
                      <div key={key}>
                        <label className="block text-[11px] text-stone-500 mb-1">{meta?.label || key}</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={platformLinksDraft[key] || ''}
                          onChange={(e) =>
                            setPlatformLinksDraft((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          className="input-base text-xs py-1.5"
                        />
                      </div>
                    </div>
                  })}
                </div>
              </div>
            </div>
            )}
        </div>

        {downloadError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">{downloadError}</div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
          <div className="text-sm text-stone-500">
            已选择 <span className="font-semibold text-brand-700">{selectedPlatforms.size}</span> 个平台
          </div>
          <button
            disabled={selectedPlatforms.size === 0 || isExporting}
            onClick={handleExport}
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
  };

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

  const renderDetailModal = () => {
    if (!detailRecord) return null;
    const platformNameMap: Record<string, string> = {
      xiaoyuzhou: '小宇宙',
      ximalaya: '喜马拉雅',
      official: '公众号',
      xiaohongshu: '小红书',
      weibo: '微博',
    };

    const handleSave = () => {
      setDetailSaving(true);
      const mergedLinks: Record<string, { placeholder?: string; actual?: string }> = {};
      for (const p of detailRecord.platforms) {
        const prev = detailRecord.scheduleInfo?.platformLinks?.[p];
        mergedLinks[p] = {
          placeholder: prev?.placeholder,
          actual: detailLocalLinks[p] || undefined,
        };
      }
      updateExportRecord(detailRecord.id, {
        operatorNote: detailEditingNote,
        deliverStatus: detailEditingStatus,
        scheduleInfo: {
          ...(detailRecord.scheduleInfo || {}),
          platformLinks: mergedLinks,
        },
      });
      setTimeout(() => setDetailSaving(false), 400);
    };

    const sensitiveGroups: Record<string, string[]> = {};
    if (detailRecord.copySnapshot) {
      try {
        const hits = scanAllContent(detailRecord.copySnapshot);
        for (const [k, v] of Object.entries(hits.groupedHits)) {
          sensitiveGroups[k] = [...new Set(v.map((x) => x.word))];
        }
      } catch {}
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-fade-in">
        <div className="glass-card w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-slide-up">
          <div className="p-5 border-b border-stone-100 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                <Package2 className="w-5 h-5 text-brand-500" />
                发布包详情
              </h3>
              <p className="text-sm text-stone-500 mt-1">
                {detailRecord.taskTitle} · {formatDateTime(detailRecord.exportedAt)}
              </p>
            </div>
            <button
              onClick={() => setDetailRecordId(null)}
              className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-6 space-y-6">
            <div className="grid grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <p className="text-xs text-emerald-600 font-medium">检查通过率</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{detailRecord.passRate}%</p>
                <p className="text-[11px] text-emerald-600/80 mt-0.5">
                  {detailRecord.passedChecks}/{detailRecord.totalChecks} 项
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-brand-50 border border-brand-100">
                <p className="text-xs text-brand-600 font-medium">包含平台</p>
                <p className="text-2xl font-bold text-brand-700 mt-1">{detailRecord.platforms.length}</p>
                <p className="text-[11px] text-brand-600/80 mt-0.5">
                  {detailRecord.platforms.map((p) => platformNameMap[p] || p).join(' · ')}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
                <p className="text-xs text-stone-600 font-medium">包大小</p>
                <p className="text-2xl font-bold text-stone-700 mt-1">
                  {detailRecord.fileSizeBytes ? formatBytes(detailRecord.fileSizeBytes) : '—'}
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {detailRecord.fileManifest?.length || 0} 个文件
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <p className="text-xs text-amber-700 font-medium">负责人 / 计划时间</p>
                <p className="text-sm font-semibold text-amber-800 mt-1">
                  {detailRecord.scheduleInfo?.operator || '未设置'}
                </p>
                <p className="text-[11px] text-amber-700/80 mt-0.5">
                  {detailRecord.scheduleInfo?.plannedPublishAt
                    ? formatDateTime(detailRecord.scheduleInfo.plannedPublishAt)
                    : '无排期'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <h4 className="text-sm font-semibold text-stone-800 mb-2.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> 各平台问题与敏感词
                </h4>
                <div className="space-y-2">
                  {(detailRecord.validationSnapshot || []).map((pv) => {
                    const fails = pv.fields.filter((f) => f.status === 'fail').map((f) => f.label);
                    const warns = pv.fields.filter((f) => f.status === 'warning').map((f) => f.label);
                    return (
                      <div key={pv.key} className="p-3 rounded-xl border border-stone-100 bg-white">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-stone-800">{pv.label}</p>
                          {fails.length > 0 ? (
                            <span className="chip bg-rose-50 text-rose-600 text-[10px] !py-0 !px-2">
                              {fails.length} 未通过
                            </span>
                          ) : warns.length > 0 ? (
                            <span className="chip bg-amber-50 text-amber-600 text-[10px] !py-0 !px-2">
                              {warns.length} 警告
                            </span>
                          ) : (
                            <span className="chip bg-emerald-50 text-emerald-600 text-[10px] !py-0 !px-2">
                              全部通过
                            </span>
                          )}
                        </div>
                        {(fails.length > 0 || warns.length > 0) && (
                          <p className="text-xs text-stone-500 mt-1.5">
                            {[...fails.map((x) => `${x}(未通过)`), ...warns.map((x) => `${x}(警告)`)].join('、')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {Object.keys(sensitiveGroups).length > 0 && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                      <p className="text-xs font-semibold text-rose-700 mb-1.5">敏感/极限词命中</p>
                      {Object.entries(sensitiveGroups).map(([k, words]) => (
                        <p key={k} className="text-xs text-rose-600">
                          <span className="font-medium">{k}：</span>
                          {words.join('、')}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-stone-800 mb-2.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-brand-500" /> 文件清单
                  {detailRecord.fileManifest?.length > 0 && (
                    <span className="text-xs font-normal text-stone-400 ml-1">
                      共 {detailRecord.fileManifest.length} 个
                    </span>
                  )}
                </h4>
                <div className="max-h-64 overflow-auto rounded-xl border border-stone-100">
                  {(detailRecord.fileManifest || []).length === 0 ? (
                    <div className="p-4 text-sm text-stone-400 text-center">该历史记录未保留文件清单</div>
                  ) : (
                    <ul className="divide-y divide-stone-50">
                      {detailRecord.fileManifest.map((f, i) => (
                        <li
                          key={i}
                          className="px-3 py-1.5 text-xs text-stone-600 flex items-center gap-2 hover:bg-stone-50"
                        >
                          <span className="text-stone-300 w-8 text-right">{i + 1}.</span>
                          <span className="font-mono truncate">{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-100 space-y-4">
              <h4 className="text-sm font-semibold text-stone-800 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-amber-500" /> 运营信息编辑
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> 交付状态
                  </label>
                  <div className="flex gap-2">
                    {(Object.keys(DELIVER_STATUS_META) as Array<keyof typeof DELIVER_STATUS_META>).map((k) => {
                      const meta = DELIVER_STATUS_META[k];
                      const Icon = meta.icon;
                      const active = detailEditingStatus === k;
                      return (
                        <button
                          key={k}
                          onClick={() => setDetailEditingStatus(k as any)}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                            active
                              ? meta.className + ' ring-2 ring-offset-1 ring-brand-200'
                              : 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-100',
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> 运营备注
                  </label>
                  <input
                    type="text"
                    value={detailEditingNote}
                    onChange={(e) => setDetailEditingNote(e.target.value)}
                    placeholder="记录一下这次导出的特殊情况..."
                    className="input-base text-sm py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-2 flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5" /> 发布链接（运营回填真实链接）
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {detailRecord.platforms.map((p) => {
                    const meta = platforms.find((x) => x.key === p);
                    const hasActual = !!detailRecord.scheduleInfo?.platformLinks?.[p]?.actual;
                    return (
                      <div key={p} className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {meta ? <meta.icon className={cn('w-3.5 h-3.5', meta.color)} /> : null}
                          <span className="text-xs font-medium text-stone-700">{meta?.label || p}</span>
                          {hasActual && (
                            <span className="chip bg-emerald-50 text-emerald-600 text-[9px] !py-0 !px-1.5">
                              已发布
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={detailLocalLinks[p] || ''}
                          onChange={(e) =>
                            setDetailLocalLinks((prev) => ({ ...prev, [p]: e.target.value }))
                          }
                          placeholder="https://..."
                          className="input-base text-xs py-1.5"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={detailSaving}
                  className={cn(
                    'btn-amber flex items-center gap-1.5 px-5 py-2 text-sm',
                    detailSaving && 'opacity-70',
                  )}
                >
                  {detailSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  保存运营信息
                </button>
              </div>
            </div>
          </div>
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
          <div className="flex items-center gap-2 flex-wrap">
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
            <select
              value={exportStatusFilter}
              onChange={(e) => setExportStatusFilter(e.target.value)}
              className="input-base text-sm py-2 pr-8"
            >
              <option value="all">全部状态</option>
              <option value="draft">草稿</option>
              <option value="delivered">已交付</option>
              <option value="published">已发布</option>
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
              const completeness = isExportRecordComplete(record.id);
              const statusMeta = DELIVER_STATUS_META[record.deliverStatus || 'draft'];
              const StatusIcon = statusMeta.icon;

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
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-stone-800 truncate">{record.taskTitle}</p>
                      {isCurrentTask && (
                        <span className="chip bg-brand-50 text-brand-700 text-[10px] !py-0 !px-2">当前任务</span>
                      )}
                      <span className={cn('chip text-[10px] !py-0 !px-2', statusMeta.className)}>
                        <StatusIcon className="w-3 h-3" />
                        {statusMeta.label}
                      </span>
                      {!completeness.ok && (
                        <span className="chip bg-rose-50 text-rose-600 text-[10px] !py-0 !px-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> 快照不完整
                        </span>
                      )}
                      {record.scheduleInfo?.operator && (
                        <span className="chip bg-amber-50 text-amber-700 text-[10px] !py-0 !px-2">
                          <User className="w-3 h-3 mr-1" />
                          {record.scheduleInfo.operator}
                        </span>
                      )}
                      {record.passRate >= 90 ? (
                        <span className="chip bg-emerald-50 text-emerald-600 text-[10px] !py-0 !px-2">通过</span>
                      ) : record.passRate >= 70 ? (
                        <span className="chip bg-amber-50 text-amber-600 text-[10px] !py-0 !px-2">警告</span>
                      ) : (
                        <span className="chip bg-rose-50 text-rose-600 text-[10px] !py-0 !px-2">未通过</span>
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
                      {record.operatorNote && (
                        <span className="flex items-center gap-1 max-w-xs truncate" title={record.operatorNote}>
                          <Info className="w-3 h-3" />
                          {record.operatorNote}
                        </span>
                      )}
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
                      onClick={() => setDetailRecordId(record.id)}
                      className="p-2 rounded-xl text-stone-500 hover:text-brand-600 hover:bg-brand-50 transition-all"
                      title="查看详情"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <button
                      disabled={downloadingId === record.id}
                      onClick={async () => {
                        setDownloadError(null);
                        setDownloadingId(record.id);
                        try {
                          const result = await downloadExportRecord(record.id);
                          if (result && !result.ok) {
                            setDownloadError(result.reason || '下载失败，请重新导出');
                          }
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
                      title={!completeness.ok ? '该记录快照不完整，建议重新导出' : '重新下载原始内容快照'}
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
      {renderDetailModal()}
    </div>
  );
}
