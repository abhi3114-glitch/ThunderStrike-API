import OpenAI from 'openai';
import { ITarget } from '../models/Target';
import { ScenarioMetrics } from '../models/ChaosTest';

interface AIReportData {
  target: ITarget;
  scenarios: string[];
  metrics: ScenarioMetrics[];
}

interface AIReportResult {
  title: string;
  summary: string;
  timeline: string[];
  recommendations: string[];
}

export async function generateAIReport(testData: AIReportData): Promise<AIReportResult> {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  // If OpenAI API key is not configured, return a simulated report
  if (!openaiApiKey || openaiApiKey === 'your_openai_api_key_here') {
    console.log('⚠️  OpenAI API key not configured, generating simulated report...');
    return generateSimulatedReport(testData);
  }

  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    const model = process.env.OPENAI_MODEL || 'gpt-4';

    // Prepare the prompt
    const prompt = buildPrompt(testData);

    console.log('🤖 Generating AI report with OpenAI...');

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert API reliability engineer analyzing chaos test results. Provide detailed, actionable insights.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    // Parse the AI response
    return parseAIResponse(responseText, testData);
  } catch (error: any) {
    console.error('❌ Error generating AI report:', error.message);
    console.log('⚠️  Falling back to simulated report...');
    return generateSimulatedReport(testData);
  }
}

function buildPrompt(testData: AIReportData): string {
  const { target, scenarios, metrics } = testData;

  let prompt = `Analyze the following chaos test results for API endpoint:\n\n`;
  prompt += `Target: ${target.method} ${target.url}\n`;
  prompt += `Scenarios tested: ${scenarios.join(', ')}\n\n`;
  prompt += `Results:\n`;

  metrics.forEach((metric) => {
    prompt += `\n${metric.name.toUpperCase()} Scenario:\n`;
    prompt += `- Total requests: ${metric.totalRequests}\n`;
    prompt += `- Success rate: ${((metric.successCount / metric.totalRequests) * 100).toFixed(1)}%\n`;
    prompt += `- Error rate: ${((metric.errorCount / metric.totalRequests) * 100).toFixed(1)}%\n`;
    
    if (metric.avgLatencyMs) {
      prompt += `- Average latency: ${metric.avgLatencyMs}ms\n`;
    }
    if (metric.p95LatencyMs) {
      prompt += `- P95 latency: ${metric.p95LatencyMs}ms\n`;
    }
    if (metric.timeoutCount) {
      prompt += `- Timeouts: ${metric.timeoutCount}\n`;
    }
    
    prompt += `- Status codes: ${JSON.stringify(metric.statusCodeCounts)}\n`;
    
    if (metric.errors && metric.errors.length > 0) {
      prompt += `- Notable errors: ${metric.errors.slice(0, 5).join('; ')}\n`;
    }
  });

  prompt += `\nProvide a comprehensive post-mortem report with:\n`;
  prompt += `1. A concise title\n`;
  prompt += `2. Executive summary (2-3 sentences)\n`;
  prompt += `3. Timeline of what happened in each test phase\n`;
  prompt += `4. Concrete recommendations to improve API resilience\n\n`;
  prompt += `Format your response as JSON with keys: title, summary, timeline (array), recommendations (array)`;

  return prompt;
}

function parseAIResponse(responseText: string, testData: AIReportData): AIReportResult {
  try {
    // Try to parse as JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title || 'Chaos Test Post-Mortem Report',
        summary: parsed.summary || '',
        timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      };
    }
  } catch (error) {
    console.warn('⚠️  Failed to parse AI response as JSON, using fallback...');
  }

  // Fallback: extract information from text
  return generateSimulatedReport(testData);
}

function generateSimulatedReport(testData: AIReportData): AIReportResult {
  const { target, scenarios, metrics } = testData;

  const totalRequests = metrics.reduce((sum, m) => sum + m.totalRequests, 0);
  const totalErrors = metrics.reduce((sum, m) => sum + m.errorCount, 0);
  const errorRate = totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(1) : '0';

  const timeline: string[] = [];
  const recommendations: string[] = [];

  scenarios.forEach((scenario, index) => {
    const metric = metrics[index];
    if (!metric) return;

    // Timeline
    const successRate = ((metric.successCount / metric.totalRequests) * 100).toFixed(1);
    timeline.push(
      `${scenario.toUpperCase()}: Executed ${metric.totalRequests} requests with ${successRate}% success rate. ` +
      `Status codes: ${JSON.stringify(metric.statusCodeCounts)}.`
    );

    // Recommendations based on scenario
    if (scenario === 'latency' && metric.p95LatencyMs && metric.p95LatencyMs > 1000) {
      recommendations.push(
        `Latency optimization: P95 latency is ${metric.p95LatencyMs}ms. Consider implementing caching, database query optimization, or CDN for static assets.`
      );
    }

    if (scenario === 'payload_corruption') {
      const has5xx = Object.keys(metric.statusCodeCounts).some(code => code.startsWith('5'));
      if (has5xx) {
        recommendations.push(
          'Input validation: API returns 5xx errors for invalid payloads. Implement robust input validation and return proper 4xx errors with clear messages.'
        );
      } else {
        recommendations.push(
          'Good input validation: API properly handles malformed payloads with 4xx responses. Consider adding more detailed error messages.'
        );
      }
    }

    if (scenario === 'auth_failure') {
      const has401or403 = metric.statusCodeCounts['401'] || metric.statusCodeCounts['403'];
      if (!has401or403) {
        recommendations.push(
          'Authentication handling: API does not return proper 401/403 for auth failures. Implement proper authentication middleware.'
        );
      } else {
        recommendations.push(
          'Authentication is properly configured. Consider adding rate limiting for failed auth attempts to prevent brute force attacks.'
        );
      }
    }

    if (scenario === 'rate_limit') {
      const has429 = metric.statusCodeCounts['429'];
      if (!has429 && metric.errorCount > metric.totalRequests * 0.3) {
        recommendations.push(
          'Rate limiting: API shows degraded performance under load without proper rate limiting. Implement rate limiting with 429 responses.'
        );
      }
      if (metric.timeoutCount && metric.timeoutCount > 0) {
        recommendations.push(
          `Timeout handling: ${metric.timeoutCount} requests timed out under load. Consider implementing request queuing, auto-scaling, or circuit breakers.`
        );
      }
    }
  });

  // General recommendations
  if (totalErrors > totalRequests * 0.2) {
    recommendations.push(
      'High error rate detected. Implement comprehensive error handling, logging, and monitoring to identify root causes.'
    );
  }

  recommendations.push(
    'Monitoring: Set up APM tools (New Relic, Datadog, or Prometheus) to track real-time performance and error rates.',
    'Implement circuit breakers and fallback mechanisms for external dependencies.',
    'Consider implementing a comprehensive API testing strategy including integration and load tests in CI/CD pipeline.'
  );

  return {
    title: `Chaos Test Report: ${target.method} ${target.url}`,
    summary: `Executed ${scenarios.length} chaos scenarios with ${totalRequests} total requests. ` +
      `Overall error rate: ${errorRate}%. ${errorRate === '0' || parseFloat(errorRate) < 5 
        ? 'API shows good resilience under chaos conditions.' 
        : 'API shows areas for improvement in error handling and resilience.'}`,
    timeline,
    recommendations: recommendations.slice(0, 8), // Limit to top 8 recommendations
  };
}