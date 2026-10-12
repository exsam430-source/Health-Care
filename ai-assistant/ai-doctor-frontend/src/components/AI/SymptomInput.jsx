import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX, FiPlus } from 'react-icons/fi';
import { getAllSymptoms } from '../../api/aiService';

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
      } catch (e) { console.error(e); }
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
    <div className="card">
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
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search symptoms... (e.g. fever, headache)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="input-field pl-12"
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
                className="w-full px-4 py-3 text-left hover:bg-primary-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
              >
                <FiPlus className="w-4 h-4 text-primary-500" />
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium group"
              >
                {getDisplayName(key)}
                <button
                  onClick={() => removeSymptom(key)}
                  className="w-4 h-4 rounded-full bg-primary-200 text-primary-600 flex items-center justify-center hover:bg-red-400 hover:text-white transition-colors"
                  disabled={disabled}
                >
                  <FiX className="w-3 h-3" />
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
        className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
      >
        <span>🔬</span>
        <span>Analyze with AI ({selectedSymptoms.length} symptoms)</span>
      </button>
    </div>
  );
};

export default SymptomInput;