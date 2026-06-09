import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import type { Highlight } from '../../shared/types';
import {
  Search,
  Plus,
  Heart,
  Trash2,
  Play,
  Pause,
  Quote,
  User,
  Clock,
  X,
  Sparkles,
  Filter,
} from 'lucide-react';
import { cn } from '../lib/utils';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type FilterType = 'all' | 'favorite';

export default function HighlightsPage() {
  const { currentTaskId, highlights, toggleFavorite, addHighlight, removeHighlight } = useStore();
  const taskHighlights = currentTaskId ? highlights[currentTaskId] || [] : [];

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newHighlight, setNewHighlight] = useState({
    text: '',
    startTime: 0,
    speaker: '',
  });

  const filteredHighlights = useMemo(() => {
    let result = taskHighlights;
    if (filterType === 'favorite') {
      result = result.filter((h) => h.isFavorite);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (h) =>
          h.text.toLowerCase().includes(q) ||
          h.speaker.toLowerCase().includes(q),
      );
    }
    return result;
  }, [taskHighlights, filterType, searchQuery]);

  const handleToggleFavorite = (id: string) => {
    if (!currentTaskId) return;
    toggleFavorite(currentTaskId, id);
  };

  const handleRemove = (id: string) => {
    if (!currentTaskId) return;
    removeHighlight(currentTaskId, id);
  };

  const handleTogglePlay = (id: string) => {
    setPlayingId(playingId === id ? null : id);
  };

  const handleOpenModal = () => {
    setNewHighlight({ text: '', startTime: 0, speaker: '' });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setNewHighlight({ text: '', startTime: 0, speaker: '' });
  };

  const handleAddHighlight = () => {
    if (!currentTaskId || !newHighlight.text.trim() || !newHighlight.speaker.trim()) return;
    addHighlight(currentTaskId, {
      text: newHighlight.text.trim(),
      startTime: newHighlight.startTime,
      speaker: newHighlight.speaker.trim(),
    });
    handleCloseModal();
  };

  const { column1, column2, column3 } = useMemo(() => {
    const c1: Highlight[] = [];
    const c2: Highlight[] = [];
    const c3: Highlight[] = [];
    filteredHighlights.forEach((h, i) => {
      if (i % 3 === 0) c1.push(h);
      else if (i % 3 === 1) c2.push(h);
      else c3.push(h);
    });
    return { column1: c1, column2: c2, column3: c3 };
  }, [filteredHighlights]);

  const renderCard = (highlight: Highlight) => {
    const isPlaying = playingId === highlight.id;
    return (
      <div
        key={highlight.id}
        className={cn(
          'glass-card p-5 transition-all duration-300',
          'hover:scale-[1.02] hover:shadow-xl cursor-pointer group',
          highlight.isFavorite && 'ring-2 ring-amber-400/50',
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-amber flex items-center justify-center shadow-md">
            <Quote className="w-5 h-5 text-brand-900" />
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTogglePlay(highlight.id);
              }}
              className={cn(
                'p-2 rounded-full transition-colors',
                isPlaying
                  ? 'bg-amber-100 text-amber-600'
                  : 'hover:bg-stone-100 text-stone-400 hover:text-stone-600',
              )}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite(highlight.id);
              }}
              className={cn(
                'p-2 rounded-full transition-colors',
                highlight.isFavorite
                  ? 'bg-amber-100 text-amber-500'
                  : 'hover:bg-stone-100 text-stone-400 hover:text-amber-500',
              )}
            >
              <Heart
                className="w-4 h-4"
                fill={highlight.isFavorite ? 'currentColor' : 'none'}
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(highlight.id);
              }}
              className="p-2 rounded-full hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-stone-700 leading-relaxed mb-4 font-medium">
          "{highlight.text}"
        </p>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="chip bg-brand-50 text-brand-700 border border-brand-200">
              <User className="w-3 h-3" />
              {highlight.speaker}
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs text-stone-400">
            <Clock className="w-3 h-3" />
            {formatTime(highlight.startTime)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="glass-card p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-stone-800">金句亮点</h2>
            <span className="chip bg-amber-50 text-amber-700 border border-amber-200 ml-2">
              共 {filteredHighlights.length} 条
            </span>
          </div>

          <div className="flex items-center gap-3 flex-1 justify-end flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索金句或说话人..."
                className="input-base pl-9 w-64 text-sm"
              />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-full bg-stone-100">
              <button
                onClick={() => setFilterType('all')}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                  filterType === 'all'
                    ? 'bg-white text-stone-800 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700',
                )}
              >
                全部
              </button>
              <button
                onClick={() => setFilterType('favorite')}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5',
                  filterType === 'favorite'
                    ? 'bg-white text-amber-600 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700',
                )}
              >
                <Heart className="w-3.5 h-3.5" fill={filterType === 'favorite' ? 'currentColor' : 'none'} />
                收藏
              </button>
            </div>

            <button
              onClick={handleOpenModal}
              className="btn-amber flex items-center gap-2 text-sm py-2 px-4"
            >
              <Plus className="w-4 h-4" />
              添加亮点
            </button>
          </div>
        </div>
      </div>

      {filteredHighlights.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-stone-100 flex items-center justify-center">
              <Filter className="w-8 h-8 text-stone-400" />
            </div>
            <p className="text-stone-500 font-medium">暂无匹配的金句</p>
            <p className="text-stone-400 text-sm mt-1">尝试调整筛选条件或添加新亮点</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            <div className="flex flex-col gap-4">
              {column1.map(renderCard)}
            </div>
            <div className="flex flex-col gap-4">
              {column2.map(renderCard)}
            </div>
            <div className="flex flex-col gap-4">
              {column3.map(renderCard)}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-amber flex items-center justify-center">
                  <Plus className="w-5 h-5 text-brand-900" />
                </div>
                <h3 className="text-lg font-semibold text-stone-800">添加新亮点</h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  金句文本
                </label>
                <textarea
                  value={newHighlight.text}
                  onChange={(e) => setNewHighlight({ ...newHighlight, text: e.target.value })}
                  className="input-base resize-none h-28"
                  placeholder="输入金句内容..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    说话人
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      value={newHighlight.speaker}
                      onChange={(e) => setNewHighlight({ ...newHighlight, speaker: e.target.value })}
                      className="input-base pl-9"
                      placeholder="如：李明远"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    时间戳（秒）
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="number"
                      min={0}
                      value={newHighlight.startTime}
                      onChange={(e) =>
                        setNewHighlight({
                          ...newHighlight,
                          startTime: Math.max(0, parseInt(e.target.value) || 0),
                        })
                      }
                      className="input-base pl-9"
                      placeholder="如：120"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={handleCloseModal} className="btn-secondary">
                取消
              </button>
              <button
                onClick={handleAddHighlight}
                className="btn-amber"
                disabled={!newHighlight.text.trim() || !newHighlight.speaker.trim()}
              >
                添加亮点
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
