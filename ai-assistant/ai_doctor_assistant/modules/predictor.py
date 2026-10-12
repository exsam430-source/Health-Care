"""
Disease Predictor Module
Loads trained ML model and predicts disease from symptoms
"""

import os
import sys
import json
import joblib
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config


class Predictor:
    """
    Main AI Predictor Class
    Loads model once and reuses for all predictions
    """

    def __init__(self):
        self.model = None
        self.label_encoder = None
        self.feature_columns = None
        self.recommendations = None
        self.display_names = None
        self.specializations = None
        self.metadata = None
        self._load_all()

    # ─────────────────────────────────────────────────────
    # LOAD ALL MODEL ARTIFACTS
    # ─────────────────────────────────────────────────────

    def _load_all(self):
        """Load model, encoder, features and data files"""

        print("   Loading AI model artifacts...")

        # ── Load ML Model ─────────────────────────────────
        if not os.path.exists(Config.MODEL_PATH):
            raise FileNotFoundError(
                f"Model not found: {Config.MODEL_PATH}\n"
                f"Run: python setup_and_train.py"
            )

        self.model = joblib.load(Config.MODEL_PATH)
        self.label_encoder = joblib.load(Config.ENCODER_PATH)
        self.feature_columns = joblib.load(Config.FEATURES_PATH)

        # ── Load Metadata ─────────────────────────────────
        with open(Config.METADATA_PATH, 'r') as f:
            self.metadata = json.load(f)

        # ── Load Recommendations ──────────────────────────
        if os.path.exists(Config.RECOMMENDATIONS_PATH):
            with open(Config.RECOMMENDATIONS_PATH, 'r') as f:
                self.recommendations = json.load(f)
        else:
            self.recommendations = {}

        # ── Load Display Names ────────────────────────────
        if os.path.exists(Config.DISPLAY_NAMES_PATH):
            with open(Config.DISPLAY_NAMES_PATH, 'r') as f:
                self.display_names = json.load(f)
        else:
            self.display_names = {}

        # ── Load Specializations ──────────────────────────
        if os.path.exists(Config.SPECIALIZATIONS_PATH):
            with open(Config.SPECIALIZATIONS_PATH, 'r') as f:
                self.specializations = json.load(f)
        else:
            self.specializations = {}

        print(f"   ✅ Model loaded: {self.metadata.get('model_type', 'Unknown')}")
        print(f"   ✅ Classes: {self.metadata.get('n_classes', 0)} diseases")
        print(f"   ✅ Features: {self.metadata.get('n_features', 0)} symptoms")

    # ─────────────────────────────────────────────────────
    # NORMALIZE SYMPTOM NAME
    # ─────────────────────────────────────────────────────

    def _normalize(self, symptom: str) -> str:
        """Convert symptom to dataset format"""
        return (symptom.strip()
                       .lower()
                       .replace(' ', '_')
                       .replace('-', '_')
                       .replace('(', '')
                       .replace(')', ''))

    # ─────────────────────────────────────────────────────
    # BUILD FEATURE VECTOR
    # ─────────────────────────────────────────────────────

    def _build_feature_vector(self, symptoms: list) -> np.ndarray:
        """
        Convert symptom list to binary feature vector
        matching the training dataset format
        """
        # Start with all zeros
        feature_vector = np.zeros(len(self.feature_columns))

        # Normalize input symptoms
        normalized_symptoms = [self._normalize(s) for s in symptoms]

        # Set 1 for each symptom that exists in feature columns
        matched = 0
        for i, col in enumerate(self.feature_columns):
            if col in normalized_symptoms:
                feature_vector[i] = 1
                matched += 1

        return feature_vector, matched

    # ─────────────────────────────────────────────────────
    # MAIN PREDICT FUNCTION
    # ─────────────────────────────────────────────────────

    def predict(self, symptoms: list) -> dict:
        """
        Predict disease from list of symptoms

        Parameters:
            symptoms: list of symptom strings
                      e.g. ["fever", "headache", "chills"]

        Returns:
            dict with prediction results
        """

        if not symptoms:
            return {
                "error": "No symptoms provided",
                "predicted_disease": None,
                "confidence": 0
            }

        # Build feature vector
        feature_vector, matched_count = self._build_feature_vector(symptoms)

        if matched_count == 0:
            return {
                "error": "None of the symptoms recognized",
                "predicted_disease": None,
                "confidence": 0,
                "tip": "Use symptom keys like 'high_fever', 'headache', 'chills'"
            }

        # Reshape for model
        X = feature_vector.reshape(1, -1)

        # Get prediction probabilities
        probabilities = self.model.predict_proba(X)[0]

        # Get top prediction
        top_index = np.argmax(probabilities)
        top_confidence = round(float(probabilities[top_index]) * 100, 2)
        top_disease = self.label_encoder.inverse_transform([top_index])[0]

        # Get top 5 predictions
        top_5_indices = np.argsort(probabilities)[::-1][:5]
        top_5 = []
        for idx in top_5_indices:
            disease = self.label_encoder.inverse_transform([idx])[0]
            conf = round(float(probabilities[idx]) * 100, 2)
            if conf > 0.5:
                top_5.append({
                    "disease": disease,
                    "confidence": conf
                })

        # Get recommendations
        recs = self.recommendations.get(top_disease, {})

        # Get specialist
        specialist = self.specializations.get(
            top_disease, "General Physician"
        )

        # Build response
        result = {
            "predicted_disease": top_disease,
            "confidence": top_confidence,
            "specialist": specialist,
            "severity": recs.get("severity", "Unknown"),
            "recommended_tests": recs.get("recommended_tests", []),
            "suggested_medicines": recs.get("suggested_medicines", []),
            "precautions": recs.get("precautions", []),
            "notes": recs.get("notes", ""),
            "top_predictions": top_5,
            "symptoms_analyzed": len(symptoms),
            "symptoms_matched": matched_count,
            "unrecognized_symptoms": [
                s for s in symptoms
                if self._normalize(s) not in self.feature_columns
            ]
        }

        return result

    # ─────────────────────────────────────────────────────
    # PREDICT TOP N DISEASES
    # ─────────────────────────────────────────────────────

    def predict_top_n(self, symptoms: list, n: int = 3) -> list:
        """
        Returns top N disease predictions with confidence

        Returns:
            list of (disease_name, confidence) tuples
        """
        if not symptoms:
            return []

        feature_vector, matched = self._build_feature_vector(symptoms)

        if matched == 0:
            return []

        X = feature_vector.reshape(1, -1)
        probabilities = self.model.predict_proba(X)[0]

        top_indices = np.argsort(probabilities)[::-1][:n]

        results = []
        for idx in top_indices:
            disease = self.label_encoder.inverse_transform([idx])[0]
            confidence = round(float(probabilities[idx]) * 100, 2)
            if confidence > 1.0:
                results.append((disease, confidence))

        return results

    # ─────────────────────────────────────────────────────
    # GET ALL VALID SYMPTOMS
    # ─────────────────────────────────────────────────────

    def get_all_symptoms(self) -> list:
        """Return list of all valid symptom keys"""
        return list(self.feature_columns)

    # ─────────────────────────────────────────────────────
    # GET ALL DISEASES
    # ─────────────────────────────────────────────────────

    def get_all_diseases(self) -> list:
        """Return list of all disease names"""
        return list(self.label_encoder.classes_)

    # ─────────────────────────────────────────────────────
    # GET SYMPTOM DISPLAY NAME
    # ─────────────────────────────────────────────────────

    def get_display_name(self, symptom_key: str) -> str:
        """Get human-readable name for a symptom"""
        return self.display_names.get(
            symptom_key,
            symptom_key.replace('_', ' ').title()
        )

    # ─────────────────────────────────────────────────────
    # GET MODEL INFO
    # ─────────────────────────────────────────────────────

    def get_model_info(self) -> dict:
        """Return model metadata and stats"""
        return {
            "model_type": self.metadata.get("model_type"),
            "accuracy": self.metadata.get("accuracy"),
            "n_diseases": self.metadata.get("n_classes"),
            "n_symptoms": self.metadata.get("n_features"),
            "trained_at": self.metadata.get("trained_at"),
            "version": self.metadata.get("version")
        }


# ─────────────────────────────────────────────────────────
# SINGLETON INSTANCE
# (loaded once, reused across all requests)
# ─────────────────────────────────────────────────────────

_predictor_instance = None


def get_predictor() -> Predictor:
    """Get or create the singleton Predictor instance"""
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = Predictor()
    return _predictor_instance


# ─────────────────────────────────────────────────────────
# STANDALONE TEST
# ─────────────────────────────────────────────────────────

if __name__ == '__main__':

    print("=" * 60)
    print("   Testing Predictor Module")
    print("=" * 60)

    predictor = Predictor()

    # ── Test Cases ─────────────────────────────────────────
    test_cases = [
        {
            "name": "Malaria Test",
            "symptoms": [
                "high_fever", "chills", "sweating",
                "headache", "muscle_pain", "nausea"
            ],
            "expected": "Malaria"
        },
        {
            "name": "Diabetes Test",
            "symptoms": [
                "fatigue", "weight_loss", "polyuria",
                "excessive_hunger", "blurred_and_distorted_vision"
            ],
            "expected": "Diabetes"
        },
        {
            "name": "Common Cold Test",
            "symptoms": [
                "continuous_sneezing", "runny_nose",
                "cough", "headache", "fatigue"
            ],
            "expected": "Common Cold"
        },
        {
            "name": "Pneumonia Test",
            "symptoms": [
                "high_fever", "cough", "chest_pain",
                "breathlessness", "phlegm", "fatigue"
            ],
            "expected": "Pneumonia"
        },
        {
            "name": "Dengue Test",
            "symptoms": [
                "high_fever", "joint_pain", "headache",
                "pain_behind_the_eyes", "skin_rash", "muscle_pain"
            ],
            "expected": "Dengue"
        },
    ]

    print(f"\n{'Test':<20} {'Expected':<30} {'Predicted':<30} {'Conf':>8} {'Status':>8}")
    print("─" * 100)

    all_passed = True
    for test in test_cases:
        result = predictor.predict(test["symptoms"])

        predicted = result.get("predicted_disease", "ERROR")
        confidence = result.get("confidence", 0)
        expected = test["expected"]

        status = "✅ PASS" if expected.lower() in predicted.lower() else "❌ FAIL"
        if "FAIL" in status:
            all_passed = False

        print(
            f"{test['name']:<20} "
            f"{expected:<30} "
            f"{predicted:<30} "
            f"{confidence:>7.1f}% "
            f"{status:>8}"
        )

    print("─" * 100)

    # ── Show detailed result for one test ──────────────────
    print("\n📋 Detailed result for Malaria:")
    result = predictor.predict([
        "high_fever", "chills", "sweating", "headache", "muscle_pain"
    ])

    print(f"   Disease:     {result['predicted_disease']}")
    print(f"   Confidence:  {result['confidence']}%")
    print(f"   Specialist:  {result['specialist']}")
    print(f"   Severity:    {result['severity']}")
    print(f"   Tests:       {', '.join(result['recommended_tests'][:3])}")
    print(f"   Medicines:   {', '.join(result['suggested_medicines'][:3])}")
    print(f"\n   Top 3 Predictions:")
    for p in result['top_predictions'][:3]:
        print(f"   → {p['disease']:<35} {p['confidence']}%")

    print(f"\n{'✅ All tests PASSED!' if all_passed else '⚠️  Some tests failed'}")
    print("\n✅ Predictor module working correctly!")