import { FiActivity, FiClock } from 'react-icons/fi';

const Header = () => {
  const now = new Date().toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-primary-500/30">
          🤖
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">AI Doctor Assistant</h1>
          <p className="text-xs text-gray-400">Intelligent Medical Decision Support</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FiClock className="w-4 h-4" />
          <span>{now}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium">
          <FiActivity className="w-4 h-4" />
          <span>System Active</span>
        </div>
      </div>
    </header>
  );
};

export default Header;