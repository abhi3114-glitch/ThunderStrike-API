import { ITarget } from '../models/Target';
import { ChaosScenario, ChaosScenarioResult } from '../types/chaos';
import { runLatencyScenario } from './scenarios/latencyScenario';
import { runPayloadCorruptionScenario } from './scenarios/payloadCorruptionScenario';
import { runAuthFailureScenario } from './scenarios/authFailureScenario';
import { runRateLimitScenario } from './scenarios/rateLimitScenario';

export class ChaosEngine {
  async executeScenario(
    scenario: ChaosScenario,
    target: ITarget
  ): Promise<ChaosScenarioResult> {
    console.log(`\n🎯 Executing ${scenario} scenario...`);

    switch (scenario) {
      case 'latency':
        return await runLatencyScenario(target);
      
      case 'payload_corruption':
        return await runPayloadCorruptionScenario(target);
      
      case 'auth_failure':
        return await runAuthFailureScenario(target);
      
      case 'rate_limit':
        return await runRateLimitScenario(target);
      
      default:
        throw new Error(`Unknown scenario: ${scenario}`);
    }
  }

  async executeAllScenarios(
    scenarios: ChaosScenario[],
    target: ITarget
  ): Promise<ChaosScenarioResult[]> {
    const results: ChaosScenarioResult[] = [];

    for (const scenario of scenarios) {
      try {
        const result = await this.executeScenario(scenario, target);
        results.push(result);
        console.log(`✅ Completed ${scenario} scenario`);
      } catch (error: any) {
        console.error(`❌ Failed ${scenario} scenario:`, error.message);
        // Still add a result with error information
        results.push({
          name: scenario,
          totalRequests: 0,
          successCount: 0,
          errorCount: 1,
          statusCodeCounts: {},
          errors: [error.message],
          requestMetrics: [],
        });
      }
    }

    return results;
  }
}