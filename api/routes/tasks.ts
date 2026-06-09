import { Router, type Request, type Response } from 'express';
import * as taskService from '../services/taskService.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const tasks = await taskService.fetchTasks();
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const task = await taskService.getTask(req.params.id);
    if (!task) {
      res.status(404).json({ success: false, error: '任务不存在' });
      return;
    }
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/upload', async (req: Request, res: Response) => {
  try {
    const { fileName, fileSize, duration, title } = req.body;
    const task = await taskService.createTask({ fileName, fileSize, duration, title });
    taskService.simulateProgress(task.id);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/:id/retry', async (req: Request, res: Response) => {
  try {
    const task = await taskService.retryTask(req.params.id);
    if (!task) {
      res.status(404).json({ success: false, error: '任务不存在' });
      return;
    }
    taskService.simulateProgress(task.id);
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/:id/transcript', async (req: Request, res: Response) => {
  try {
    const data = await taskService.getTranscript(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.put('/:id/transcript', async (req: Request, res: Response) => {
  try {
    const data = await taskService.updateTranscript(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/:id/chapters', async (req: Request, res: Response) => {
  try {
    const data = await taskService.getChapters(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.put('/:id/chapters', async (req: Request, res: Response) => {
  try {
    const data = await taskService.updateChapters(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/:id/highlights', async (req: Request, res: Response) => {
  try {
    const data = await taskService.getHighlights(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/:id/highlights', async (req: Request, res: Response) => {
  try {
    const data = await taskService.addHighlight(req.params.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.patch('/:id/highlights/:highlightId/favorite', async (req: Request, res: Response) => {
  try {
    const data = await taskService.toggleHighlightFavorite(req.params.id, req.params.highlightId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/:id/copy', async (req: Request, res: Response) => {
  try {
    const data = await taskService.getCopy(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/:id/copy/regenerate', async (req: Request, res: Response) => {
  try {
    const { type } = req.body;
    const data = await taskService.regenerateCopy(req.params.id, type);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/:id/checklist', async (req: Request, res: Response) => {
  try {
    const data = await taskService.getChecklist(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/:id/checklist/run', async (req: Request, res: Response) => {
  try {
    const data = await taskService.runChecklist(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/:id/export', async (req: Request, res: Response) => {
  try {
    const { platforms } = req.body;
    const data = await taskService.exportPackage(req.params.id, platforms);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
