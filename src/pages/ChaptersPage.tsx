import { useState, useRef, useMemo } from 'react';
import { useStore } from '../store/useStore';
import type { Chapter } from '../../shared/types';
import {
  Clock,
  Edit3,
  Plus,
  Trash2,
  GripVertical,
  Tag,
  FileText,
  Check,
  X,
  Hash,
  Play,
  Pause,
} from 'lucide-react';
import { cn } from '../lib/utils';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const gradientColors = [
  'from-amber-400 to-orange-500',
  'from-amber-500 to-amber-600',
  'from-orange-400 to-amber-500',
  'from-amber-300 to-amber-500',
  'from-yellow-400 to-amber-500',
  'from-orange-500 to-red-500',
];

export default function ChaptersPage() {
  const { currentTaskId, chapters, updateChapter, addChapter, deleteChapter, updateChapters } = useStore();
  const taskChapters = currentTaskId ? chapters[currentTaskId] || [] : [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Chapter>>({});
  const [newKeyword, setNewKeyword] = useState('');
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [playingChapter, setPlayingChapter] = useState<string | null>(null);

  const totalDuration = useMemo(() => {
    if (taskChapters.length === 0) return 0;
    return taskChapters[taskChapters.length - 1].endTime;
  }, [taskChapters]);

  const handleStartEdit = (chapter: Chapter) => {
    setEditingId(chapter.id);
    setEditData({
      title: chapter.title,
      keywords: [...chapter.keywords],
      summary: chapter.summary,
    });
    setNewKeyword('');
  };

  const handleSaveEdit = (id: string) => {
    if (!currentTaskId) return;
    updateChapter(currentTaskId, id, editData);
    setEditingId(null);
    setEditData({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim() || !editData.keywords) return;
    if (!editData.keywords.includes(newKeyword.trim())) {
      setEditData({ ...editData, keywords: [...editData.keywords, newKeyword.trim()] });
    }
    setNewKeyword('');
  };

  const handleRemoveKeyword = (kw: string) => {
    if (!editData.keywords) return;
    setEditData({ ...editData, keywords: editData.keywords.filter((k) => k !== kw) });
  };

  const handleAddChapter = () => {
    if (!currentTaskId || taskChapters.length === 0) return;
    const lastChapter = taskChapters[taskChapters.length - 1];
    const mid = (lastChapter.startTime + lastChapter.endTime) / 2;
    const newId = 'ch-' + Date.now();

    updateChapter(currentTaskId, lastChapter.id, { endTime: mid });

    const newChapter: Chapter = {
      id: newId,
      title: '新章节',
      startTime: mid,
      endTime: lastChapter.endTime,
      keywords: [],
      summary: '',
    };

    addChapter(currentTaskId, newChapter);
  };

  const handleDeleteChapter = (id: string) => {
    if (!currentTaskId) return;
    deleteChapter(currentTaskId, id);
  };

  const handleDragStart = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingIndex(index);
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (draggingIndex === null || !timelineRef.current || !currentTaskId) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const newTime = ratio * totalDuration;

    const set = useStore.getState();
    const list = [...(set.chapters[currentTaskId] || [])];
    if (draggingIndex < 0 || draggingIndex >= list.length - 1) return;

    const prev = list[draggingIndex];
    const next = list[draggingIndex + 1];
    const clamped = Math.max(prev.startTime + 30, Math.min(next.endTime - 30, newTime));

    list[draggingIndex] = { ...prev, endTime: clamped };
    list[draggingIndex + 1] = { ...next, startTime: clamped };

    useStore.setState({
      chapters: { ...set.chapters, [currentTaskId]: list },
    });
  };

  const handleDragEnd = () => {
    if (currentTaskId && draggingIndex !== null) {
      const state = useStore.getState();
      const current = state.chapters[currentTaskId] || [];
      updateChapters(currentTaskId, [...current]);
    }
    setDraggingIndex(null);
  };

  const togglePlay = (id: string) => {
    setPlayingChapter(playingChapter === id ? null : id);
  };

  if (taskChapters.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-stone-500">暂无章节数据</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-800">章节时间轴</h2>
            <p className="text-sm text-stone-500 mt-1">拖拽分割线调整章节边界</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Clock className="w-4 h-4" />
            总时长：{formatTime(totalDuration)}
          </div>
        </div>

        <div
          ref={timelineRef}
          className="relative h-20 rounded-xl overflow-hidden bg-stone-100 select-none"
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          <div className="flex h-full">
            {taskChapters.map((chapter, idx) => {
              const width =
                totalDuration > 0
                  ? ((chapter.endTime - chapter.startTime) / totalDuration) * 100
                  : 100 / taskChapters.length;
              const gradient = gradientColors[idx % gradientColors.length];
              return (
                <div
                  key={chapter.id}
                  className={cn(
                    'relative h-full bg-gradient-to-r transition-all duration-200',
                    gradient,
                    'flex items-center justify-center px-2',
                  )}
                  style={{ width: `${width}%` }}
                >
                  <div className="text-center min-w-0">
                    <div className="text-white text-xs font-semibold truncate drop-shadow">
                      {chapter.title}
                    </div>
                    <div className="text-white/80 text-[10px] mt-0.5">
                      {formatTime(chapter.endTime - chapter.startTime)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {taskChapters.map((_, idx) => {
            if (idx >= taskChapters.length - 1) return null;
            const chapter = taskChapters[idx];
            const left =
              totalDuration > 0 ? ((chapter.endTime - 0) / totalDuration) * 100 : 0;
            return (
              <div
                key={`divider-${idx}`}
                className={cn(
                  'absolute top-0 bottom-0 w-1 -ml-0.5 cursor-ew-resize group',
                  draggingIndex === idx ? 'z-20' : 'z-10',
                )}
                style={{ left: `${left}%` }}
                onMouseDown={(e) => handleDragStart(idx, e)}
              >
                <div
                  className={cn(
                    'h-full w-0.5 bg-white/90 transition-all group-hover:w-1 mx-auto',
                    draggingIndex === idx && 'w-1 bg-white shadow-lg',
                  )}
                />
                <div
                  className={cn(
                    'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                    'w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center',
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    draggingIndex === idx && 'opacity-100',
                  )}
                >
                  <GripVertical className="w-3.5 h-3.5 text-amber-600" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between mt-2 text-xs text-stone-400">
          <span>{formatTime(0)}</span>
          <span>{formatTime(totalDuration / 2)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-800">章节列表</h2>
        <button
          onClick={handleAddChapter}
          className="btn-amber flex items-center gap-2 text-sm py-2 px-4"
        >
          <Plus className="w-4 h-4" />
          新增章节
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-4 pb-4">
        {taskChapters.map((chapter, idx) => {
          const isEditing = editingId === chapter.id;
          const duration = chapter.endTime - chapter.startTime;
          const wordCount = chapter.summary.length;
          const gradient = gradientColors[idx % gradientColors.length];
          const isPlaying = playingChapter === chapter.id;

          return (
            <div
              key={chapter.id}
              className="glass-card p-5 card-hover relative overflow-hidden"
            >
              <div
                className={cn(
                  'absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b',
                  gradient,
                )}
              />

              <div className="ml-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.title || ''}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        className="w-full input-base text-lg font-semibold text-stone-800"
                        placeholder="章节标题"
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold',
                            gradient,
                          )}
                        >
                          {idx + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-stone-800 truncate">
                          {chapter.title}
                        </h3>
                        <button
                          onClick={() => togglePlay(chapter.id)}
                          className="p-1.5 rounded-full hover:bg-amber-50 text-amber-600 transition-colors"
                        >
                          {isPlaying ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current" />
                          )}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-sm text-stone-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(chapter.startTime)} - {formatTime(chapter.endTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" />
                        {formatTime(duration)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {wordCount} 字
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(chapter.id)}
                          className="p-2 rounded-full bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(chapter)}
                          className="p-2 rounded-full hover:bg-amber-50 text-amber-600 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteChapter(chapter.id)}
                          className="p-2 rounded-full hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors"
                          disabled={taskChapters.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-stone-700">关键词</span>
                  </div>
                  {isEditing ? (
                    <div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(editData.keywords || []).map((kw) => (
                          <span
                            key={kw}
                            className="chip bg-amber-100 text-amber-700 group"
                          >
                            {kw}
                            <button
                              onClick={() => handleRemoveKeyword(kw)}
                              className="ml-1 opacity-50 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddKeyword();
                            }
                          }}
                          className="input-base text-sm py-2 flex-1"
                          placeholder="输入关键词后回车添加"
                        />
                        <button
                          onClick={handleAddKeyword}
                          className="btn-secondary py-2 px-4 text-sm"
                        >
                          添加
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {chapter.keywords.length > 0 ? (
                        chapter.keywords.map((kw) => (
                          <span key={kw} className="chip bg-amber-50 text-amber-700 border border-amber-200">
                            {kw}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-stone-400">暂无关键词</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-stone-700">章节摘要</span>
                  </div>
                  {isEditing ? (
                    <textarea
                      value={editData.summary || ''}
                      onChange={(e) => setEditData({ ...editData, summary: e.target.value })}
                      className="input-base text-sm resize-none h-28"
                      placeholder="输入章节摘要..."
                    />
                  ) : (
                    <p className="text-sm text-stone-600 leading-relaxed">
                      {chapter.summary || '暂无摘要'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
