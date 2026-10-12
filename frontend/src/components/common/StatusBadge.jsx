const StatusBadge = ({ status, type = 'appointment' }) => {
  const colors = {
    appointment: {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800'
    },
    lab: {
      requested: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    },
    medicine: {
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-purple-100 text-purple-800'
    },
    severity: {
      Low: 'bg-green-100 text-green-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      High: 'bg-red-100 text-red-800',
      Critical: 'bg-red-200 text-red-900'
    }
  };

  const colorClass = colors[type]?.[status] || 'bg-gray-100 text-gray-800';
  const displayText = status?.replace(/_/g, ' ').toUpperCase();

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {displayText}
    </span>
  );
};

export default StatusBadge;