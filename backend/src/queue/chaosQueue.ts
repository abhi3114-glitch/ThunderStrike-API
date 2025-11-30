import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';
import { ChaosTestJob } from '../types/chaos';

export const chaosQueue = new Queue<ChaosTestJob>('chaos-tests', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      count: 50, // Keep last 50 failed jobs
    },
  },
});

console.log('✅ Chaos test queue initialized');