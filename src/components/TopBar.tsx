import { ChevronRight } from 'lucide-react';
import type { Task } from '../../shared/types';
import StepProgress from './StepProgress';
import StatusBadge from './StatusBadge';
import { cn } from '@/lib/utils';

const defaultSteps = [
  '导入任务',
  '转写校对',
  '章节切分',
  '亮点提取',
  '文案生成',
  '发布检查',
];

interface TopBarProps {
  task?: Task;
  currentStep: number;
  breadcrumb: string[];
}

export default function TopBar({ task, currentStep, breadcrumb }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-brand-950/80 backdrop-blur-xl border-b border-brand-800/40">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <nav className="flex items-center gap-1.5 text-sm">
              {breadcrumb.map((item, idx) => (
                <span key={idx} className="flex items-center gap-1.5">
                  {idx > 0 && (
                    <ChevronRight size={14} className="text-brand-400/50" />
                  )}
                  <span
                    className={cn(
                      idx === breadcrumb.length - 1
                        ? 'text-white font-medium'
                        : 'text-brand-300/60'
                    )}
                  >
                    {item}
                  </span>
                </span>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-white">
                {breadcrumb[breadcrumb.length - 1]}
              </h2>
              {task && (
                <div className="flex items-center gap-3">
                  <span className="text-brand-400/50">·</span>
                  <span className="text-sm text-brand-200/80">{task.title}</span>
                  <StatusBadge status={task.status} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <StepProgress currentStep={currentStep} steps={defaultSteps} />
        </div>
      </div>
    </header>
  );
}
