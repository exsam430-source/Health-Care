import { useState, useEffect } from 'react';
import { getAppointments } from '../../services/appointmentService';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

const MyPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await getAppointments();
      const appointments = data.data || [];
      
      const patientMap = new Map();
      appointments.forEach(apt => {
        if (apt.patient && !patientMap.has(apt.patient._id)) {
          patientMap.set(apt.patient._id, {
            ...apt.patient,
            appointmentCount: 1,
            lastVisit: apt.appointmentDate,
            lastDiagnosis: apt.diagnosis || 'N/A',
            status: apt.status,
            completedVisits: apt.status === 'completed' ? 1 : 0
          });
        } else if (apt.patient) {
          const existing = patientMap.get(apt.patient._id);
          existing.appointmentCount++;
          if (apt.status === 'completed') existing.completedVisits++;
          if (new Date(apt.appointmentDate) > new Date(existing.lastVisit)) {
            existing.lastVisit = apt.appointmentDate;
            existing.lastDiagnosis = apt.diagnosis || 'N/A';
            existing.status = apt.status;
          }
        }
      });
      
      setPatients(Array.from(patientMap.values()));
    } catch (err) {
      console.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  );

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    switch(sortBy) {
      case 'recent':
        return new Date(b.lastVisit) - new Date(a.lastVisit);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'visits':
        return b.appointmentCount - a.appointmentCount;
      default:
        return 0;
    }
  });

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  if (loading) return <LoadingSpinner message="Loading patients..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Patients</p>
              <p className="text-4xl font-bold mt-2">{patients.length}</p>
            </div>
            <div className="text-5xl opacity-20">👥</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Active This Month</p>
              <p className="text-4xl font-bold mt-2">
                {patients.filter(p => {
                  const lastVisit = new Date(p.lastVisit);
                  const now = new Date();
                  return lastVisit.getMonth() === now.getMonth() && lastVisit.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="text-5xl opacity-20">📈</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Consultations</p>
              <p className="text-4xl font-bold mt-2">
                {patients.reduce((sum, p) => sum + p.appointmentCount, 0)}
              </p>
            </div>
            <div className="text-5xl opacity-20">💼</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Avg Visits/Patient</p>
              <p className="text-4xl font-bold mt-2">
                {patients.length > 0 ? (patients.reduce((sum, p) => sum + p.appointmentCount, 0) / patients.length).toFixed(1) : 0}
              </p>
            </div>
            <div className="text-5xl opacity-20">📊</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="🔍 Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="recent">Sort by: Recent</option>
            <option value="name">Sort by: Name</option>
            <option value="visits">Sort by: Most Visits</option>
          </select>
        </div>
      </div>

      {/* Patients Grid */}
      {sortedPatients.length === 0 ? (
        <EmptyState 
          icon="👥" 
          title={search ? "No Patients Found" : "No Patients Yet"} 
          message={search ? "Try different search terms" : "You haven't consulted any patients yet"} 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPatients.map((patient) => (
            <div key={patient._id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden">
              {/* Patient Header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 text-white">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                    {patient.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xl truncate">{patient.name}</h3>
                    <p className="text-blue-100 text-sm truncate">{patient.email}</p>
                  </div>
                </div>
              </div>

              {/* Patient Details */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-xs text-blue-600 font-semibold mb-1">Age</p>
                    <p className="text-lg font-bold text-blue-900">{patient.age} yrs</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3">
                    <p className="text-xs text-purple-600 font-semibold mb-1">Gender</p>
                    <p className="text-lg font-bold text-purple-900 capitalize">{patient.gender}</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3">
                    <p className="text-xs text-red-600 font-semibold mb-1">Blood Group</p>
                    <p className="text-lg font-bold text-red-900">{patient.bloodGroup}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-xs text-green-600 font-semibold mb-1">Visits</p>
                    <p className="text-lg font-bold text-green-900">{patient.appointmentCount}</p>
                  </div>
                </div>

                {/* Contact */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <span className="mr-2">📱</span>
                    <span className="font-medium">{patient.phone}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📧</span>
                    <span className="font-medium truncate">{patient.email}</span>
                  </div>
                </div>

                {/* Last Visit */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                  <p className="text-xs text-indigo-600 font-bold mb-2 flex items-center">
                    <span className="mr-2">🕒</span>
                    Last Visit
                  </p>
                  <p className="text-sm font-bold text-indigo-900">{formatDate(patient.lastVisit)}</p>
                  {patient.lastDiagnosis !== 'N/A' && (
                    <p className="text-xs text-indigo-700 mt-2 line-clamp-2">{patient.lastDiagnosis}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPatients;