// src/components/doctor/ai/SymptomInput.jsx
// Search and select symptoms from the AI engine's symptom database

import { useState, useEffect, useRef } from 'react';
import { getAllSymptoms } from '../../../services/aiAssistantService';

const SymptomInput = ({ onSubmit, disabled }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [allSymptoms, setAllSymptoms] = useState([]);
  const [filteredSymptoms, setFilteredSymptoms] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAllSymptoms();
        if (res.success) setAllSymptoms(res.data?.symptoms || res.symptoms || []);
      } catch (e) { console.error('Failed to load symptoms:', e); }
    };
    load();
  }, []);

  useEffect(() => {
    if (inputValue.trim()) {
      const search = inputValue.toLowerCase();
      const filtered = allSymptoms.filter(s =>
        (s.display?.toLowerCase().includes(search) || s.key?.toLowerCase().includes(search)) &&
        !selectedSymptoms.includes(s.key)
      );
      setFilteredSymptoms(filtered.slice(0, 8));
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [inputValue, allSymptoms, selectedSymptoms]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addSymptom = (symptom) => {
    if (!selectedSymptoms.includes(symptom.key)) {
      setSelectedSymptoms(prev => [...prev, symptom.key]);
    }
    setInputValue('');
    setShowDropdown(false);
  };

  const removeSymptom = (key) => {
    setSelectedSymptoms(prev => prev.filter(s => s !== key));
  };

  const getDisplayName = (key) => {
    const found = allSymptoms.find(s => s.key === key);
    return found ? found.display : key.replace(/_/g, ' ');
  };

  const handleSubmit = () => {
    if (selectedSymptoms.length > 0 && onSubmit) {
      onSubmit(selectedSymptoms);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">📝</div>
        <div>
          <h3 className="font-bold text-gray-900">Patient Symptoms</h3>
          <p className="text-xs text-gray-400">Enter symptoms the patient reported</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search symptoms... (e.g. fever, headache)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full px-4 py-3 pl-12 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 text-gray-800"
            disabled={disabled}
          />
        </div>

        {/* Dropdown */}
        {showDropdown && filteredSymptoms.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-64 overflow-y-auto">
            {filteredSymptoms.map(s => (
              <button
                key={s.key}
                onClick={() => addSymptom(s)}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
              >
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-medium text-gray-700">{s.display}</span>
                <span className="text-xs text-gray-400 ml-auto">{s.key}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Symptoms */}
      {selectedSymptoms.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Selected Symptoms ({selectedSymptoms.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedSymptoms.map(key => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium group"
              >
                {getDisplayName(key)}
                <button
                  onClick={() => removeSymptom(key)}
                  className="w-4 h-4 rounded-full bg-blue-200 text-blue-600 flex items-center justify-center hover:bg-red-400 hover:text-white transition-colors"
                  disabled={disabled}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={selectedSymptoms.length === 0 || disabled}
        className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
      >
        <span>🔬</span>
        <span>Analyze with AI ({selectedSymptoms.length} symptoms)</span>
      </button>
    </div>
  );
};

export default SymptomInput;
