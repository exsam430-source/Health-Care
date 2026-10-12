import Button from '../ui/Button';

const EmptyState = ({ icon = '📭', title, message, action, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-5xl mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">{title}</h3>
      <p className="text-gray-500 text-center max-w-sm mb-6">{message}</p>
      {action || (onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel || 'Get Started'}
        </Button>
      ))}
    </div>
  );
};

export default EmptyState;