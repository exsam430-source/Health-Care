// src/components/doctor/ai/ConfidenceBar.jsx
// Reusable confidence percentage bar with color-coded levels

const ConfidenceBar = ({ value, size = 'md' }) => {
  const getColors = (val) => {
    if (val >= 80) return { bar: 'bg-emerald-500', bg: 'bg-emerald-100', text: 'text-emerald-700' };
    if (val >= 50) return { bar: 'bg-amber-500', bg: 'bg-amber-100', text: 'text-amber-700' };
    return { bar: 'bg-red-500', bg: 'bg-red-100', text: 'text-red-700' };
  };

  const heights = { sm: 'h-2', md: 'h-3', lg: 'h-4' };
  const colors = getColors(value);

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 ${colors.bg} rounded-full ${heights[size]} overflow-hidden`}>
        <div
          className={`${colors.bar} ${heights[size]} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className={`text-sm font-bold ${colors.text} min-w-[48px] text-right`}>
        {value}%
      </span>
    </div>
  );
};

export default ConfidenceBar;
