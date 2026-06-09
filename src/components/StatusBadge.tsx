import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { TaskStatus } from '../../shared/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: TaskStatus;
}

const statusConfig: Record<
  TaskStatus,
  {
    label: string;
    icon: React.ElementType;
    className: string;
    iconClassName: string;
  }
> = {
  pending: {
    label: '等待中',
    icon: Clock,
    className: 'bg-stone-500/10 text-stone-400 border-stone-500/30',
    iconClassName: 'text-stone-400',
  },
  processing: {
    label: '处理中',
    icon: Loader2,
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    iconClassName: 'text-blue-400 animate-spin',
  },
  completed: {
    label: '已完成',
    icon: CheckCircle2,
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    iconClassName: 'text-emerald-400',
  },
  failed: {
    label: '失败',
    icon: XCircle,
    className: 'bg-red-500/10 text-red-400 border-red-500/30',
    iconClassName: 'text-red-400',
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm',
        config.className
      )}
    >
      <Icon size={14} className={config.iconClassName} strokeWidth={2.5} />
      {config.label}
    </span>
  );
}
