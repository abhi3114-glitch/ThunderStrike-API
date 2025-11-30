import { useEffect, useState } from 'react';
import { targetsApi, Target } from '../services/api';

export default function TargetsPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    method: 'GET' as 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: '',
    basePayload: '{}',
    headers: '{}',
  });

  useEffect(() => {
    loadTargets();
  }, []);

  const loadTargets = async () => {
    try {
      const response = await targetsApi.getAll();
      setTargets(response.data.targets);
    } catch (error) {
      console.error('Failed to load targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let basePayload = {};
      let headers = {};
      
      try {
        basePayload = JSON.parse(formData.basePayload);
        headers = JSON.parse(formData.headers);
      } catch (error) {
        alert('Invalid JSON in payload or headers');
        return;
      }

      await targetsApi.create({
        name: formData.name,
        method: formData.method,
        url: formData.url,
        basePayload,
        headers,
      });

      setShowForm(false);
      setFormData({
        name: '',
        method: 'GET',
        url: '',
        basePayload: '{}',
        headers: '{}',
      });
      loadTargets();
    } catch (error: any) {
      alert('Failed to create target: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this target?')) return;

    try {
      await targetsApi.delete(id);
      loadTargets();
    } catch (error) {
      alert('Failed to delete target');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">API Targets</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          {showForm ? 'Cancel' : '+ Add Target'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Create New Target</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Method</label>
              <select
                className="input"
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value as any })}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div>
              <label className="label">URL</label>
              <input
                type="url"
                className="input"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://api.example.com/endpoint"
                required
              />
            </div>

            <div>
              <label className="label">Base Payload (JSON)</label>
              <textarea
                className="input"
                rows={4}
                value={formData.basePayload}
                onChange={(e) => setFormData({ ...formData, basePayload: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Headers (JSON)</label>
              <textarea
                className="input"
                rows={4}
                value={formData.headers}
                onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
                placeholder='{"Authorization": "Bearer token"}'
              />
            </div>

            <button type="submit" className="btn btn-primary w-full">
              Create Target
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {targets.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">No targets yet. Create your first target to get started!</p>
          </div>
        ) : (
          targets.map((target) => (
            <div key={target._id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{target.name}</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{target.method}</span> {target.url}
                    </p>
                    {Object.keys(target.headers || {}).length > 0 && (
                      <p className="text-sm text-gray-500">
                        Headers: {Object.keys(target.headers || {}).length} configured
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      Created: {new Date(target.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(target._id)}
                  className="btn btn-danger ml-4"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}