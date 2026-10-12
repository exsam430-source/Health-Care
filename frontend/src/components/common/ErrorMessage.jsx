const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-center">
        <span className="text-2xl mr-3">❌</span>
        <div className="flex-1">
          <h3 className="text-red-800 font-semibold">Error</h3>
          <p className="text-red-700 text-sm">{message}</p>
        </div>
        {onRetry && (
          <button onClick={onRetry} className="btn-secondary text-sm">
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;