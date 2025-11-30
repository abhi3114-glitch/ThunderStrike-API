import axios, { AxiosRequestConfig } from 'axios';
import { ITarget } from '../../models/Target';
import { ChaosScenarioResult, RequestMetric } from '../../types/chaos';

export async function runAuthFailureScenario(target: ITarget): Promise<ChaosScenarioResult> {
  const requestMetrics: RequestMetric[] = [];
  const statusCodeCounts: Record<string, number> = {};
  let successCount = 0;
  let errorCount = 0;

  console.log(`🔄 Running auth failure scenario for ${target.url}...`);

  const authTests: Array<{ description: string; headers: Record<string, string> }> = [
    {
      description: 'No Authorization header',
      headers: Object.keys(target.headers || {})
        .filter(key => key.toLowerCase() !== 'authorization')
        .reduce((acc, key) => {
          acc[key] = (target.headers as any)[key];
          return acc;
        }, {} as Record<string, string>),
    },
    {
      description: 'Invalid token format',
      headers: {
        ...(target.headers || {}),
        'Authorization': 'InvalidTokenFormat',
      },
    },
    {
      description: 'Expired/Invalid Bearer token',
      headers: {
        ...(target.headers || {}),
        'Authorization': 'Bearer invalid_token_12345',
      },
    },
    {
      description: 'Empty Authorization header',
      headers: {
        ...(target.headers || {}),
        'Authorization': '',
      },
    },
  ];

  for (const { description, headers } of authTests) {
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
        headers,
        timeout: 10000,
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

      if (error.response) {
        metric.statusCode = error.response.status;
        const statusKey = error.response.status.toString();
        statusCodeCounts[statusKey] = (statusCodeCounts[statusKey] || 0) + 1;
        
        // Good behavior: 401/403 responses
        if (error.response.status === 401 || error.response.status === 403) {
          metric.errorMessage = `${description}: Proper auth error (${error.response.status})`;
        } else {
          // Bad behavior: 500 or other errors
          metric.errorMessage = `${description}: Unexpected error (${error.response.status})`;
        }
      } else {
        metric.errorMessage = `${description}: ${error.message || 'Unknown error'}`;
      }
    }

    requestMetrics.push(metric);
  }

  const latencies = requestMetrics.map(m => m.latencyMs);
  const avgLatencyMs = latencies.length > 0
    ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
    : 0;

  const errors = requestMetrics
    .filter(m => m.errorMessage)
    .map(m => m.errorMessage!)
    .filter((v, i, a) => a.indexOf(v) === i);

  return {
    name: 'auth_failure',
    totalRequests: authTests.length,
    successCount,
    errorCount,
    statusCodeCounts,
    avgLatencyMs: Math.round(avgLatencyMs),
    errors,
    requestMetrics,
  };
}