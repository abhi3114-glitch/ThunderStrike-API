import { Router, Request, Response } from 'express';
import ChaosTest from '../models/ChaosTest';
import Target from '../models/Target';
import { chaosQueue } from '../queue/chaosQueue';

const router = Router();

// Create a new chaos test
router.post('/', async (req: Request, res: Response) => {
  try {
    const { targetId, scenarios } = req.body;

    // Validation
    if (!targetId || !scenarios || !Array.isArray(scenarios) || scenarios.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: targetId, scenarios (array)',
      });
    }

    // Verify target exists
    const target = await Target.findById(targetId);
    if (!target) {
      return res.status(404).json({
        error: 'Target not found',
      });
    }

    const validScenarios = ['latency', 'payload_corruption', 'auth_failure', 'rate_limit'];
    const invalidScenarios = scenarios.filter((s: string) => !validScenarios.includes(s));
    
    if (invalidScenarios.length > 0) {
      return res.status(400).json({
        error: `Invalid scenarios: ${invalidScenarios.join(', ')}`,
        validScenarios,
      });
    }

    // Create chaos test record
    const chaosTest = new ChaosTest({
      targetId,
      scenarios,
      status: 'queued',
    });

    await chaosTest.save();

    // Add job to queue
    await chaosQueue.add('chaos-test', {
      testId: chaosTest._id.toString(),
      targetId: targetId,
      scenarios,
    });

    console.log(`✅ Chaos test queued: ${chaosTest._id}`);

    res.status(201).json({
      message: 'Chaos test created and queued successfully',
      testId: chaosTest._id,
      status: chaosTest.status,
    });
  } catch (error: any) {
    console.error('Error creating chaos test:', error);
    res.status(500).json({
      error: 'Failed to create chaos test',
      details: error.message,
    });
  }
});

// Get all tests
router.get('/', async (req: Request, res: Response) => {
  try {
    const tests = await ChaosTest.find()
      .populate('targetId')
      .sort({ createdAt: -1 });

    res.json({
      count: tests.length,
      tests,
    });
  } catch (error: any) {
    console.error('Error fetching tests:', error);
    res.status(500).json({
      error: 'Failed to fetch tests',
      details: error.message,
    });
  }
});

// Get a single test by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const test = await ChaosTest.findById(req.params.id)
      .populate('targetId')
      .populate('aiReportId');

    if (!test) {
      return res.status(404).json({
        error: 'Test not found',
      });
    }

    res.json({ test });
  } catch (error: any) {
    console.error('Error fetching test:', error);
    res.status(500).json({
      error: 'Failed to fetch test',
      details: error.message,
    });
  }
});

export default router;