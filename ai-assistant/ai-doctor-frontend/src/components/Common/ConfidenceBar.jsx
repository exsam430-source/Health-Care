const ConfidenceBar = ({ value, size = 'md' }) => {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const bgColor = value >= 80 ? 'bg-emerald-100' : value >= 50 ? 'bg-amber-100' : 'bg-red-100';
  const textColor = value >= 80 ? 'text-emerald-700' : value >= 50 ? 'text-amber-700' : 'text-red-700';
  const height = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-4' : 'h-3';

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 ${bgColor} rounded-full ${height} overflow-hidden`}>
        <div
          className={`${color} ${height} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className={`text-sm font-bold ${textColor} min-w-[48px] text-right`}>
        {value}%
      </span>
    </div>
  );
};

export default ConfidenceBar;