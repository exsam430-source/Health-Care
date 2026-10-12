# modules/severity_predictor.py

import json
import numpy as np
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config


class SeverityPredictor:
    """
    Calculates disease severity score
    based on symptom severity weights
    """

    def __init__(self):
        self.severity_weights = self._load_severity()

    def _load_severity(self):
        severity_path = os.path.join(
            Config.RAW_DATA_DIR, 'symptom_severity.csv'
        )
        weights = {}
        try:
            import pandas as pd
            df = pd.read_csv(severity_path)
            for _, row in df.iterrows():
                sym = str(row['Symptom']).strip().lower().replace(' ', '_')
                weights[sym] = int(row['weight'])
        except Exception as e:
            print(f"   Severity load error: {e}")
        return weights

    def calculate_severity_score(self, symptoms: list) -> dict:
        """
        Calculate patient severity score
        Returns score and risk level
        """
        total_score = 0
        max_possible = 0
        symptom_scores = []

        for symptom in symptoms:
            sym_clean = symptom.lower().replace(' ', '_')
            weight = self.severity_weights.get(sym_clean, 3)
            total_score += weight
            max_possible += 7
            symptom_scores.append({
                "symptom": symptom,
                "weight": weight,
                "level": (
                    "Critical" if weight >= 7 else
                    "High" if weight >= 5 else
                    "Moderate" if weight >= 3 else
                    "Low"
                )
            })

        # Normalize to 0-100
        normalized_score = min(
            round((total_score / max(max_possible, 1)) * 100, 1),
            100
        )

        risk_level = (
            "CRITICAL" if normalized_score >= 75 else
            "HIGH" if normalized_score >= 50 else
            "MODERATE" if normalized_score >= 25 else
            "LOW"
        )

        return {
            "severity_score": normalized_score,
            "risk_level": risk_level,
            "total_weight": total_score,
            "symptom_scores": sorted(
                symptom_scores,
                key=lambda x: x["weight"],
                reverse=True
            ),
            "critical_symptoms": [
                s for s in symptom_scores if s["weight"] >= 6
            ],
            "recommendation": self._get_recommendation(risk_level)
        }

    def _get_recommendation(self, risk_level: str) -> str:
        recommendations = {
            "CRITICAL": "🚨 EMERGENCY — Immediate hospitalization required",
            "HIGH": "⚠️ Urgent medical attention needed within 24 hours",
            "MODERATE": "📋 Schedule appointment within 2-3 days",
            "LOW": "ℹ️ Monitor symptoms, routine checkup recommended"
        }
        return recommendations.get(risk_level, "Consult a doctor")