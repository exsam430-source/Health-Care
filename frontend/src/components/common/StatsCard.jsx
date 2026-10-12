const StatsCard = ({ title, value, icon, color = 'blue', trend, subtitle }) => {
  const gradients = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    pink: 'from-pink-500 to-pink-600',
    indigo: 'from-indigo-500 to-indigo-600',
    cyan: 'from-cyan-500 to-cyan-600'
  };

  const shadows = {
    blue: 'shadow-blue-500/20',
    green: 'shadow-emerald-500/20',
    purple: 'shadow-purple-500/20',
    orange: 'shadow-orange-500/20',
    red: 'shadow-red-500/20',
    pink: 'shadow-pink-500/20',
    indigo: 'shadow-indigo-500/20',
    cyan: 'shadow-cyan-500/20'
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span className="mr-1">{trend >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend)}% from last month</span>
            </div>
          )}
        </div>
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradients[color]} flex items-center justify-center text-white text-2xl shadow-lg ${shadows[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;