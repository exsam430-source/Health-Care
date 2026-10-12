const Card = ({ 
  children, 
  className = '', 
  hover = false, 
  padding = 'md',
  gradient = false
}) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={`
      bg-white rounded-2xl border border-gray-100 
      ${paddings[padding]}
      ${hover ? 'hover:shadow-xl hover:border-gray-200 hover:-translate-y-1' : 'shadow-sm'} 
      ${gradient ? 'bg-gradient-to-br from-white to-gray-50' : ''}
      transition-all duration-300
      ${className}
    `}>
      {children}
    </div>
  );
};

export default Card;