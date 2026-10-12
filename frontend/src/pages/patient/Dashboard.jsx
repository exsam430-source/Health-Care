import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/common/StatsCard';
import AISymptomChecker from '../../components/patient/AISymptomChecker';
import AppointmentsList from '../../components/patient/AppointmentsList';
import PrescriptionsList from '../../components/patient/PrescriptionsList';
import LabReportsList from '../../components/patient/LabReportsList';
import MedicineOrdersList from '../../components/patient/MedicineOrdersList';
import { getAppointments } from '../../services/appointmentService';
import { getPrescriptions } from '../../services/prescriptionService';
import { getLabReports } from '../../services/labService';
import { getMedicineOrders } from '../../services/pharmacyService';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    appointments: 0,
    prescriptions: 0,
    labReports: 0,
    medicineOrders: 0
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🏠', color: 'blue' },
    { id: 'symptom-checker', label: 'AI Symptom Checker', icon: '🤖', color: 'purple' },
    { id: 'appointments', label: 'Appointments', icon: '📅', color: 'indigo' },
    { id: 'prescriptions', label: 'Prescriptions', icon: '💊', color: 'pink' },
    { id: 'lab-reports', label: 'Lab Reports', icon: '🔬', color: 'blue' },
    { id: 'medicines', label: 'Medicine Orders', icon: '🚚', color: 'green' }
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [appts, presc, labs, meds] = await Promise.all([
        getAppointments(),
        getPrescriptions(),
        getLabReports(),
        getMedicineOrders()
      ]);
      setStats({
        appointments: appts.data?.length || 0,
        prescriptions: presc.data?.length || 0,
        labReports: labs.data?.length || 0,
        medicineOrders: meds.data?.length || 0
      });
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard 
                title="Appointments" 
                value={stats.appointments} 
                icon="📅" 
                color="blue"
                trend="+12%"
              />
              <StatsCard 
                title="Prescriptions" 
                value={stats.prescriptions} 
                icon="💊" 
                color="purple"
                trend="+5%"
              />
              <StatsCard 
                title="Lab Reports" 
                value={stats.labReports} 
                icon="🔬" 
                color="indigo"
                trend="+8%"
              />
              <StatsCard 
                title="Medicine Orders" 
                value={stats.medicineOrders} 
                icon="🚚" 
                color="green"
                trend="+15%"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <span>⚡</span>
                <span>Quick Actions</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setActiveTab('symptom-checker')}
                  className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 hover:shadow-2xl transform hover:-translate-y-2 transition-all"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative flex items-center space-x-4">
                    <span className="text-5xl">🤖</span>
                    <div className="text-left text-white">
                      <h3 className="font-bold text-xl mb-1">AI Symptom Checker</h3>
                      <p className="text-blue-100">Get instant health insights</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('appointments')}
                  className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 hover:shadow-2xl transform hover:-translate-y-2 transition-all"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative flex items-center space-x-4">
                    <span className="text-5xl">📅</span>
                    <div className="text-left text-white">
                      <h3 className="font-bold text-xl mb-1">My Appointments</h3>
                      <p className="text-green-100">View upcoming visits</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('prescriptions')}
                  className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 hover:shadow-2xl transform hover:-translate-y-2 transition-all"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative flex items-center space-x-4">
                    <span className="text-5xl">💊</span>
                    <div className="text-left text-white">
                      <h3 className="font-bold text-xl mb-1">Prescriptions</h3>
                      <p className="text-purple-100">Order medicines online</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('lab-reports')}
                  className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 hover:shadow-2xl transform hover:-translate-y-2 transition-all"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative flex items-center space-x-4">
                    <span className="text-5xl">🔬</span>
                    <div className="text-left text-white">
                      <h3 className="font-bold text-xl mb-1">Lab Reports</h3>
                      <p className="text-orange-100">View test results</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Profile Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-2xl p-8 text-white">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-black mb-2">Your Health Profile</h2>
                  <p className="text-blue-100">Personal health information</p>
                </div>
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl">
                  👤
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white/20 backdrop-blur-lg rounded-xl p-4 border border-white/30">
                  <p className="text-blue-100 text-sm mb-1">Name</p>
                  <p className="font-bold text-lg">{user.name}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-lg rounded-xl p-4 border border-white/30">
                  <p className="text-blue-100 text-sm mb-1">Email</p>
                  <p className="font-bold text-sm truncate">{user.email}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-lg rounded-xl p-4 border border-white/30">
                  <p className="text-blue-100 text-sm mb-1">Age</p>
                  <p className="font-bold text-lg">{user.age} years</p>
                </div>
                <div className="bg-white/20 backdrop-blur-lg rounded-xl p-4 border border-white/30">
                  <p className="text-blue-100 text-sm mb-1">Blood Group</p>
                  <p className="font-bold text-lg">{user.bloodGroup}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'symptom-checker':
        return <AISymptomChecker />;
      case 'appointments':
        return <AppointmentsList />;
      case 'prescriptions':
        return <PrescriptionsList />;
      case 'lab-reports':
        return <LabReportsList />;
      case 'medicines':
        return <MedicineOrdersList />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            Welcome back, {user.name}! 👋
          </h1>
          <p className="text-gray-600 text-lg">Manage your health journey from one place</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 mb-8 overflow-hidden">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 px-6 py-5 text-sm font-bold whitespace-nowrap border-b-4 transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="animate-fadeIn">
          {renderContent()}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PatientDashboard;