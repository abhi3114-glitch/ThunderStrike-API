import axios, { AxiosRequestConfig } from 'axios';
import { ITarget } from '../../models/Target';
import { ChaosScenarioResult, RequestMetric } from '../../types/chaos';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function runLatencyScenario(target: ITarget): Promise<ChaosScenarioResult> {
  const totalRequests = 20;
  const requestMetrics: RequestMetric[] = [];
  const statusCodeCounts: Record<string, number> = {};
  let successCount = 0;
  let errorCount = 0;
  let timeoutCount = 0;

  console.log(`🔄 Running latency scenario for ${target.url}...`);

  for (let i = 0; i < totalRequests; i++) {
    // Random delay between requests (0-500ms)
    const delay = Math.floor(Math.random() * 500);
    await sleep(delay);

    const startTime = Date.now();
    let metric: RequestMetric = {
      startTime,
      endTime: 0,
      latencyMs: 0,
      isTimeout: false,
      isError: false,
    };

    try {
      const config: AxiosRequestConfig = {
        method: target.method,
        url: target.url,
        headers: target.headers || {},
        timeout: 10000, // 10 second timeout
      };

      if (target.method !== 'GET' && target.basePayload) {
        config.data = target.basePayload;
      }

      const response = await axios(config);
      
      metric.endTime = Date.now();
      metric.latencyMs = metric.endTime - metric.startTime;
      metric.statusCode = response.status;

      const statusKey = response.status.toString();
      statusCodeCounts[statusKey] = (statusCodeCounts[statusKey] || 0) + 1;

      if (response.status >= 200 && response.status < 300) {
        successCount++;
      } else {
        errorCount++;
      }
    } catch (error: any) {
      metric.endTime = Date.now();
      metric.latencyMs = metric.endTime - metric.startTime;
      metric.isError = true;
      errorCount++;

      if (error.code === 'ECONNABORTED') {
        metric.isTimeout = true;
        timeoutCount++;
        metric.errorMessage = 'Request timeout';
      } else if (error.response) {
        metric.statusCode = error.response.status;
        const statusKey = error.response.status.toString();
        statusCodeCounts[statusKey] = (statusCodeCounts[statusKey] || 0) + 1;
        metric.errorMessage = `HTTP ${error.response.status}`;
      } else {
        metric.errorMessage = error.message || 'Unknown error';
      }
    }

    requestMetrics.push(metric);
  }

  // Calculate statistics
  const latencies = requestMetrics
    .filter(m => !m.isTimeout)
    .map(m => m.latencyMs)
    .sort((a, b) => a - b);

  const avgLatencyMs = latencies.length > 0
    ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
    : 0;

  const p95Index = Math.floor(latencies.length * 0.95);
  const p99Index = Math.floor(latencies.length * 0.99);
  const p95LatencyMs = latencies[p95Index] || 0;
  const p99LatencyMs = latencies[p99Index] || 0;

  const errors = requestMetrics
    .filter(m => m.errorMessage)
    .map(m => m.errorMessage!)
    .filter((v, i, a) => a.indexOf(v) === i); // unique errors

  return {
    name: 'latency',
    totalRequests,
    successCount,
    errorCount,
    statusCodeCounts,
    avgLatencyMs: Math.round(avgLatencyMs),
    p95LatencyMs: Math.round(p95LatencyMs),
    p99LatencyMs: Math.round(p99LatencyMs),
    timeoutCount,
    errors,
    requestMetrics,
  };
}