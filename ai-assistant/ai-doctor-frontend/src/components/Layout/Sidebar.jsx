import { NavLink } from 'react-router-dom';
import { FiHome, FiUserPlus, FiClock, FiBarChart2 } from 'react-icons/fi';

const navItems = [
  { to: '/', icon: FiHome, label: 'Dashboard' },
  { to: '/consultation', icon: FiUserPlus, label: 'New Consultation' },
  { to: '/history', icon: FiClock, label: 'History' },
  { to: '/performance', icon: FiBarChart2, label: 'AI Performance' },
];

const Sidebar = () => (
  <aside className="w-64 bg-dark-900 min-h-screen p-4 flex flex-col">
    <div className="flex items-center gap-3 px-2 mb-8">
      <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-xl">
        🩺
      </div>
      <div>
        <p className="text-white font-bold text-sm">Doctor Panel</p>
        <p className="text-gray-400 text-xs">AI Assistant</p>
      </div>
    </div>

    <nav className="flex-1 space-y-1">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
            ${isActive
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <Icon className="w-5 h-5" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>

    <div className="mt-auto px-2 py-4 border-t border-gray-700">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
          DR
        </div>
        <div>
          <p className="text-white text-sm font-medium">Dr. Doctor</p>
          <p className="text-gray-500 text-xs">General Medicine</p>
        </div>
      </div>
    </div>
  </aside>
);

export default Sidebar;