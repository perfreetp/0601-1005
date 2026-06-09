import { useEffect, useMemo } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import TasksPage from '@/pages/TasksPage';
import TranscriptPage from '@/pages/TranscriptPage';
import ChaptersPage from '@/pages/ChaptersPage';
import HighlightsPage from '@/pages/HighlightsPage';
import CopywritingPage from '@/pages/CopywritingPage';
import ChecklistPage from '@/pages/ChecklistPage';
import { useStore } from '@/store/useStore';

const STEP_MAP: Record<string, { step: number; breadcrumb: string[] }> = {
  '/tasks': { step: 1, breadcrumb: ['工作台', '导入任务'] },
  '/transcript': { step: 2, breadcrumb: ['工作台', '转写校对'] },
  '/chapters': { step: 3, breadcrumb: ['工作台', '章节切分'] },
  '/highlights': { step: 4, breadcrumb: ['工作台', '亮点提取'] },
  '/copy': { step: 5, breadcrumb: ['工作台', '文案生成'] },
  '/publish': { step: 6, breadcrumb: ['工作台', '发布检查'] },
};

function getBasePath(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return '/tasks';
  return '/' + parts[0];
}

function TaskIdSynchronizer() {
  const params = useParams<{ taskId: string }>();
  const setCurrentTaskId = useStore((s) => s.setCurrentTaskId);

  useEffect(() => {
    if (params.taskId) {
      setCurrentTaskId(params.taskId);
    }
  }, [params.taskId, setCurrentTaskId]);

  return null;
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const tasks = useStore((s) => s.tasks);
  const currentTaskId = useStore((s) => s.currentTaskId);
  const setCurrentTaskId = useStore((s) => s.setCurrentTaskId);

  const basePath = useMemo(() => getBasePath(location.pathname), [location.pathname]);
  const { step, breadcrumb } = STEP_MAP[basePath] || { step: 1, breadcrumb: ['工作台'] };
  const activeRoute = basePath === '/' ? '/tasks' : basePath;

  const currentTask = useMemo(
    () => tasks.find((t) => t.id === currentTaskId),
    [tasks, currentTaskId],
  );

  const handleNavigate = (path: string) => {
    if (path === '/tasks') {
      setCurrentTaskId(null);
      navigate('/tasks');
      return;
    }
    const targetId = currentTaskId || 'task-002';
    navigate(`${path}/${targetId}`);
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar activeRoute={activeRoute} onNavigate={handleNavigate} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar task={currentTask} currentStep={step} breadcrumb={breadcrumb} />
        <main className="flex-1 overflow-auto scrollbar-thin bg-gradient-to-br from-stone-50 to-brand-50/50 bg-grain relative">
          <div className="px-8 py-8 relative z-10">
            <Routes>
              <Route path="/tasks" element={<TasksPage />} />
              <Route
                path="/transcript/:taskId"
                element={
                  <>
                    <TaskIdSynchronizer />
                    <TranscriptPage />
                  </>
                }
              />
              <Route
                path="/chapters/:taskId"
                element={
                  <>
                    <TaskIdSynchronizer />
                    <ChaptersPage />
                  </>
                }
              />
              <Route
                path="/highlights/:taskId"
                element={
                  <>
                    <TaskIdSynchronizer />
                    <HighlightsPage />
                  </>
                }
              />
              <Route
                path="/copy/:taskId"
                element={
                  <>
                    <TaskIdSynchronizer />
                    <CopywritingPage />
                  </>
                }
              />
              <Route
                path="/publish/:taskId"
                element={
                  <>
                    <TaskIdSynchronizer />
                    <ChecklistPage />
                  </>
                }
              />
              <Route path="*" element={<Navigate to="/tasks" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
