import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { testsApi, ChaosTest, Target } from '../services/api';

export default function TestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [test, setTest] = useState<ChaosTest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTest();
    const interval = setInterval(loadTest, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const loadTest = async () => {
    if (!id) return;
    
    try {
      const response = await testsApi.getById(id);
      setTest(response.data.test);
    } catch (error) {
      console.error('Failed to load test:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!test) {
    return <div className="text-center py-12">Test not found</div>;
  }

  const target = typeof test.targetId === 'object' ? test.targetId as Target : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/tests" className="text-primary-600 hover:text-primary-700">
          ← Back to Tests
        </Link>
      </div>

      <div className="card">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {target?.name || 'Test Details'}
            </h1>
            <p className="text-gray-600 mt-1">
              {target ? `${target.method} ${target.url}` : 'Target unavailable'}
            </p>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
            test.status === 'completed' ? 'bg-green-100 text-green-800' :
            test.status === 'running' ? 'bg-blue-100 text-blue-800' :
            test.status === 'queued' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {test.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">Created</p>
            <p className="font-medium">{new Date(test.createdAt).toLocaleString()}</p>
          </div>
          {test.startedAt && (
            <div>
              <p className="text-sm text-gray-600">Started</p>
              <p className="font-medium">{new Date(test.startedAt).toLocaleString()}</p>
            </div>
          )}
          {test.completedAt && (
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="font-medium">{new Date(test.completedAt).toLocaleString()}</p>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Scenarios</h3>
          <div className="flex flex-wrap gap-2">
            {test.scenarios.map((scenario) => (
              <span
                key={scenario}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full"
              >
                {scenario}
              </span>
            ))}
          </div>
        </div>

        {test.errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <p className="text-red-700">{test.errorMessage}</p>
          </div>
        )}

        {test.metrics && test.metrics.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Metrics</h3>
            {test.metrics.map((metric, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 capitalize">
                  {metric.name.replace(/_/g, ' ')}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Requests</p>
                    <p className="text-lg font-semibold">{metric.totalRequests}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-lg font-semibold text-green-600">
                      {((metric.successCount / metric.totalRequests) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Error Rate</p>
                    <p className="text-lg font-semibold text-red-600">
                      {((metric.errorCount / metric.totalRequests) * 100).toFixed(1)}%
                    </p>
                  </div>
                  {metric.avgLatencyMs !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600">Avg Latency</p>
                      <p className="text-lg font-semibold">{metric.avgLatencyMs}ms</p>
                    </div>
                  )}
                  {metric.p95LatencyMs !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600">P95 Latency</p>
                      <p className="text-lg font-semibold">{metric.p95LatencyMs}ms</p>
                    </div>
                  )}
                  {metric.timeoutCount !== undefined && metric.timeoutCount > 0 && (
                    <div>
                      <p className="text-sm text-gray-600">Timeouts</p>
                      <p className="text-lg font-semibold text-orange-600">{metric.timeoutCount}</p>
                    </div>
                  )}
                </div>
                
                {Object.keys(metric.statusCodeCounts).length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Status Codes</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(metric.statusCodeCounts).map(([code, count]) => (
                        <span
                          key={code}
                          className={`px-2 py-1 rounded text-sm ${
                            code.startsWith('2') ? 'bg-green-100 text-green-800' :
                            code.startsWith('4') ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {code}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {metric.errors && metric.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Notable Errors</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {metric.errors.slice(0, 5).map((error, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-red-500 mr-2">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {test.status === 'completed' && test.aiReportId && (
          <div className="mt-6">
            <Link
              to={`/reports/${test.aiReportId}`}
              className="btn btn-primary w-full"
            >
              View AI Post-Mortem Report
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}