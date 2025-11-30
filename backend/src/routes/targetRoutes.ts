import { Router, Request, Response } from 'express';
import Target from '../models/Target';

const router = Router();

// Create a new target
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, method, url, basePayload, headers } = req.body;

    // Validation
    if (!name || !method || !url) {
      return res.status(400).json({
        error: 'Missing required fields: name, method, url',
      });
    }

    const validMethods = ['GET', 'POST', 'PUT', 'DELETE'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({
        error: `Invalid method. Must be one of: ${validMethods.join(', ')}`,
      });
    }

    const target = new Target({
      name,
      method,
      url,
      basePayload: basePayload || {},
      headers: headers || {},
    });

    await target.save();

    res.status(201).json({
      message: 'Target created successfully',
      target,
    });
  } catch (error: any) {
    console.error('Error creating target:', error);
    res.status(500).json({
      error: 'Failed to create target',
      details: error.message,
    });
  }
});

// Get all targets
router.get('/', async (req: Request, res: Response) => {
  try {
    const targets = await Target.find().sort({ createdAt: -1 });

    res.json({
      count: targets.length,
      targets,
    });
  } catch (error: any) {
    console.error('Error fetching targets:', error);
    res.status(500).json({
      error: 'Failed to fetch targets',
      details: error.message,
    });
  }
});

// Get a single target by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const target = await Target.findById(req.params.id);

    if (!target) {
      return res.status(404).json({
        error: 'Target not found',
      });
    }

    res.json({ target });
  } catch (error: any) {
    console.error('Error fetching target:', error);
    res.status(500).json({
      error: 'Failed to fetch target',
      details: error.message,
    });
  }
});

// Delete a target
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const target = await Target.findByIdAndDelete(req.params.id);

    if (!target) {
      return res.status(404).json({
        error: 'Target not found',
      });
    }

    res.json({
      message: 'Target deleted successfully',
      target,
    });
  } catch (error: any) {
    console.error('Error deleting target:', error);
    res.status(500).json({
      error: 'Failed to delete target',
      details: error.message,
    });
  }
});

export default router;