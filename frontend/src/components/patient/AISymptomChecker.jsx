import { useState, useEffect } from 'react';
import { getSymptoms, predictDisease } from '../../services/aiService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import BookAppointmentForm from './BookAppointmentForm';

const AISymptomChecker = () => {
  const [availableSymptoms, setAvailableSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSymptoms, setLoadingSymptoms] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState(null);

  useEffect(() => {
    fetchSymptoms();
  }, []);

  const fetchSymptoms = async () => {
    try {
      const data = await getSymptoms();
      setAvailableSymptoms(data.data || []);
    } catch (err) {
      setError('Failed to load symptoms. Make sure AI server is running.');
    } finally {
      setLoadingSymptoms(false);
    }
  };

  const toggleSymptom = (symptom) => {
    const value = symptom.value;
    if (selectedSymptoms.includes(value)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== value));
    } else {
      setSelectedSymptoms([...selectedSymptoms, value]);
    }
    setPredictions(null);
  };

  const handlePredict = async () => {
    if (selectedSymptoms.length < 2) {
      setError('Please select at least 2 symptoms');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await predictDisease(selectedSymptoms);
      setPredictions(data.data);
    } catch (err) {
      setError(err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedSymptoms([]);
    setPredictions(null);
    setError('');
    setSearchTerm('');
  };

  const handleBookAppointment = (prediction) => {
    setSelectedPrediction(prediction);
    setShowBookingModal(true);
  };

  const filteredSymptoms = availableSymptoms.filter(s =>
    s.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loadingSymptoms) {
    return <LoadingSpinner message="Loading symptoms..." />;
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-8 shadow-2xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full opacity-10"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-white rounded-full opacity-5"></div>
        
        <div className="relative z-10 flex items-start space-x-6">
          <div className="text-6xl animate-pulse">🤖</div>
          <div className="flex-1">
            <h2 className="text-3xl font-black text-white mb-3 tracking-tight">
              AI-Powered Symptom Analysis
            </h2>
            <p className="text-blue-100 text-lg mb-4 leading-relaxed">
              Get instant health insights powered by advanced machine learning
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/20 backdrop-blur-lg rounded-xl p-4 border border-white/30">
                <div className="text-2xl mb-2">✨</div>
                <p className="text-white text-sm font-semibold">Smart Analysis</p>
                <p className="text-blue-100 text-xs">AI-driven predictions</p>
              </div>
              <div className="bg-white/20 backdrop-blur-lg rounded-xl p-4 border border-white/30">
                <div className="text-2xl mb-2">⚡</div>
                <p className="text-white text-sm font-semibold">Instant Results</p>
                <p className="text-blue-100 text-xs">Get diagnosis in seconds</p>
              </div>
              <div className="bg-white/20 backdrop-blur-lg rounded-xl p-4 border border-white/30">
                <div className="text-2xl mb-2">🎯</div>
                <p className="text-white text-sm font-semibold">Accurate Matching</p>
                <p className="text-blue-100 text-xs">Find right specialist</p>
              </div>
            </div>
            <div className="mt-6 flex items-center space-x-2 text-yellow-300 text-sm">
              <span className="text-xl">⚠️</span>
              <p className="italic font-medium">For informational purposes only - Always consult a healthcare professional</p>
            </div>
          </div>
        </div>
      </div>

      {/* Symptom Selection */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-8 py-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Select Your Symptoms</h3>
          <p className="text-gray-600">Choose all symptoms you're experiencing for better accuracy</p>
        </div>

        <div className="p-8">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 text-xl">🔍</span>
              </div>
              <input
                type="text"
                placeholder="Search symptoms (e.g., headache, fever, cough...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
            </div>
          </div>

          {/* Selected Symptoms */}
          {selectedSymptoms.length > 0 && (
            <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">✅</span>
                  <p className="text-lg font-bold text-blue-900">
                    {selectedSymptoms.length} Symptom{selectedSymptoms.length > 1 ? 's' : ''} Selected
                  </p>
                </div>
                <button 
                  onClick={handleReset}
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold underline"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {selectedSymptoms.map(s => (
                  <span 
                    key={s} 
                    className="group inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    {s.replace(/_/g, ' ')}
                    <button 
                      onClick={() => toggleSymptom({ value: s })} 
                      className="ml-2 w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Symptoms Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-2 custom-scrollbar">
            {filteredSymptoms.map((symptom) => (
              <button
                key={symptom.value}
                onClick={() => toggleSymptom(symptom)}
                className={`group p-4 rounded-xl border-2 text-sm font-semibold text-left transition-all transform hover:scale-105 ${
                  selectedSymptoms.includes(symptom.value)
                    ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300 text-gray-700 hover:bg-gray-50 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex-1">{symptom.label}</span>
                  {selectedSymptoms.includes(symptom.value) && (
                    <span className="text-blue-600 text-lg">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={handlePredict}
              disabled={loading || selectedSymptoms.length < 2}
              className="flex-1 relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-5 px-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="relative z-10 text-lg flex items-center justify-center space-x-2">
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Analyzing Symptoms...</span>
                  </>
                ) : (
                  <>
                    <span>🔬</span>
                    <span>Analyze with AI</span>
                  </>
                )}
              </span>
            </button>
            <button 
              onClick={handleReset}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-5 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && <ErrorMessage message={error} />}

      {/* Results */}
      {predictions && (
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-fadeIn">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-6 border-b border-green-200">
            <div className="flex items-center space-x-3">
              <span className="text-4xl">🎯</span>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">AI Diagnosis Results</h3>
                <p className="text-green-700 mt-1">
                  Recommended Specialist: <strong className="text-green-800 text-lg">{predictions.suggestedSpecialization}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {predictions.predictions.map((pred, idx) => (
              <div 
                key={idx} 
                className="group relative bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 hover:shadow-2xl hover:border-blue-300 transition-all transform hover:-translate-y-1"
              >
                {/* Rank Badge */}
                <div className="absolute -top-3 -left-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg ${
                    idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                    idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                    'bg-gradient-to-br from-orange-400 to-red-500'
                  }`}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </div>
                </div>

                <div className="ml-6">
                  <h4 className="text-2xl font-bold text-gray-900 mb-3">{pred.disease}</h4>
                  
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <StatusBadge status={pred.severity} type="severity" />
                    <div className="flex items-center space-x-2 bg-blue-100 px-4 py-2 rounded-full">
                      <span className="text-blue-600 font-semibold">Confidence:</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all"
                            style={{ width: `${pred.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-blue-900 font-bold">{pred.confidence.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 leading-relaxed mb-4 text-lg">{pred.description}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <span className="text-2xl">👨‍⚕️</span>
                      <span className="font-semibold">{pred.specialization}</span>
                    </div>
                    <button
                      onClick={() => handleBookAppointment(pred)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center space-x-2"
                    >
                      <span>📅</span>
                      <span>Book Appointment</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 border-t-2 border-yellow-200 px-8 py-6">
            <div className="flex items-start space-x-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <p className="text-yellow-900 font-semibold mb-1">Important Disclaimer</p>
                <p className="text-yellow-800">{predictions.disclaimer}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="📅 Book Your Appointment"
        size="lg"
      >
        <BookAppointmentForm
          prediction={selectedPrediction}
          symptoms={selectedSymptoms}
          onSuccess={() => {
            setShowBookingModal(false);
            handleReset();
          }}
          onCancel={() => setShowBookingModal(false)}
        />
      </Modal>

      {/* Custom Scrollbar Style */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #3b82f6, #6366f1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #2563eb, #4f46e5);
        }
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
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AISymptomChecker;