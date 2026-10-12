import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <span className="text-sm font-medium">🚀 AI-Powered Healthcare Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Your Complete Digital<br />
              <span className="text-blue-200">Healthcare Solution</span>
            </h1>
            
            <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
              Connect with doctors, get AI symptom analysis, manage prescriptions,
              and receive medicines - all in one intelligent platform
            </p>
            
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link 
                  to="/register" 
                  className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Get Started Free →
                </Link>
                <Link 
                  to="/login" 
                  className="bg-blue-500/20 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-500/30 transition"
                >
                  Sign In
                </Link>
              </div>
            )}

            {isAuthenticated && (
              <Link 
                to="/dashboard" 
                className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition shadow-lg"
              >
                Go to Dashboard →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for Better Healthcare
          </h2>
          <p className="text-xl text-gray-600">
            Powered by artificial intelligence and modern technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon="🤖"
            title="AI Symptom Analysis"
            description="Get instant disease predictions based on your symptoms using advanced machine learning"
            gradient="from-blue-500 to-cyan-500"
          />
          <FeatureCard
            icon="👨‍⚕️"
            title="Book Appointments"
            description="Schedule consultations with top doctors across multiple specializations instantly"
            gradient="from-green-500 to-emerald-500"
          />
          <FeatureCard
            icon="💊"
            title="Digital Prescriptions"
            description="Access all your prescriptions digitally, anytime, anywhere with complete medicine details"
            gradient="from-purple-500 to-pink-500"
          />
          <FeatureCard
            icon="🚚"
            title="Medicine Delivery"
            description="Order medicines online and get them delivered to your doorstep with tracking"
            gradient="from-orange-500 to-red-500"
          />
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple, fast, and efficient healthcare management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <StepCard number="1" title="Enter Symptoms" description="Tell our AI about your health concerns" />
            <StepCard number="2" title="Get Predictions" description="Receive instant disease predictions" />
            <StepCard number="3" title="Book Doctor" description="Schedule with recommended specialists" />
            <StepCard number="4" title="Get Treatment" description="Receive prescriptions and medicines" />
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <StatCard number="95%" label="AI Accuracy" />
            <StatCard number="40+" label="Diseases Detected" />
            <StatCard number="50+" label="Symptoms Analyzed" />
            <StatCard number="10+" label="Specializations" />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Healthcare Experience?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users managing their health digitally
          </p>
          {!isAuthenticated && (
            <Link 
              to="/register" 
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition shadow-lg"
            >
              Get Started Now - It's Free
            </Link>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="bg-blue-600 p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">HealthCare AI</span>
          </div>
          <p className="text-sm">
            © 2024 Healthcare Management System. All rights reserved.
          </p>
          <p className="text-xs mt-2">
            AI-powered healthcare platform for better patient care
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, gradient }) => (
  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-2">
    <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

const StepCard = ({ number, title, description }) => (
  <div className="text-center">
    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 shadow-lg">
      {number}
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const StatCard = ({ number, label }) => (
  <div>
    <div className="text-4xl font-bold mb-2">{number}</div>
    <div className="text-blue-200">{label}</div>
  </div>
);

export default Home;