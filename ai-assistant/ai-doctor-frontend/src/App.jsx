import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import ConsultationPage from './pages/ConsultationPage';
import HistoryPage from './pages/HistoryPage';
import PerformancePage from './pages/PerformancePage';

const App = () => (
  <BrowserRouter>
    <Toaster position="top-right" />
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/consultation" element={<ConsultationPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/performance" element={<PerformancePage />} />
          </Routes>
        </main>
      </div>
    </div>
  </BrowserRouter>
);

export default App;