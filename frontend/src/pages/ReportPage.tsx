import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reportsApi, AIReport } from '../services/api';

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    if (!id) return;
    
    try {
      const response = await reportsApi.getById(id);
      setReport(response.data.report);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!report) {
    return <div className="text-center py-12">Report not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to={`/tests/${report.testId}`} className="text-primary-600 hover:text-primary-700">
          ← Back to Test
        </Link>
      </div>

      <div className="card">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{report.title}</h1>
          <p className="text-sm text-gray-500">
            Generated on {new Date(report.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Executive Summary</h2>
          <p className="text-gray-700 leading-relaxed">{report.summary}</p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Timeline</h2>
          <div className="space-y-3">
            {report.timeline.map((item, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold mr-3">
                  {index + 1}
                </div>
                <p className="text-gray-700 pt-1">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Recommendations</h2>
          <div className="space-y-3">
            {report.recommendations.map((rec, index) => (
              <div key={index} className="bg-blue-50 border-l-4 border-primary-500 p-4">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-gray-800">{rec}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}