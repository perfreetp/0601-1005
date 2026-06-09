import { useState } from 'react';
import {
  Type,
  FileText,
  ListOrdered,
  Share2,
  Image,
  Sparkles,
  BookOpen,
  AlertTriangle,
  ArrowRightLeft,
  Settings2,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Palette,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import type { CopyContent } from '../../shared/types';

type TabType = 'titles' | 'summary' | 'shownotes' | 'social' | 'cover';
type SocialPlatform = 'xiaohongshu' | 'weibo' | 'official';

const tabItems: { key: TabType; label: string; icon: typeof Type }[] = [
  { key: 'titles', label: '标题', icon: Type },
  { key: 'summary', label: '摘要', icon: FileText },
  { key: 'shownotes', label: 'Shownotes', icon: ListOrdered },
  { key: 'social', label: '社媒', icon: Share2 },
  { key: 'cover', label: '封面词', icon: Image },
];

const socialPlatforms: { key: SocialPlatform; label: string; style: string }[] = [
  { key: 'xiaohongshu', label: '小红书', style: 'emoji' },
  { key: 'weibo', label: '微博', style: 'short' },
  { key: 'official', label: '公众号', style: 'long' },
];

const coverColors = [
  { name: '深蓝紫渐变', gradient: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #6366f1 100%)' },
  { name: '琥珀暖金', gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #fcd34d 100%)' },
  { name: '森林墨绿', gradient: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)' },
  { name: '玫瑰绯红', gradient: 'linear-gradient(135deg, #881337 0%, #be123c 50%, #f43f5e 100%)' },
];

const mockTerms = [
  { id: 't1', original: '最好的', replacement: '优质的', category: 'sensitive' as const },
  { id: 't2', original: '第一', replacement: '领先的', category: 'sensitive' as const },
  { id: 't3', original: '绝对', replacement: '相对', category: 'sensitive' as const },
  { id: 't4', original: '客户关系管理', replacement: 'CRM', category: 'term' as const },
  { id: 't5', original: '最小可行性产品', replacement: 'MVP', category: 'term' as const },
  { id: 't6', original: '人工智能', replacement: 'AI', category: 'term' as const },
];

export default function CopywritingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('titles');
  const [activeSocial, setActiveSocial] = useState<SocialPlatform>('xiaohongshu');
  const [selectedTitle, setSelectedTitle] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [termCategory, setTermCategory] = useState<'sensitive' | 'term'>('sensitive');
  const [regenerating, setRegenerating] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);

  const { copies, currentTaskId, regenerateCopy, updateCopyField } = useStore();
  const copy: CopyContent | undefined = currentTaskId ? copies[currentTaskId] : undefined;
  const taskId = currentTaskId || 'task-002';
  const copyData = copy || copies['task-002'];

  const handleRegenerate = async () => {
    setRegenerating(true);
    await regenerateCopy(taskId, activeTab);
    setTimeout(() => setRegenerating(false), 800);
  };

  const handleReplaceAll = () => {
    if (!copyData) return;
    let newSummary = copyData.summary;
    let newShownotes = copyData.shownotes;
    let newSocialPosts = { ...copyData.socialPosts };

    mockTerms.forEach((term) => {
      const regex = new RegExp(term.original, 'g');
      newSummary = newSummary.replace(regex, term.replacement);
      newShownotes = newShownotes.replace(regex, term.replacement);
      newSocialPosts = {
        xiaohongshu: newSocialPosts.xiaohongshu.replace(regex, term.replacement),
        weibo: newSocialPosts.weibo.replace(regex, term.replacement),
        official: newSocialPosts.official.replace(regex, term.replacement),
      };
    });

    updateCopyField(taskId, 'summary', newSummary);
    updateCopyField(taskId, 'shownotes', newShownotes);
    updateCopyField(taskId, 'socialPosts', newSocialPosts);
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-500" />
          文案生成中心
        </h1>
        <p className="text-sm text-stone-500 mt-1">AI 辅助生成多平台分发文案</p>
      </div>
      <button
        onClick={() => setDrawerOpen(true)}
        className="btn-secondary flex items-center gap-2"
      >
        <Settings2 className="w-4 h-4" />
        术语管理
      </button>
    </div>
  );

  const renderTabs = () => (
    <div className="flex gap-1 p-1 bg-stone-100 rounded-2xl w-fit mb-6">
      {tabItems.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-stone-500 hover:text-stone-700',
            )}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  const renderRegenerateBtn = () => (
    <button
      onClick={handleRegenerate}
      disabled={regenerating}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
        regenerating
          ? 'bg-brand-100 text-brand-600 cursor-not-allowed'
          : 'bg-gradient-brand text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
      )}
    >
      {regenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <RefreshCw className="w-4 h-4" />
      )}
      AI 重新生成
    </button>
  );

  const renderTitles = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-800">标题变体</h2>
        {renderRegenerateBtn()}
      </div>
      <div className="space-y-3">
        {copyData?.titles.map((title, idx) => (
          <label
            key={idx}
            className={cn(
              'flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200',
              selectedTitle === idx
                ? 'border-brand-500 bg-brand-50/50'
                : 'border-stone-200 bg-white hover:border-brand-300',
            )}
          >
            <input
              type="radio"
              name="title"
              checked={selectedTitle === idx}
              onChange={() => setSelectedTitle(idx)}
              className="mt-1 accent-brand-600"
            />
            <div className="flex-1">
              <textarea
                value={title}
                onChange={(e) => {
                  const newTitles = [...copyData.titles];
                  newTitles[idx] = e.target.value;
                  updateCopyField(taskId, 'titles', newTitles);
                }}
                className="w-full bg-transparent text-base font-medium text-stone-800 resize-none outline-none leading-relaxed"
                rows={2}
              />
            </div>
            {selectedTitle === idx && (
              <CheckCircle2 className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
            )}
          </label>
        ))}
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-800">内容摘要</h2>
        {renderRegenerateBtn()}
      </div>
      <div className="glass-card p-5">
        <textarea
          value={copyData?.summary || ''}
          onChange={(e) => updateCopyField(taskId, 'summary', e.target.value)}
          className="w-full min-h-[240px] bg-transparent text-stone-700 leading-relaxed resize-none outline-none text-[15px]"
          placeholder="AI 生成的节目摘要..."
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
          <span className="text-xs text-stone-400">
            {copyData?.summary?.length || 0} 字
          </span>
          <span className="chip bg-brand-50 text-brand-700">
            <BookOpen className="w-3 h-3" />
            建议 300-500 字
          </span>
        </div>
      </div>
    </div>
  );

  const renderShownotes = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-800">Shownotes</h2>
        {renderRegenerateBtn()}
      </div>
      <div className="glass-card p-5">
        <div className="prose prose-sm max-w-none">
          {(copyData?.shownotes || '').split('\n').map((line, idx) => {
            if (line.startsWith('## ')) {
              return (
                <h3 key={idx} className="text-base font-semibold text-brand-700 mt-4 mb-2 first:mt-0">
                  {line.replace('## ', '')}
                </h3>
              );
            }
            if (line.startsWith('- ')) {
              return (
                <div key={idx} className="flex items-start gap-2 ml-2 text-stone-600 text-sm py-1">
                  <span className="text-amber-500 mt-1">•</span>
                  <input
                    type="text"
                    value={line.replace('- ', '')}
                    onChange={(e) => {
                      const lines = (copyData?.shownotes || '').split('\n');
                      lines[idx] = `- ${e.target.value}`;
                      updateCopyField(taskId, 'shownotes', lines.join('\n'));
                    }}
                    className="flex-1 bg-transparent outline-none"
                  />
                </div>
              );
            }
            if (line.match(/^\d+\./)) {
              const match = line.match(/^(\d+)\.\s*(.*)/);
              if (match) {
                return (
                  <div key={idx} className="flex items-start gap-2 ml-2 text-stone-600 text-sm py-1">
                    <span className="text-brand-600 font-medium text-xs mt-0.5">{match[1]}.</span>
                    <input
                      type="text"
                      value={match[2]}
                      onChange={(e) => {
                        const lines = (copyData?.shownotes || '').split('\n');
                        lines[idx] = `${match[1]}. ${e.target.value}`;
                        updateCopyField(taskId, 'shownotes', lines.join('\n'));
                      }}
                      className="flex-1 bg-transparent outline-none"
                    />
                  </div>
                );
              }
            }
            if (line.trim() === '') {
              return <div key={idx} className="h-2" />;
            }
            return (
              <p key={idx} className="text-sm text-stone-600 leading-relaxed py-1">
                {line}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderSocial = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-800">社交媒体文案</h2>
        {renderRegenerateBtn()}
      </div>
      <div className="flex gap-2 mb-4">
        {socialPlatforms.map((platform) => {
          const isActive = activeSocial === platform.key;
          return (
            <button
              key={platform.key}
              onClick={() => setActiveSocial(platform.key)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
              )}
            >
              {platform.label}
              {platform.style === 'emoji' && <span className="ml-1">✨</span>}
              {platform.style === 'short' && <span className="ml-1 text-xs">短</span>}
              {platform.style === 'long' && <span className="ml-1 text-xs">长</span>}
            </button>
          );
        })}
      </div>
      <div className="glass-card p-5">
        {activeSocial === 'xiaohongshu' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-rose-500 mb-2">
              <span>✨</span>
              <span>小红书风格 · Emoji 丰富 · 口语化</span>
            </div>
            <textarea
              value={copyData?.socialPosts.xiaohongshu || ''}
              onChange={(e) =>
                updateCopyField(taskId, 'socialPosts', {
                  ...copyData!.socialPosts,
                  xiaohongshu: e.target.value,
                })
              }
              className="w-full min-h-[280px] bg-transparent text-stone-700 leading-relaxed resize-none outline-none text-[15px]"
            />
          </div>
        )}
        {activeSocial === 'weibo' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-sky-500 mb-2">
              <span>💬</span>
              <span>微博风格 · 简短有力 · 话题标签</span>
            </div>
            <textarea
              value={copyData?.socialPosts.weibo || ''}
              onChange={(e) =>
                updateCopyField(taskId, 'socialPosts', {
                  ...copyData!.socialPosts,
                  weibo: e.target.value,
                })
              }
              className="w-full min-h-[200px] bg-transparent text-stone-700 leading-relaxed resize-none outline-none text-[15px]"
            />
            <div className="text-xs text-stone-400 text-right">
              {copyData?.socialPosts.weibo?.length || 0} / 140 字
            </div>
          </div>
        )}
        {activeSocial === 'official' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-emerald-600 mb-2">
              <span>📝</span>
              <span>公众号风格 · 正式专业 · 结构完整</span>
            </div>
            <textarea
              value={copyData?.socialPosts.official || ''}
              onChange={(e) =>
                updateCopyField(taskId, 'socialPosts', {
                  ...copyData!.socialPosts,
                  official: e.target.value,
                })
              }
              className="w-full min-h-[320px] bg-transparent text-stone-700 leading-relaxed resize-none outline-none text-[15px]"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderCover = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-800">封面提示词</h2>
        {renderRegenerateBtn()}
      </div>
      <div className="grid grid-cols-5 gap-5">
        <div className="col-span-3 glass-card p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm text-stone-600 mb-2">
            <Palette className="w-4 h-4 text-brand-500" />
            <span>AI 生图提示词</span>
          </div>
          <textarea
            value={copyData?.coverPrompt || ''}
            onChange={(e) => updateCopyField(taskId, 'coverPrompt', e.target.value)}
            className="w-full min-h-[200px] bg-transparent text-stone-700 leading-relaxed resize-none outline-none text-[15px]"
            placeholder="描述你想要的封面设计..."
          />
          <div className="space-y-3 pt-3 border-t border-stone-100">
            <p className="text-sm font-medium text-stone-700">配色方案</p>
            <div className="grid grid-cols-4 gap-3">
              {coverColors.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedColor(idx)}
                  className={cn(
                    'relative aspect-[4/3] rounded-xl overflow-hidden transition-all duration-200',
                    selectedColor === idx
                      ? 'ring-2 ring-brand-500 ring-offset-2 scale-105'
                      : 'hover:scale-105',
                  )}
                  style={{ background: color.gradient }}
                >
                  {selectedColor === idx && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-stone-500">
              当前选择：{coverColors[selectedColor].name}
            </p>
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-sm font-medium text-stone-700 mb-3">预览</div>
          <div
            className="aspect-square rounded-2xl shadow-2xl relative overflow-hidden"
            style={{ background: coverColors[selectedColor].gradient }}
          >
            <div className="absolute inset-0 bg-grain" />
            <div className="absolute inset-0 flex flex-col justify-between p-6">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white text-2xl font-bold">🎙</span>
              </div>
              <div className="space-y-2">
                <p className="text-white/80 text-xs font-medium">创业者说 EP23</p>
                <p className="text-white font-bold text-lg leading-tight">
                  从0到1打造爆款产品
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <div className="w-8 h-8 rounded-full bg-white/30" />
                  <div>
                    <p className="text-white text-sm font-medium">李明远</p>
                    <p className="text-white/60 text-xs">连续创业者</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDrawer = () => (
    <>
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 animate-fade-in"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-[380px] bg-white z-50 shadow-2xl transition-transform duration-300 flex flex-col',
          drawerOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="p-5 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-stone-900">术语管理</h3>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors"
            >
              <ArrowRightLeft className="w-5 h-5 text-stone-500 rotate-90" />
            </button>
          </div>
          <p className="text-sm text-stone-500 mt-1">管理敏感词和专业术语替换规则</p>
        </div>

        <div className="p-5 border-b border-stone-100">
          <button
            onClick={handleReplaceAll}
            className="w-full btn-amber flex items-center justify-center gap-2"
          >
            <ArrowRightLeft className="w-4 h-4" />
            一键替换全文
          </button>
        </div>

        <div className="flex gap-1 p-1 mx-5 mt-4 bg-stone-100 rounded-xl">
          <button
            onClick={() => setTermCategory('sensitive')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all',
              termCategory === 'sensitive'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-stone-500',
            )}
          >
            <AlertTriangle className="w-4 h-4" />
            敏感词
          </button>
          <button
            onClick={() => setTermCategory('term')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all',
              termCategory === 'term'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-stone-500',
            )}
          >
            <BookOpen className="w-4 h-4" />
            术语库
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
          <div className="space-y-2">
            {mockTerms
              .filter((t) => t.category === termCategory)
              .map((term) => (
                <div
                  key={term.id}
                  className="p-4 rounded-xl bg-stone-50 border border-stone-100"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-md text-xs font-medium',
                        term.category === 'sensitive'
                          ? 'bg-rose-100 text-rose-600 line-through'
                          : 'bg-brand-100 text-brand-700',
                      )}
                    >
                      {term.original}
                    </span>
                    <ArrowRightLeft className="w-3 h-3 text-stone-400" />
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-md text-xs font-medium',
                        term.category === 'sensitive'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700',
                      )}
                    >
                      {term.replacement}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'titles':
        return renderTitles();
      case 'summary':
        return renderSummary();
      case 'shownotes':
        return renderShownotes();
      case 'social':
        return renderSocial();
      case 'cover':
        return renderCover();
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-6xl mx-auto">
        {renderHeader()}
        {renderTabs()}
        <div key={activeTab} className="animate-slide-in">
          {renderContent()}
        </div>
      </div>
      {renderDrawer()}
    </div>
  );
}
