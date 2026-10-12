# modules/explainer.py

"""
Explains WHY the AI made a specific prediction
Makes the system more trustworthy for doctors
"""

import numpy as np
import joblib
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config


class PredictionExplainer:
    """
    Explains AI predictions using feature importance
    Tells doctor WHICH symptoms influenced the decision most
    """

    def __init__(self):
        self.model = None
        self.feature_columns = None
        self._load()

    def _load(self):
        try:
            self.model = joblib.load(Config.MODEL_PATH)
            self.feature_columns = joblib.load(Config.FEATURES_PATH)
        except Exception as e:
            print(f"   Explainer load error: {e}")

    def explain_prediction(
        self,
        symptoms: list,
        predicted_disease: str
    ) -> dict:
        """
        Explain why AI predicted this disease
        Returns top contributing symptoms
        """

        if not hasattr(self.model, 'feature_importances_'):
            return {
                "explanation": "Explanation not available for this model type",
                "key_symptoms": symptoms[:3]
            }

        try:
            # Get feature importances
            importances = self.model.feature_importances_

            # Map symptoms to their importances
            symptom_importances = []
            for symptom in symptoms:
                normalized = symptom.lower().replace(' ', '_')
                if normalized in self.feature_columns:
                    idx = list(self.feature_columns).index(normalized)
                    importance = importances[idx]
                    symptom_importances.append({
                        "symptom": symptom,
                        "importance": round(float(importance) * 100, 2),
                        "contribution": (
                            "Strong" if importance > 0.05 else
                            "Moderate" if importance > 0.01 else
                            "Weak"
                        )
                    })

            # Sort by importance
            symptom_importances.sort(
                key=lambda x: x["importance"],
                reverse=True
            )

            top_symptoms = symptom_importances[:5]

            explanation = self._build_explanation(
                predicted_disease, top_symptoms
            )

            return {
                "predicted_disease": predicted_disease,
                "explanation": explanation,
                "key_symptoms": top_symptoms,
                "confidence_factors": self._get_confidence_factors(
                    symptom_importances
                )
            }

        except Exception as e:
            return {"error": str(e)}

    def _build_explanation(self, disease, top_symptoms):
        """Build human readable explanation"""
        if not top_symptoms:
            return f"Predicted {disease} based on symptom pattern"

        top_3 = [s["symptom"].replace("_", " ") for s in top_symptoms[:3]]
        return (
            f"AI predicted {disease} primarily because of: "
            f"{', '.join(top_3)}. "
            f"These symptoms have the highest association with {disease} "
            f"in the training data."
        )

    def _get_confidence_factors(self, symptom_importances):
        strong = [s for s in symptom_importances if s["contribution"] == "Strong"]
        moderate = [s for s in symptom_importances if s["contribution"] == "Moderate"]
        return {
            "strong_indicators": len(strong),
            "moderate_indicators": len(moderate),
            "overall_evidence": (
                "Strong" if len(strong) >= 3 else
                "Moderate" if len(strong) >= 1 else
                "Weak"
            )
        }