import { Router, Request, Response } from 'express';
import AIReport from '../models/AIReport';

const router = Router();

// Get an AI report by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const report = await AIReport.findById(req.params.id).populate('testId');

    if (!report) {
      return res.status(404).json({
        error: 'Report not found',
      });
    }

    res.json({ report });
  } catch (error: any) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      error: 'Failed to fetch report',
      details: error.message,
    });
  }
});

// Get report by test ID
router.get('/test/:testId', async (req: Request, res: Response) => {
  try {
    const report = await AIReport.findOne({ testId: req.params.testId });

    if (!report) {
      return res.status(404).json({
        error: 'Report not found for this test',
      });
    }

    res.json({ report });
  } catch (error: any) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      error: 'Failed to fetch report',
      details: error.message,
    });
  }
});

export default router;