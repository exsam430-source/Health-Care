import PerformanceStats from '../components/AI/PerformanceStats';

const PerformancePage = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-extrabold text-gray-900">AI Performance Dashboard</h1>
    <p className="text-gray-400">Monitor AI accuracy, system health, and retraining status</p>
    <PerformanceStats />
  </div>
);

export default PerformancePage;