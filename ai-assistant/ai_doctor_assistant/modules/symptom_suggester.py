"""
Smart Symptom Suggester Module
Suggests related symptoms based on:
1. Co-occurrence patterns from training data
2. Disease-based symptom profiles
Mimics how a real doctor asks follow-up questions
"""

import os
import sys
import json
import joblib
import numpy as np
from collections import defaultdict

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config


class SymptomSuggester:
    """
    Suggests related symptoms the doctor should ask the patient about
    Based on co-occurrence matrix and disease profiles
    """

    def __init__(self):
        self.cooccurrence_map = None
        self.disease_symptom_map = None
        self.disease_strength_map = None
        self.display_names = None
        self.questions = None
        self._predictor = None
        self._load_all()

    # ─────────────────────────────────────────────────────
    # LOAD DATA
    # ─────────────────────────────────────────────────────

    def _load_all(self):
        """Load all required data files"""

        # Load co-occurrence matrix
        if os.path.exists(Config.COOCCURRENCE_PATH):
            self.cooccurrence_map = joblib.load(Config.COOCCURRENCE_PATH)
        else:
            self.cooccurrence_map = {}
            print("   ⚠️  Co-occurrence matrix not found")

        # Load disease-symptom map
        if os.path.exists(Config.SYMPTOM_MAP_PATH):
            with open(Config.SYMPTOM_MAP_PATH, 'r') as f:
                self.disease_symptom_map = json.load(f)
        else:
            self.disease_symptom_map = {}

        # Load disease strength map
        strength_path = os.path.join(
            Config.PROCESSED_DATA_DIR,
            'disease_symptom_strength.json'
        )
        if os.path.exists(strength_path):
            with open(strength_path, 'r') as f:
                self.disease_strength_map = json.load(f)
        else:
            self.disease_strength_map = {}

        # Load display names
        if os.path.exists(Config.DISPLAY_NAMES_PATH):
            with open(Config.DISPLAY_NAMES_PATH, 'r') as f:
                self.display_names = json.load(f)
        else:
            self.display_names = {}

        # Load questions
        if os.path.exists(Config.QUESTIONS_PATH):
            with open(Config.QUESTIONS_PATH, 'r') as f:
                self.questions = json.load(f)
        else:
            self.questions = {}

    # ─────────────────────────────────────────────────────
    # LAZY LOAD PREDICTOR
    # ─────────────────────────────────────────────────────

    def _get_predictor(self):
        """Lazy load predictor to avoid circular imports"""
        if self._predictor is None:
            from modules.predictor import get_predictor
            self._predictor = get_predictor()
        return self._predictor

    # ─────────────────────────────────────────────────────
    # NORMALIZE
    # ─────────────────────────────────────────────────────

    def _normalize(self, symptom: str) -> str:
        return (symptom.strip()
                       .lower()
                       .replace(' ', '_')
                       .replace('-', '_')
                       .replace('(', '')
                       .replace(')', ''))

    def _get_display_name(self, symptom_key: str) -> str:
        return self.display_names.get(
            symptom_key,
            symptom_key.replace('_', ' ').title()
        )

    def _get_question(self, symptom_key: str) -> str:
        return self.questions.get(
            symptom_key,
            f"Is the patient experiencing {self._get_display_name(symptom_key).lower()}?"
        )

    def _get_relevance_level(self, score: float) -> str:
        if score >= 60:
            return "HIGH"
        elif score >= 30:
            return "MEDIUM"
        else:
            return "LOW"

    # ─────────────────────────────────────────────────────
    # MAIN SUGGEST FUNCTION
    # ─────────────────────────────────────────────────────

    def get_suggestions(
        self,
        current_symptoms: list,
        confirmed_symptoms: list = None,
        denied_symptoms: list = None,
        max_suggestions: int = 6
    ) -> dict:
        """
        Get symptom suggestions based on current symptoms

        Parameters:
            current_symptoms:  symptoms patient already reported
            confirmed_symptoms: AI suggestions doctor confirmed
            denied_symptoms:   AI suggestions patient denied
            max_suggestions:   max number of suggestions to return

        Returns:
            dict with suggestions and early prediction
        """

        confirmed_symptoms = confirmed_symptoms or []
        denied_symptoms = denied_symptoms or []

        if not current_symptoms:
            return {
                "suggestions": [],
                "early_prediction": None,
                "message": "Please provide at least one symptom"
            }

        # Normalize all symptoms
        normalized_current = [self._normalize(s) for s in current_symptoms]
        normalized_confirmed = [self._normalize(s) for s in confirmed_symptoms]
        normalized_denied = [self._normalize(s) for s in denied_symptoms]

        # All symptoms already known (exclude from suggestions)
        already_known = set(
            normalized_current +
            normalized_confirmed +
            normalized_denied
        )

        # All confirmed for prediction
        all_confirmed = normalized_current + normalized_confirmed

        # ── Source 1: Co-occurrence scores ────────────────
        cooccurrence_scores = self._get_cooccurrence_scores(
            normalized_current + normalized_confirmed,
            already_known
        )

        # ── Source 2: Disease-based scores ────────────────
        disease_scores, early_prediction = self._get_disease_based_scores(
            all_confirmed,
            already_known
        )

        # ── Combine scores ────────────────────────────────
        combined = {}

        for sym, score in cooccurrence_scores.items():
            combined[sym] = combined.get(sym, 0) + (score * 0.55)

        for sym, score in disease_scores.items():
            combined[sym] = combined.get(sym, 0) + (score * 0.45)

        # Sort by combined score
        sorted_suggestions = sorted(
            combined.items(),
            key=lambda x: x[1],
            reverse=True
        )

        # ── Format suggestions ────────────────────────────
        formatted = []
        for symptom_key, score in sorted_suggestions[:max_suggestions]:
            display_name = self._get_display_name(symptom_key)
            question = self._get_question(symptom_key)
            relevance = self._get_relevance_level(score)

            formatted.append({
                "symptom_key": symptom_key,
                "symptom_name": display_name,
                "relevance_score": round(score, 2),
                "relevance_level": relevance,
                "doctor_question": question,
                "status": "pending"
            })

        return {
            "suggestions": formatted,
            "early_prediction": early_prediction,
            "total_suggestions": len(formatted),
            "based_on_symptoms": current_symptoms,
            "all_confirmed_so_far": all_confirmed
        }

    # ─────────────────────────────────────────────────────
    # CO-OCCURRENCE SCORES
    # ─────────────────────────────────────────────────────

    def _get_cooccurrence_scores(
        self,
        symptoms: list,
        exclude: set
    ) -> dict:
        """Calculate symptom suggestions based on co-occurrence"""

        scores = {}

        for symptom in symptoms:
            if symptom not in self.cooccurrence_map:
                continue

            related = self.cooccurrence_map[symptom]

            for item in related:
                sym = item.get("symptom", "")
                pct = item.get("percentage", 0)

                if sym in exclude or not sym:
                    continue

                # If a symptom is suggested by multiple current symptoms
                # its score accumulates (higher priority)
                scores[sym] = scores.get(sym, 0) + pct

        return scores

    # ─────────────────────────────────────────────────────
    # DISEASE-BASED SCORES
    # ─────────────────────────────────────────────────────

    def _get_disease_based_scores(
        self,
        symptoms: list,
        exclude: set
    ) -> tuple:
        """
        Get suggestions based on top predicted diseases
        Returns (scores_dict, early_prediction_dict)
        """

        scores = {}
        early_prediction = None

        try:
            predictor = self._get_predictor()
            top_diseases = predictor.predict_top_n(symptoms, n=3)

            if top_diseases:
                # Build early prediction
                top_disease, top_conf = top_diseases[0]
                early_prediction = {
                    "disease": top_disease,
                    "confidence": top_conf,
                    "top_3": [
                        {"disease": d, "confidence": c}
                        for d, c in top_diseases
                    ]
                }

                # Get symptom scores from each top disease
                for disease, disease_conf in top_diseases:
                    if disease not in self.disease_strength_map:
                        continue

                    sym_strengths = self.disease_strength_map[disease]

                    for sym, strength in sym_strengths.items():
                        if sym in exclude:
                            continue

                        # Weight by disease confidence × symptom strength
                        weighted = (disease_conf / 100) * strength * 100
                        scores[sym] = scores.get(sym, 0) + weighted

        except Exception as e:
            print(f"   Disease-based scoring error: {e}")

        return scores, early_prediction

    # ─────────────────────────────────────────────────────
    # UPDATE AFTER RESPONSE
    # ─────────────────────────────────────────────────────

    def update_after_response(
        self,
        current_symptoms: list,
        confirmed_symptoms: list,
        denied_symptoms: list,
        max_suggestions: int = 4
    ) -> dict:
        """
        Get fresh suggestions after doctor confirms/denies a symptom
        Excludes all previously seen symptoms
        """
        return self.get_suggestions(
            current_symptoms=current_symptoms,
            confirmed_symptoms=confirmed_symptoms,
            denied_symptoms=denied_symptoms,
            max_suggestions=max_suggestions
        )

    # ─────────────────────────────────────────────────────
    # GET FINAL PREDICTION WITH ALL SYMPTOMS
    # ─────────────────────────────────────────────────────

    def finalize(
        self,
        original_symptoms: list,
        confirmed_additional: list,
        denied_symptoms: list
    ) -> dict:
        """
        Get final prediction using all confirmed symptoms
        """
        all_confirmed = original_symptoms + confirmed_additional

        if not all_confirmed:
            return {"error": "No symptoms available for prediction"}

        try:
            predictor = self._get_predictor()
            result = predictor.predict(all_confirmed)

            total_suggested = len(confirmed_additional) + len(denied_symptoms)
            acceptance_rate = (
                round(len(confirmed_additional) / total_suggested * 100, 1)
                if total_suggested > 0 else 0
            )

            return {
                "all_confirmed_symptoms": all_confirmed,
                "denied_symptoms": denied_symptoms,
                "final_prediction": result,
                "symptom_summary": {
                    "patient_reported": len(original_symptoms),
                    "ai_suggested_confirmed": len(confirmed_additional),
                    "ai_suggested_denied": len(denied_symptoms),
                    "total_confirmed": len(all_confirmed),
                    "suggestion_acceptance_rate": acceptance_rate
                }
            }

        except Exception as e:
            return {"error": str(e)}


# ─────────────────────────────────────────────────────────
# SINGLETON
# ─────────────────────────────────────────────────────────

_suggester_instance = None


def get_suggester() -> SymptomSuggester:
    global _suggester_instance
    if _suggester_instance is None:
        _suggester_instance = SymptomSuggester()
    return _suggester_instance