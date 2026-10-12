// src/components/AI/VoiceSymptomInput.jsx

import { useState, useEffect } from 'react';
import { FiMic, FiMicOff } from 'react-icons/fi';

const VoiceSymptomInput = ({ onSymptomsDetected }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + ' ' + finalTranscript);
          parseSymptoms(finalTranscript);
        }
      };

      setRecognition(rec);
    }
  }, []);

  const parseSymptoms = (text) => {
    // Map common spoken words to symptom keys
    const symptomKeywords = {
      'fever': 'high_fever', 'temperature': 'high_fever',
      'headache': 'headache', 'head pain': 'headache',
      'cough': 'cough', 'coughing': 'cough',
      'vomit': 'vomiting', 'vomiting': 'vomiting',
      'fatigue': 'fatigue', 'tired': 'fatigue', 'weak': 'fatigue',
      'chills': 'chills', 'shivering': 'chills',
      'nausea': 'nausea', 'nauseous': 'nausea',
      'breathing': 'breathlessness', 'breathless': 'breathlessness',
      'chest pain': 'chest_pain', 'chest': 'chest_pain',
      'diarrhea': 'diarrhoea', 'loose stool': 'diarrhoea',
      'rash': 'skin_rash', 'itching': 'itching',
      'joint pain': 'joint_pain', 'back pain': 'back_pain'
    };

    const textLower = text.toLowerCase();
    const detected = [];

    for (const [keyword, symptomKey] of Object.entries(symptomKeywords)) {
      if (textLower.includes(keyword)) {
        detected.push(symptomKey);
      }
    }

    if (detected.length > 0) {
      onSymptomsDetected(detected);
    }
  };

  const toggleListening = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      setTranscript('');
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={toggleListening}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {isListening ? (
          <><FiMicOff className="w-4 h-4" /> Stop Recording</>
        ) : (
          <><FiMic className="w-4 h-4" /> Voice Input</>
        )}
      </button>

      {transcript && (
        <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
          <p className="font-medium mb-1">Heard:</p>
          <p className="italic">"{transcript}"</p>
        </div>
      )}

      {isListening && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
          Listening... speak symptoms clearly
        </div>
      )}
    </div>
  );
};

export default VoiceSymptomInput;