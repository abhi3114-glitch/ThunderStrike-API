import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { testsApi, targetsApi, ChaosTest, Target } from '../services/api';

const SCENARIOS = [
  { id: 'latency', name: 'Latency Testing', description: 'Test with variable network delays' },
  { id: 'payload_corruption', name: 'Payload Corruption', description: 'Test with malformed data' },
  { id: 'auth_failure', name: 'Auth Failure', description: 'Test authentication handling' },
  { id: 'rate_limit', name: 'Rate Limit/Burst', description: 'Test under high load' },
];

export default function TestsPage() {
  const [tests, setTests] = useState<ChaosTest[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    targetId: '',
    scenarios: [] as string[],
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [testsRes, targetsRes] = await Promise.all([
        testsApi.getAll(),
        targetsApi.getAll(),
      ]);
      setTests(testsRes.data.tests);
      setTargets(targetsRes.data.targets);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.scenarios.length === 0) {
      alert('Please select at least one scenario');
      return;
    }

    try {
      await testsApi.create(formData);
      setShowForm(false);
      setFormData({ targetId: '', scenarios: [] });
      loadData();
    } catch (error: any) {
      alert('Failed to create test: ' + (error.response?.data?.error || error.message));
    }
  };

  const toggleScenario = (scenarioId: string) => {
    setFormData(prev => ({
      ...prev,
      scenarios: prev.scenarios.includes(scenarioId)
        ? prev.scenarios.filter(s => s !== scenarioId)
        : [...prev.scenarios, scenarioId],
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'queued': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Chaos Tests</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
          disabled={targets.length === 0}
        >
          {showForm ? 'Cancel' : '+ New Test'}
        </button>
      </div>

      {targets.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-gray-600 mb-4">No targets available. Create a target first!</p>
          <Link to="/targets" className="btn btn-primary">
            Go to Targets
          </Link>
        </div>
      )}

      {showForm && targets.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Create New Chaos Test</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Select Target</label>
              <select
                className="input"
                value={formData.targetId}
                onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                required
              >
                <option value="">Choose a target...</option>
                {targets.map((target) => (
                  <option key={target._id} value={target._id}>
                    {target.name} ({target.method} {target.url})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Select Scenarios</label>
              <div className="space-y-2">
                {SCENARIOS.map((scenario) => (
                  <label
                    key={scenario.id}
                    className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={formData.scenarios.includes(scenario.id)}
                      onChange={() => toggleScenario(scenario.id)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{scenario.name}</div>
                      <div className="text-sm text-gray-500">{scenario.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full">
              Start Chaos Test
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {tests.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">No tests yet. Create your first chaos test!</p>
          </div>
        ) : (
          tests.map((test) => {
            const target = typeof test.targetId === 'object' ? test.targetId : null;
            return (
              <Link
                key={test._id}
                to={`/tests/${test._id}`}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {target?.name || 'Unknown Target'}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(test.status)}`}>
                        {test.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {target ? `${target.method} ${target.url}` : 'Target details unavailable'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {test.scenarios.map((scenario) => (
                        <span
                          key={scenario}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {scenario}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Created: {new Date(test.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {test.status === 'completed' && test.aiReportId && (
                    <div className="ml-4">
                      <span className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                        📊 Report Available
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}