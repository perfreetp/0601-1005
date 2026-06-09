import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Gauge,
  ArrowLeft,
  AlertTriangle,
  Volume2,
  Mic2,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { TranscriptSegment } from '../../shared/types';
import { cn } from '@/lib/utils';

const SPEAKER_COLORS: Record<string, string> = {
  '主持人-林子': 'bg-gradient-to-r from-brand-500 to-brand-600',
  '嘉宾-李明远': 'bg-gradient-to-r from-amber-500 to-amber-600',
};

const SPEAKER_TEXT_COLORS: Record<string, string> = {
  '主持人-林子': 'text-brand-700 bg-brand-50 border-brand-200',
  '嘉宾-李明远': 'text-amber-700 bg-amber-50 border-amber-200',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatTimeFull(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

interface WaveformBarProps {
  height: number;
  isActive: boolean;
}

function WaveformBar({ height, isActive }: WaveformBarProps) {
  return (
    <div
      className={cn(
        'w-1 rounded-full transition-all duration-200',
        isActive ? 'bg-gradient-to-t from-amber-500 to-amber-400' : 'bg-stone-300',
      )}
      style={{ height: `${height}%` }}
    />
  );
}

interface SegmentEditorProps {
  segment: TranscriptSegment;
  taskId: string;
  onUpdate: (taskId: string, segmentId: string, updates: Partial<TranscriptSegment>) => void;
  onToggleMistake: (taskId: string, segmentId: string) => void;
  onSeek: (time: number) => void;
  currentTime: number;
}

function SegmentEditor({
  segment,
  taskId,
  onUpdate,
  onToggleMistake,
  onSeek,
  currentTime,
}: SegmentEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(segment.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const segmentRef = useRef<HTMLDivElement>(null);

  const isActive = currentTime >= segment.startTime && currentTime < segment.endTime;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isActive && segmentRef.current) {
      segmentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isActive]);

  const handleDoubleClick = useCallback(() => {
    setEditText(segment.text);
    setIsEditing(true);
  }, [segment.text]);

  const handleBlur = useCallback(() => {
    if (editText !== segment.text) {
      onUpdate(taskId, segment.id, { text: editText });
    }
    setIsEditing(false);
  }, [editText, segment.text, segment.id, taskId, onUpdate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditText(segment.text);
        setIsEditing(false);
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleBlur();
      }
    },
    [segment.text, handleBlur],
  );

  const speakerBadgeClass =
    SPEAKER_TEXT_COLORS[segment.speaker] ||
    'text-stone-700 bg-stone-100 border-stone-200';

  const speakerBarClass =
    SPEAKER_COLORS[segment.speaker] || 'bg-gradient-to-r from-stone-500 to-stone-600';

  return (
    <div
      ref={segmentRef}
      className={cn(
        'group relative pl-6 pr-4 py-4 rounded-2xl transition-all duration-300',
        isActive
          ? 'bg-gradient-to-r from-amber-50/80 to-transparent border border-amber-200/60 shadow-sm'
          : 'hover:bg-stone-50/50',
      )}
    >
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1 rounded-full opacity-60',
          speakerBarClass,
          isActive && 'opacity-100',
        )}
      />

      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
              speakerBadgeClass,
            )}
          >
            <Mic2 className="w-3 h-3" />
            {segment.speaker}
          </span>
          <button
            onClick={() => onSeek(segment.startTime)}
            className="text-xs text-stone-400 hover:text-brand-600 hover:bg-brand-50 px-2 py-1 rounded-lg transition-all font-mono"
          >
            {formatTime(segment.startTime)}
          </button>
        </div>

        <button
          onClick={() => onToggleMistake(taskId, segment.id)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
            segment.isMistake
              ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
              : 'text-stone-400 hover:text-rose-500 hover:bg-rose-50',
          )}
          title={segment.isMistake ? '取消口误标记' : '标记为口误'}
        >
          <AlertTriangle className={cn('w-3.5 h-3.5', segment.isMistake && 'animate-pulse')} />
          {segment.isMistake ? '口误' : '标记'}
        </button>
      </div>

      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full p-3 rounded-xl border border-brand-300 bg-brand-50/30 text-stone-800 leading-relaxed resize-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition-all"
          rows={Math.ceil(editText.length / 40) + 1}
        />
      ) : (
        <p
          onDoubleClick={handleDoubleClick}
          className={cn(
            'text-stone-700 leading-relaxed cursor-text select-text',
            segment.isMistake && 'squiggle',
          )}
        >
          {segment.text}
        </p>
      )}

      {!isEditing && (
        <p className="text-[11px] text-stone-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          双击编辑 · Ctrl+Enter 保存
        </p>
      )}
    </div>
  );
}

export default function TranscriptPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { transcripts, tasks, updateSegment, toggleMistake } = useStore();

  const task = tasks.find((t) => t.id === taskId);
  const segments = transcripts[taskId || ''] || [];

  const totalDuration = task?.duration || 5400;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const speedMenuRef = useRef<HTMLDivElement>(null);

  const waveformData = useMemo(() => {
    return Array.from({ length: 80 }, () => 20 + Math.random() * 80);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + playbackRate * 0.1;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackRate, totalDuration]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
        setShowSpeedMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSeek = useCallback(
    (time: number) => {
      setCurrentTime(Math.max(0, Math.min(time, totalDuration)));
    },
    [totalDuration],
  );

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      handleSeek(ratio * totalDuration);
    },
    [handleSeek, totalDuration],
  );

  const activeWaveformIndex = Math.floor((currentTime / totalDuration) * waveformData.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-brand-50/30 to-amber-50/40">
      <div className="max-w-[1600px] mx-auto p-6">
        <button
          onClick={() => navigate('/tasks')}
          className="flex items-center gap-2 text-stone-500 hover:text-brand-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回任务列表
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
          <div className="space-y-6">
            <div className="glass-card p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-stone-900 font-display line-clamp-2">
                  {task?.title || '转写工作台'}
                </h2>
                {task && (
                  <p className="text-sm text-stone-500 mt-1">
                    {task.fileName} · {formatFileSize(task.fileSize)}
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-br from-brand-900 to-brand-800 rounded-2xl p-5 text-white">
                <div className="flex items-end justify-center gap-0.5 h-24 mb-5">
                  {waveformData.map((h, i) => (
                    <WaveformBar
                      key={i}
                      height={h}
                      isActive={i <= activeWaveformIndex}
                    />
                  ))}
                </div>

                <div
                  onClick={handleProgressClick}
                  className="h-2 bg-white/20 rounded-full cursor-pointer mb-4 group"
                >
                  <div
                    className="h-full bg-gradient-amber rounded-full relative transition-all"
                    style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="flex items-center justify-between font-mono text-sm text-white/70">
                  <span>{formatTimeFull(currentTime)}</span>
                  <span>{formatTimeFull(totalDuration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => handleSeek(currentTime - 10)}
                  className="p-3 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-800 transition-all"
                  title="后退10秒"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={cn(
                    'p-5 rounded-full transition-all duration-300 shadow-lg',
                    isPlaying
                      ? 'bg-gradient-amber text-brand-900 hover:shadow-xl hover:shadow-amber-500/40 hover:scale-105'
                      : 'bg-gradient-brand text-white hover:shadow-xl hover:shadow-brand-700/40 hover:scale-105',
                  )}
                >
                  {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
                </button>

                <button
                  onClick={() => handleSeek(currentTime + 10)}
                  className="p-3 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-800 transition-all"
                  title="前进10秒"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-stone-500">
                  <Volume2 className="w-5 h-5" />
                  <div className="w-24 h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-brand rounded-full" />
                  </div>
                </div>

                <div className="relative" ref={speedMenuRef}>
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 transition-all"
                  >
                    <Gauge className="w-4 h-4" />
                    {playbackRate}x
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-2 glass-card py-2 min-w-[100px] animate-slide-up">
                      {SPEED_OPTIONS.map((speed) => (
                        <button
                          key={speed}
                          onClick={() => {
                            setPlaybackRate(speed);
                            setShowSpeedMenu(false);
                          }}
                          className={cn(
                            'w-full px-4 py-2 text-left text-sm transition-colors',
                            playbackRate === speed
                              ? 'bg-brand-50 text-brand-700 font-medium'
                              : 'text-stone-600 hover:bg-stone-50',
                          )}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-semibold text-stone-800 mb-4">说话人</h3>
              <div className="space-y-3">
                {Array.from(new Set(segments.map((s) => s.speaker))).map((speaker) => {
                  const count = segments.filter((s) => s.speaker === speaker).length;
                  const badgeClass =
                    SPEAKER_TEXT_COLORS[speaker] ||
                    'text-stone-700 bg-stone-100 border-stone-200';
                  return (
                    <div
                      key={speaker}
                      className="flex items-center justify-between p-3 rounded-xl bg-stone-50"
                    >
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
                          badgeClass,
                        )}
                      >
                        <Mic2 className="w-3 h-3" />
                        {speaker}
                      </span>
                      <span className="text-sm text-stone-500">{count} 段</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="glass-card p-6 h-[calc(100vh-160px)] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-stone-800">逐字稿</h3>
                <p className="text-sm text-stone-500 mt-0.5">
                  共 {segments.length} 段 · 双击文本可编辑
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  口误标记已高亮
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin space-y-2">
              {segments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-stone-400">
                  <Volume2 className="w-12 h-12 mb-4 opacity-30" />
                  <p>暂无转写内容</p>
                </div>
              ) : (
                segments.map((segment, idx) => (
                  <div key={segment.id} style={{ animationDelay: `${idx * 30}ms` }} className="animate-fade-in">
                    <SegmentEditor
                      segment={segment}
                      taskId={taskId || ''}
                      onUpdate={updateSegment}
                      onToggleMistake={toggleMistake}
                      onSeek={handleSeek}
                      currentTime={currentTime}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}
