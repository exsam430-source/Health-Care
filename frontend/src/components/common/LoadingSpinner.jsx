const LoadingSpinner = ({ size = 'md', message = '', fullScreen = false }) => {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  const Spinner = () => (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <div className={`${sizes[size]} rounded-full border-4 border-gray-200`}></div>
        <div className={`${sizes[size]} rounded-full border-4 border-blue-600 border-t-transparent animate-spin absolute top-0 left-0`}></div>
      </div>
      {message && (
        <p className="mt-4 text-gray-600 font-medium animate-pulse-slow">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center z-50">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20">
      <Spinner />
    </div>
  );
};

export default LoadingSpinner;