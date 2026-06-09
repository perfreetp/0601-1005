import { useState } from 'react';
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
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import type { CheckStatus } from '../../shared/types';

const platforms = [
  { key: 'xiaoyuzhou', label: '小宇宙', icon: Radio, color: 'text-orange-500' },
  { key: 'ximalaya', label: '喜马拉雅', icon: Podcast, color: 'text-red-500' },
  { key: 'official', label: '公众号', icon: BookOpen, color: 'text-emerald-600' },
  { key: 'xiaohongshu', label: '小红书', icon: Heart, color: 'text-rose-500' },
];

export default function ChecklistPage() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(['xiaoyuzhou', 'ximalaya']),
  );
  const [isRunning, setIsRunning] = useState(false);

  const { checklists, currentTaskId, runChecklist } = useStore();
  const taskId = currentTaskId || 'task-002';
  const items = checklists[taskId] || [];

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

      <div className="grid grid-cols-4 gap-4 mb-6">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const isSelected = selectedPlatforms.has(platform.key);
          return (
            <label
              key={platform.key}
              className={cn(
                'flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200',
                isSelected
                  ? 'border-brand-500 bg-brand-50/50'
                  : 'border-stone-200 bg-white hover:border-brand-300',
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => togglePlatform(platform.key)}
                className="accent-brand-600 w-4 h-4"
              />
              <Icon className={cn('w-5 h-5', platform.color)} />
              <span className="text-sm font-medium text-stone-700">{platform.label}</span>
            </label>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-stone-100">
        <div className="text-sm text-stone-500">
          已选择 <span className="font-semibold text-brand-700">{selectedPlatforms.size}</span> 个平台
        </div>
        <button
          disabled={selectedPlatforms.size === 0}
          className={cn(
            'btn-primary flex items-center gap-2',
            selectedPlatforms.size === 0 && 'opacity-50 cursor-not-allowed',
          )}
        >
          <FileArchive className="w-4 h-4" />
          导出 ZIP 包
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-4xl mx-auto">
        {renderHeader()}
        {renderStats()}
        {renderChecklist()}
        {renderExport()}
      </div>
    </div>
  );
}
