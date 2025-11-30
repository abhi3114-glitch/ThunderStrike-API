import axios, { AxiosRequestConfig } from 'axios';
import { ITarget } from '../../models/Target';
import { ChaosScenarioResult, RequestMetric } from '../../types/chaos';

export async function runPayloadCorruptionScenario(target: ITarget): Promise<ChaosScenarioResult> {
  const requestMetrics: RequestMetric[] = [];
  const statusCodeCounts: Record<string, number> = {};
  let successCount = 0;
  let errorCount = 0;

  console.log(`🔄 Running payload corruption scenario for ${target.url}...`);

  // Only run for methods that accept payloads
  if (target.method === 'GET') {
    return {
      name: 'payload_corruption',
      totalRequests: 0,
      successCount: 0,
      errorCount: 0,
      statusCodeCounts: {},
      errors: ['Payload corruption not applicable for GET requests'],
      requestMetrics: [],
    };
  }

  const basePayload = target.basePayload || {};
  
  // Generate corrupted payloads
  const corruptedPayloads: Array<{ description: string; payload: any }> = [
    {
      description: 'Empty payload',
      payload: {},
    },
    {
      description: 'Null payload',
      payload: null,
    },
    {
      description: 'Missing required fields',
      payload: Object.keys(basePayload).length > 0 
        ? { [Object.keys(basePayload)[0]]: basePayload[Object.keys(basePayload)[0]] }
        : {},
    },
    {
      description: 'Wrong data types',
      payload: Object.keys(basePayload).reduce((acc, key) => {
        const value = basePayload[key];
        if (typeof value === 'number') {
          acc[key] = 'not_a_number';
        } else if (typeof value === 'string') {
          acc[key] = 12345;
        } else if (typeof value === 'boolean') {
          acc[key] = 'not_a_boolean';
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as any),
    },
    {
      description: 'Extra unexpected fields',
      payload: {
        ...basePayload,
        unexpectedField1: 'unexpected_value',
        unexpectedField2: 999,
        unexpectedField3: true,
      },
    },
    {
      description: 'Deeply nested invalid structure',
      payload: {
        ...basePayload,
        nested: {
          deeply: {
            invalid: {
              structure: [1, 2, 3, { foo: 'bar' }],
            },
          },
        },
      },
    },
  ];

  for (const { description, payload } of corruptedPayloads) {
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
        data: payload,
        timeout: 10000,
      };

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
        metric.errorMessage = `${description}: HTTP ${error.response.status}`;
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
    name: 'payload_corruption',
    totalRequests: corruptedPayloads.length,
    successCount,
    errorCount,
    statusCodeCounts,
    avgLatencyMs: Math.round(avgLatencyMs),
    errors,
    requestMetrics,
  };
}