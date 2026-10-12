import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/common/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AppointmentRequests from '../../components/doctor/AppointmentRequests';
import MyPatients from '../../components/doctor/MyPatients';
import CreatePrescription from '../../components/doctor/CreatePrescription';
import DoctorPrescriptionsList from '../../components/doctor/PrescriptionsList';
import RequestLabTest from '../../components/doctor/RequestLabTest';
import { getAppointments } from '../../services/appointmentService';
import { getPrescriptions } from '../../services/prescriptionService';
import AIConsultation from '../../components/doctor/AIConsultation';
import AIHistory from '../../components/doctor/AIHistory';
import AIPerformance from '../../components/doctor/AIPerformance';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ 
    pending: 0, 
    accepted: 0, 
    completed: 0, 
    prescriptions: 0,
    patients: 0 
  });
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🏠', color: 'blue' },
    { id: 'appointments', label: 'Appointments', icon: '📅', color: 'purple' },
    { id: 'patients', label: 'My Patients', icon: '👥', color: 'green' },
    { id: 'prescription', label: 'Create Prescription', icon: '💊', color: 'pink' },
    { id: 'prescriptions', label: 'My Prescriptions', icon: '📋', color: 'indigo' },
    { id: 'lab-request', label: 'Request Lab Test', icon: '🔬', color: 'cyan' },
    { id: 'ai-consultation', label: 'AI Consultation', icon: '🤖', color: 'violet' },
    { id: 'ai-history', label: 'AI History', icon: '📊', color: 'teal' },
    { id: 'ai-performance', label: 'AI Performance', icon: '🧠', color: 'amber' }
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [appts, presc] = await Promise.all([
        getAppointments(),
        getPrescriptions()
      ]);
      
      const appointments = appts.data || [];
      const uniquePatients = new Set();
      appointments.forEach(apt => {
        if (apt.patient) uniquePatients.add(apt.patient._id);
      });

      setStats({
        pending: appointments.filter(a => a.status === 'pending').length,
        accepted: appointments.filter(a => a.status === 'accepted').length,
        completed: appointments.filter(a => a.status === 'completed').length,
        prescriptions: presc.data?.length || 0,
        patients: uniquePatients.size
      });
    } catch (err) {
      console.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab stats={stats} user={user} setActiveTab={setActiveTab} />;
      case 'appointments':
        return <AppointmentRequests onUpdate={fetchStats} />;
      case 'patients':
        return <MyPatients />;
      case 'prescription':
        return <CreatePrescription />;
      case 'prescriptions':
        return <DoctorPrescriptionsList />;
      case 'lab-request':
        return <RequestLabTest />;
      case 'ai-consultation':
        return <AIConsultation />;
      case 'ai-history':
        return <AIHistory />;
      case 'ai-performance':
        return <AIPerformance />;
      default:
        return null;
    }
  };

  if (loading) return <LoadingSpinner message="Loading dashboard..." fullScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
              👨‍⚕️
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, Dr. {user.name}! 👋
              </h1>
              <p className="text-gray-600 mt-1">{user.specialization} • {user.qualification}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden animate-slide-in">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center space-x-3 px-6 py-4 text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{tab.icon}</span>
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const OverviewTab = ({ stats, user, setActiveTab }) => (
  <div className="space-y-6">
    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      <StatsCard title="Pending" value={stats.pending} icon="⏳" color="orange" />
      <StatsCard title="Upcoming" value={stats.accepted} icon="📅" color="blue" />
      <StatsCard title="Completed" value={stats.completed} icon="✅" color="green" />
      <StatsCard title="Prescriptions" value={stats.prescriptions} icon="💊" color="purple" />
      <StatsCard title="Total Patients" value={stats.patients} icon="👥" color="red" />
    </div>

    {/* Profile & Quick Actions */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Profile Card */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <h3 className="text-lg font-bold mb-6 flex items-center">
          <span className="mr-2">👨‍⚕️</span>
          Your Profile
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg">
              {user.name?.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-xl">Dr. {user.name}</p>
              <p className="text-blue-100">{user.specialization}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/20">
            <div>
              <p className="text-blue-200 text-xs mb-1">Experience</p>
              <p className="font-bold">{user.experience} Years</p>
            </div>
            <div>
              <p className="text-blue-200 text-xs mb-1">Qualification</p>
              <p className="font-bold">{user.qualification}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <span className="mr-2">⚡</span>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            icon="📅"
            title="View Appointments"
            description={`${stats.pending} pending requests`}
            gradient="from-orange-500 to-red-500"
            onClick={() => setActiveTab('appointments')}
          />
          <QuickActionCard
            icon="👥"
            title="My Patients"
            description={`${stats.patients} total patients`}
            gradient="from-green-500 to-emerald-500"
            onClick={() => setActiveTab('patients')}
          />
          <QuickActionCard
            icon="💊"
            title="Create Prescription"
            description="Write new prescription"
            gradient="from-purple-500 to-pink-500"
            onClick={() => setActiveTab('prescription')}
          />
          <QuickActionCard
            icon="🔬"
            title="Request Lab Test"
            description="Order lab tests"
            gradient="from-blue-500 to-cyan-500"
            onClick={() => setActiveTab('lab-request')}
          />
          <QuickActionCard
            icon="🤖"
            title="AI Consultation"
            description="Start AI-assisted analysis"
            gradient="from-violet-500 to-purple-500"
            onClick={() => setActiveTab('ai-consultation')}
          />
          <QuickActionCard
            icon="🧠"
            title="AI Performance"
            description="View metrics & health"
            gradient="from-amber-500 to-orange-500"
            onClick={() => setActiveTab('ai-performance')}
          />
        </div>
      </div>
    </div>
  </div>
);

const QuickActionCard = ({ icon, title, description, gradient, onClick }) => (
  <button
    onClick={onClick}
    className="group relative overflow-hidden bg-white hover:shadow-xl border-2 border-gray-100 hover:border-transparent rounded-2xl p-6 text-left transition-all duration-300"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
    <div className="relative z-10">
      <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h4 className="font-bold text-gray-900 group-hover:text-white mb-1 transition-colors">{title}</h4>
      <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors">{description}</p>
    </div>
  </button>
);

export default DoctorDashboard;