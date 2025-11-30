export interface RequestMetric {
  startTime: number;
  endTime: number;
  latencyMs: number;
  statusCode?: number;
  isTimeout: boolean;
  isError: boolean;
  errorMessage?: string;
}

export interface ChaosScenarioResult {
  name: string;
  totalRequests: number;
  successCount: number;
  errorCount: number;
  statusCodeCounts: Record<string, number>;
  avgLatencyMs?: number;
  p95LatencyMs?: number;
  p99LatencyMs?: number;
  timeoutCount?: number;
  errors?: string[];
  requestMetrics: RequestMetric[];
}

export type ChaosScenario = 
  | 'latency'
  | 'payload_corruption'
  | 'auth_failure'
  | 'rate_limit';

export interface ChaosTestJob {
  testId: string;
  targetId: string;
  scenarios: ChaosScenario[];
}