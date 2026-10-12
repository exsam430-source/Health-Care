"""
Validator Module
Validates AI prediction and Doctor diagnosis against lab results
Triggers retraining if AI was wrong
"""

import os
import sys
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.connection import get_db
from database.models import new_training_feedback


class Validator:
    """
    Validates predictions against confirmed lab results
    Handles auto-retraining when AI is wrong
    """

    def __init__(self):
        self.db = get_db()

    # ─────────────────────────────────────────────────────
    # MAIN VALIDATE FUNCTION
    # ─────────────────────────────────────────────────────

    def validate_with_lab(
        self,
        patient_id: str,
        appointment_id: str,
        lab_confirmed_disease: str
    ) -> dict:
        """
        Compare AI prediction & Doctor diagnosis with lab result

        Parameters:
            patient_id: patient identifier
            appointment_id: appointment identifier
            lab_confirmed_disease: disease confirmed by lab tests

        Returns:
            dict with validation results
        """

        # Find comparison record
        comparison = self.db.comparisons.find_one({
            "patient_id": str(patient_id),
            "appointment_id": str(appointment_id)
        })

        if not comparison:
            return {
                "error": "No comparison record found for this patient/appointment",
                "tip": "Make sure doctor has submitted diagnosis first"
            }

        # Check if already validated
        if comparison.get("lab_validated"):
            return {
                "message": "Already validated",
                "ai_correct": comparison.get("ai_correct"),
                "doctor_correct": comparison.get("doctor_correct"),
                "lab_confirmed_disease": comparison.get("lab_confirmed_disease")
            }

        ai_prediction = comparison.get("ai_prediction", "")
        doctor_diagnosis = comparison.get("doctor_diagnosis", "")
        symptoms = comparison.get("symptoms", [])

        # Check correctness (case-insensitive)
        lab_clean = lab_confirmed_disease.strip().lower()
        ai_correct = ai_prediction.strip().lower() == lab_clean
        doctor_correct = doctor_diagnosis.strip().lower() == lab_clean

        # Update comparison record
        self.db.comparisons.update_one(
            {
                "patient_id": str(patient_id),
                "appointment_id": str(appointment_id)
            },
            {
                "$set": {
                    "lab_validated": True,
                    "lab_confirmed_disease": lab_confirmed_disease,
                    "ai_correct": ai_correct,
                    "doctor_correct": doctor_correct,
                    "validated_at": datetime.now()
                }
            }
        )

        retrain_triggered = False
        retrain_message = ""

        # Trigger retraining if AI was WRONG
        if not ai_correct:
            retrain_triggered = self._trigger_retraining(
                symptoms=symptoms,
                correct_disease=lab_confirmed_disease,
                patient_id=patient_id
            )
            retrain_message = (
                "Model retraining triggered with correct outcome"
                if retrain_triggered
                else "Feedback saved for batch retraining"
            )

        # Update performance statistics
        self._update_performance_stats(ai_correct)

        # Build result message
        if ai_correct and doctor_correct:
            result_msg = "Both AI and Doctor were correct!"
        elif ai_correct and not doctor_correct:
            result_msg = "AI was correct, Doctor diagnosis differed"
        elif not ai_correct and doctor_correct:
            result_msg = "Doctor was correct, AI prediction differed — AI will learn from this"
        else:
            result_msg = "Both AI and Doctor had different diagnoses from lab result"

        return {
            "validation_complete": True,
            "patient_id": patient_id,
            "appointment_id": appointment_id,
            "ai_prediction": ai_prediction,
            "doctor_diagnosis": doctor_diagnosis,
            "lab_confirmed_disease": lab_confirmed_disease,
            "ai_correct": ai_correct,
            "doctor_correct": doctor_correct,
            "result_message": result_msg,
            "retrain_triggered": retrain_triggered,
            "retrain_message": retrain_message,
            "validated_at": str(datetime.now())
        }

    # ─────────────────────────────────────────────────────
    # TRIGGER RETRAINING
    # ─────────────────────────────────────────────────────

    def _trigger_retraining(
        self,
        symptoms: list,
        correct_disease: str,
        patient_id: str
    ) -> bool:
        """
        Save feedback and trigger model retraining
        """

        try:
            # Save feedback to database
            feedback = new_training_feedback(
                symptoms=symptoms,
                correct_disease=correct_disease,
                source="lab_validation"
            )
            self.db.training_feedback.insert_one(feedback)

            # Import and run retrainer
            from modules.retrainer import get_retrainer
            retrainer = get_retrainer()
            success = retrainer.retrain_with_feedback(
                symptoms=symptoms,
                correct_disease=correct_disease
            )

            # Mark feedback as used
            if success:
                self.db.training_feedback.update_one(
                    {
                        "symptoms": symptoms,
                        "correct_disease": correct_disease,
                        "used_in_training": False
                    },
                    {
                        "$set": {"used_in_training": True}
                    }
                )

            return success

        except Exception as e:
            print(f"   Retraining trigger error: {e}")
            return False

    # ─────────────────────────────────────────────────────
    # UPDATE PERFORMANCE STATS
    # ─────────────────────────────────────────────────────

    def _update_performance_stats(self, ai_correct: bool):
        """Update AI accuracy statistics"""

        try:
            stats = self.db.ai_performance.find_one({})

            if not stats:
                from database.models import new_performance_record
                self.db.ai_performance.insert_one(new_performance_record())
                stats = self.db.ai_performance.find_one({})

            total = stats.get("total_predictions", 0) + 1
            correct = stats.get("correct_predictions", 0) + (
                1 if ai_correct else 0
            )
            wrong = stats.get("wrong_predictions", 0) + (
                0 if ai_correct else 1
            )
            accuracy = round((correct / total) * 100, 2) if total > 0 else 0

            self.db.ai_performance.update_one(
                {},
                {
                    "$set": {
                        "total_predictions": total,
                        "correct_predictions": correct,
                        "wrong_predictions": wrong,
                        "accuracy_percentage": accuracy,
                        "updated_at": datetime.now()
                    }
                }
            )

        except Exception as e:
            print(f"   Performance stats update error: {e}")

    # ─────────────────────────────────────────────────────
    # GET VALIDATION HISTORY
    # ─────────────────────────────────────────────────────

    def get_validation_history(self, limit: int = 20) -> list:
        """Get recent validation records"""

        records = self.db.comparisons.find({"lab_validated": True})

        clean = []
        for r in records[:limit]:
            r.pop('_id', None)
            for key in ['created_at', 'validated_at']:
                if key in r and r[key]:
                    r[key] = str(r[key])
            clean.append(r)

        return clean


# ─────────────────────────────────────────────────────────
# SINGLETON
# ─────────────────────────────────────────────────────────

_validator_instance = None


def get_validator() -> Validator:
    global _validator_instance
    if _validator_instance is None:
        _validator_instance = Validator()
    return _validator_instance