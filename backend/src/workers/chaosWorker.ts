import { Worker, Job } from 'bullmq';
import dotenv from 'dotenv';
import { connectDatabase } from '../config/database';
import { redisConnection } from '../config/redis';
import { ChaosTestJob } from '../types/chaos';
import Target from '../models/Target';
import ChaosTest from '../models/ChaosTest';
import AIReport from '../models/AIReport';
import { ChaosEngine } from '../chaos/chaosEngine';
import { generateAIReport } from '../services/aiReportService';

dotenv.config();

// Connect to database
connectDatabase();

const chaosEngine = new ChaosEngine();

const worker = new Worker<ChaosTestJob>(
  'chaos-tests',
  async (job: Job<ChaosTestJob>) => {
    const { testId, targetId, scenarios } = job.data;

    console.log(`\n🚀 Processing chaos test job: ${testId}`);
    console.log(`📋 Scenarios: ${scenarios.join(', ')}`);

    try {
      // Update test status to running
      await ChaosTest.findByIdAndUpdate(testId, {
        status: 'running',
        startedAt: new Date(),
      });

      // Fetch target details
      const target = await Target.findById(targetId);
      if (!target) {
        throw new Error(`Target not found: ${targetId}`);
      }

      console.log(`🎯 Target: ${target.method} ${target.url}`);

      // Execute all chaos scenarios
      const results = await chaosEngine.executeAllScenarios(scenarios as any, target);

      // Convert results to metrics format
      const metrics = results.map(result => ({
        name: result.name,
        totalRequests: result.totalRequests,
        successCount: result.successCount,
        errorCount: result.errorCount,
        statusCodeCounts: result.statusCodeCounts,
        avgLatencyMs: result.avgLatencyMs,
        p95LatencyMs: result.p95LatencyMs,
        p99LatencyMs: result.p99LatencyMs,
        timeoutCount: result.timeoutCount,
        errors: result.errors,
      }));

      console.log('\n📊 Generating AI report...');

      // Generate AI report
      const reportData = await generateAIReport({
        target,
        scenarios,
        metrics,
      });

      // Save AI report
      const aiReport = new AIReport({
        testId,
        title: reportData.title,
        summary: reportData.summary,
        timeline: reportData.timeline,
        recommendations: reportData.recommendations,
      });
      await aiReport.save();

      console.log(`✅ AI report generated: ${aiReport._id}`);

      // Update test with results
      await ChaosTest.findByIdAndUpdate(testId, {
        status: 'completed',
        metrics,
        aiReportId: aiReport._id,
        completedAt: new Date(),
      });

      console.log(`✅ Chaos test completed: ${testId}\n`);

      return {
        testId,
        status: 'completed',
        reportId: aiReport._id.toString(),
      };
    } catch (error: any) {
      console.error(`❌ Chaos test failed: ${testId}`, error);

      // Update test status to failed
      await ChaosTest.findByIdAndUpdate(testId, {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date(),
      });

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // Process 2 jobs concurrently
  }
);

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('❌ Worker error:', err);
});

console.log('👷 Chaos test worker started and listening for jobs...');