"""
Retrainer Module
Handles online learning / model retraining when AI is wrong
Uses partial_fit for incremental learning without full retraining
"""

import os
import sys
import json
import joblib
import numpy as np
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config


class Retrainer:
    """
    Handles model retraining with new correct data
    Uses SGD partial_fit for online learning
    Falls back to full retraining periodically
    """

    def __init__(self):
        self.sgd_model = None
        self.label_encoder = None
        self.feature_columns = None
        self.metadata = None
        self._load_artifacts()

    # ─────────────────────────────────────────────────────
    # LOAD ARTIFACTS
    # ─────────────────────────────────────────────────────

    def _load_artifacts(self):
        """Load model artifacts for retraining"""

        try:
            self.label_encoder = joblib.load(Config.ENCODER_PATH)
            self.feature_columns = joblib.load(Config.FEATURES_PATH)

            with open(Config.METADATA_PATH, 'r') as f:
                self.metadata = json.load(f)

        except Exception as e:
            print(f"   Retrainer load error: {e}")

    # ─────────────────────────────────────────────────────
    # RETRAIN WITH NEW FEEDBACK
    # ─────────────────────────────────────────────────────

    def retrain_with_feedback(
        self,
        symptoms: list,
        correct_disease: str
    ) -> bool:
        """
        Retrain model with one new correct sample
        Uses online learning (partial_fit) if model supports it
        Otherwise saves feedback for batch retraining

        Parameters:
            symptoms: list of symptom keys
            correct_disease: correct disease name from lab

        Returns:
            True if retraining successful
        """

        try:
            # Check if disease is known
            if correct_disease not in self.label_encoder.classes_:
                print(
                    f"   ⚠️  Unknown disease: {correct_disease}"
                    f" — saving for manual review"
                )
                self._save_unknown_feedback(symptoms, correct_disease)
                return False

            # Build feature vector
            feature_vector = self._build_feature_vector(symptoms)
            X_new = feature_vector.reshape(1, -1)

            # Encode label
            y_new = self.label_encoder.transform([correct_disease])

            # Try online learning with current model
            main_model = joblib.load(Config.MODEL_PATH)

            if hasattr(main_model, 'partial_fit'):
                # Model supports online learning directly
                all_classes = np.arange(len(self.label_encoder.classes_))
                main_model.partial_fit(X_new, y_new, classes=all_classes)
                joblib.dump(main_model, Config.MODEL_PATH)
                print(
                    f"   ✅ Online learning: model updated with"
                    f" {correct_disease}"
                )

            else:
                # Use SGD wrapper for online learning
                success = self._sgd_online_learning(
                    X_new, y_new, correct_disease
                )
                if not success:
                    # Save for batch retraining
                    self._save_feedback_for_batch(symptoms, correct_disease)
                    print(
                        f"   ℹ️  Feedback saved for batch retraining:"
                        f" {correct_disease}"
                    )

            # Update metadata
            self._update_metadata(correct_disease)

            return True

        except Exception as e:
            print(f"   Retraining error: {e}")
            self._save_feedback_for_batch(symptoms, correct_disease)
            return False

    # ─────────────────────────────────────────────────────
    # SGD ONLINE LEARNING
    # ─────────────────────────────────────────────────────

    def _sgd_online_learning(
        self,
        X_new: np.ndarray,
        y_new: np.ndarray,
        correct_disease: str
    ) -> bool:
        """
        Use a separate SGD model for online learning
        SGD supports partial_fit for incremental updates
        """

        try:
            from sklearn.linear_model import SGDClassifier

            sgd_path = os.path.join(Config.MODELS_DIR, 'sgd_online_model.pkl')
            all_classes = np.arange(len(self.label_encoder.classes_))

            if os.path.exists(sgd_path):
                sgd_model = joblib.load(sgd_path)
            else:
                sgd_model = SGDClassifier(
                    loss='modified_huber',
                    max_iter=1000,
                    random_state=42,
                    n_jobs=-1
                )
                # Initialize with first sample
                sgd_model.partial_fit(X_new, y_new, classes=all_classes)

            # Update with new sample
            sgd_model.partial_fit(X_new, y_new)

            # Save updated SGD model
            joblib.dump(sgd_model, sgd_path)

            print(
                f"   ✅ SGD online model updated with: {correct_disease}"
            )
            return True

        except Exception as e:
            print(f"   SGD learning error: {e}")
            return False

    # ─────────────────────────────────────────────────────
    # BUILD FEATURE VECTOR
    # ─────────────────────────────────────────────────────

    def _build_feature_vector(self, symptoms: list) -> np.ndarray:
        """Build binary feature vector from symptom list"""

        feature_vector = np.zeros(len(self.feature_columns))

        normalized = [
            s.strip().lower().replace(' ', '_').replace('-', '_')
            for s in symptoms
        ]

        for i, col in enumerate(self.feature_columns):
            if col in normalized:
                feature_vector[i] = 1

        return feature_vector

    # ─────────────────────────────────────────────────────
    # SAVE FEEDBACK FOR BATCH
    # ─────────────────────────────────────────────────────

    def _save_feedback_for_batch(
        self,
        symptoms: list,
        correct_disease: str
    ):
        """Save feedback to file for later batch retraining"""

        feedback_path = os.path.join(
            Config.MODELS_DIR,
            'pending_feedback.json'
        )

        # Load existing
        existing = []
        if os.path.exists(feedback_path):
            try:
                with open(feedback_path, 'r') as f:
                    existing = json.load(f)
            except Exception:
                existing = []

        # Add new feedback
        existing.append({
            "symptoms": symptoms,
            "correct_disease": correct_disease,
            "timestamp": str(datetime.now())
        })

        # Save
        with open(feedback_path, 'w') as f:
            json.dump(existing, f, indent=2)

    # ─────────────────────────────────────────────────────
    # SAVE UNKNOWN FEEDBACK
    # ─────────────────────────────────────────────────────

    def _save_unknown_feedback(
        self,
        symptoms: list,
        unknown_disease: str
    ):
        """Save feedback for unknown/new diseases for manual review"""

        unknown_path = os.path.join(
            Config.MODELS_DIR,
            'unknown_diseases.json'
        )

        existing = []
        if os.path.exists(unknown_path):
            try:
                with open(unknown_path, 'r') as f:
                    existing = json.load(f)
            except Exception:
                existing = []

        existing.append({
            "symptoms": symptoms,
            "unknown_disease": unknown_disease,
            "timestamp": str(datetime.now()),
            "note": "New disease not in training data — needs manual addition"
        })

        with open(unknown_path, 'w') as f:
            json.dump(existing, f, indent=2)

    # ─────────────────────────────────────────────────────
    # BATCH RETRAIN
    # ─────────────────────────────────────────────────────

    def batch_retrain(self) -> dict:
        """
        Perform batch retraining using all pending feedback
        Should be run periodically (e.g., weekly)
        """

        feedback_path = os.path.join(
            Config.MODELS_DIR,
            'pending_feedback.json'
        )

        if not os.path.exists(feedback_path):
            return {
                "status": "no_feedback",
                "message": "No pending feedback for retraining"
            }

        try:
            with open(feedback_path, 'r') as f:
                feedback_list = json.load(f)

            if not feedback_list:
                return {
                    "status": "no_feedback",
                    "message": "No pending feedback for retraining"
                }

            print(f"   🔄 Batch retraining with {len(feedback_list)} samples...")

            success_count = 0
            for feedback in feedback_list:
                symptoms = feedback.get("symptoms", [])
                correct_disease = feedback.get("correct_disease", "")

                if symptoms and correct_disease:
                    if correct_disease in self.label_encoder.classes_:
                        feature_vector = self._build_feature_vector(symptoms)
                        X = feature_vector.reshape(1, -1)
                        y = self.label_encoder.transform([correct_disease])
                        success = self._sgd_online_learning(X, y, correct_disease)
                        if success:
                            success_count += 1

            # Clear processed feedback
            os.remove(feedback_path)

            # Update metadata
            self._update_metadata("batch_retrain")

            return {
                "status": "success",
                "samples_processed": len(feedback_list),
                "successful_updates": success_count,
                "message": f"Batch retraining complete: {success_count}/{len(feedback_list)} samples"
            }

        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }

    # ─────────────────────────────────────────────────────
    # UPDATE METADATA
    # ─────────────────────────────────────────────────────

    def _update_metadata(self, trigger: str):
        """Update model metadata after retraining"""

        try:
            if os.path.exists(Config.METADATA_PATH):
                with open(Config.METADATA_PATH, 'r') as f:
                    meta = json.load(f)
            else:
                meta = {}

            meta['last_retrain'] = str(datetime.now())
            meta['retrain_count'] = meta.get('retrain_count', 0) + 1
            meta['last_retrain_trigger'] = trigger

            with open(Config.METADATA_PATH, 'w') as f:
                json.dump(meta, f, indent=2)

        except Exception as e:
            print(f"   Metadata update error: {e}")

    # ─────────────────────────────────────────────────────
    # GET RETRAINING STATS
    # ─────────────────────────────────────────────────────

    def get_retraining_stats(self) -> dict:
        """Get retraining history and stats"""

        stats = {
            "retrain_count": 0,
            "last_retrain": None,
            "pending_feedback": 0,
            "unknown_diseases": 0
        }

        try:
            if os.path.exists(Config.METADATA_PATH):
                with open(Config.METADATA_PATH, 'r') as f:
                    meta = json.load(f)
                stats["retrain_count"] = meta.get("retrain_count", 0)
                stats["last_retrain"] = meta.get("last_retrain")

            feedback_path = os.path.join(
                Config.MODELS_DIR, 'pending_feedback.json'
            )
            if os.path.exists(feedback_path):
                with open(feedback_path, 'r') as f:
                    feedback = json.load(f)
                stats["pending_feedback"] = len(feedback)

            unknown_path = os.path.join(
                Config.MODELS_DIR, 'unknown_diseases.json'
            )
            if os.path.exists(unknown_path):
                with open(unknown_path, 'r') as f:
                    unknown = json.load(f)
                stats["unknown_diseases"] = len(unknown)

        except Exception as e:
            print(f"   Stats error: {e}")

        return stats


# ─────────────────────────────────────────────────────────
# SINGLETON
# ─────────────────────────────────────────────────────────

_retrainer_instance = None


def get_retrainer() -> Retrainer:
    global _retrainer_instance
    if _retrainer_instance is None:
        _retrainer_instance = Retrainer()
    return _retrainer_instance