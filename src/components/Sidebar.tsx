import {
  Upload,
  FileCheck2,
  Scissors,
  Sparkles,
  FileText,
  Rocket,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: '导入任务', path: '/tasks', icon: Upload },
  { label: '转写校对', path: '/transcript', icon: FileCheck2 },
  { label: '章节切分', path: '/chapters', icon: Scissors },
  { label: '亮点提取', path: '/highlights', icon: Sparkles },
  { label: '文案生成', path: '/copy', icon: FileText },
  { label: '发布检查', path: '/publish', icon: Rocket },
];

interface SidebarProps {
  activeRoute: string;
  onNavigate: (path: string) => void;
}

export default function Sidebar({ activeRoute, onNavigate }: SidebarProps) {
  return (
    <aside className="flex h-screen w-64 flex-col bg-brand-950 border-r border-brand-800/50">
      <div className="px-6 py-8">
        <h1 className="font-display text-3xl font-bold text-white tracking-wide">
          Pod<span className="text-amber-400">Forge</span>
        </h1>
        <p className="mt-1 text-sm text-brand-300/60">播客AI整理平台</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map(({ label, path, icon: Icon }) => {
          const isActive = activeRoute === path;
          return (
            <button
              key={path}
              onClick={() => onNavigate(path)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left',
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/5'
                  : 'text-brand-200/70 hover:text-white hover:bg-brand-800/40 border border-transparent'
              )}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className={cn(isActive && 'text-amber-400')}
              />
              <span className="font-medium text-sm">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-800/60 to-brand-900/60 backdrop-blur-sm border border-brand-700/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <User size={20} className="text-brand-950" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">创作者</p>
              <p className="text-xs text-brand-300/60 truncate">creator@podforge.ai</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
