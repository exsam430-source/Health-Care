"""
Comparator Module
Compares AI prediction with Doctor's diagnosis
Stores comparison records in database
"""

import os
import sys
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.connection import get_db
from database.models import new_comparison_record


class Comparator:
    """Handles AI vs Doctor diagnosis comparison"""

    def __init__(self):
        self.db = get_db()

    # ─────────────────────────────────────────────────────
    # SAVE AND COMPARE
    # ─────────────────────────────────────────────────────

    def compare_and_save(
        self,
        patient_id: str,
        appointment_id: str,
        symptoms: list,
        ai_prediction: str,
        ai_confidence: float,
        doctor_diagnosis: str,
        doctor_notes: str = ""
    ) -> dict:
        """
        Compare AI prediction with doctor diagnosis
        Save to database and return result
        """

        # Check if comparison already exists
        existing = self.db.comparisons.find_one({
            "patient_id": str(patient_id),
            "appointment_id": str(appointment_id)
        })

        if existing:
            # Update existing record
            self.db.comparisons.update_one(
                {
                    "patient_id": str(patient_id),
                    "appointment_id": str(appointment_id)
                },
                {
                    "$set": {
                        "doctor_diagnosis": doctor_diagnosis,
                        "doctor_notes": doctor_notes,
                        "match_status": (
                            "MATCH"
                            if ai_prediction.strip().lower() ==
                               doctor_diagnosis.strip().lower()
                            else "MISMATCH"
                        ),
                        "updated_at": datetime.now()
                    }
                }
            )
            comparison_id = str(existing.get('_id', 'updated'))
        else:
            # Create new record
            record = new_comparison_record(
                patient_id=patient_id,
                appointment_id=appointment_id,
                symptoms=symptoms,
                ai_prediction=ai_prediction,
                ai_confidence=ai_confidence,
                doctor_diagnosis=doctor_diagnosis,
                doctor_notes=doctor_notes
            )

            result = self.db.comparisons.insert_one(record)
            comparison_id = str(result.inserted_id)

        # Determine match
        is_match = (
            ai_prediction.strip().lower() ==
            doctor_diagnosis.strip().lower()
        )

        match_status = "MATCH" if is_match else "MISMATCH"

        # Update performance counters
        self._update_comparison_stats(is_match)

        return {
            "comparison_id": comparison_id,
            "patient_id": patient_id,
            "appointment_id": appointment_id,
            "ai_prediction": ai_prediction,
            "ai_confidence": ai_confidence,
            "doctor_diagnosis": doctor_diagnosis,
            "match_status": match_status,
            "is_match": is_match,
            "message": (
                "AI and Doctor agree on the diagnosis!"
                if is_match
                else "Diagnosis differs — lab results will determine the correct one"
            ),
            "awaiting_lab_validation": True
        }

    # ─────────────────────────────────────────────────────
    # GET COMPARISON
    # ─────────────────────────────────────────────────────

    def get_comparison(
        self,
        patient_id: str,
        appointment_id: str
    ) -> dict:
        """Retrieve comparison record"""

        record = self.db.comparisons.find_one({
            "patient_id": str(patient_id),
            "appointment_id": str(appointment_id)
        })

        if not record:
            return None

        # Remove MongoDB _id for JSON serialization
        record.pop('_id', None)

        # Convert datetime to string
        for key in ['created_at', 'validated_at', 'updated_at']:
            if key in record and record[key]:
                record[key] = str(record[key])

        return record

    # ─────────────────────────────────────────────────────
    # GET ALL COMPARISONS
    # ─────────────────────────────────────────────────────

    def get_all_comparisons(self, limit: int = 50) -> list:
        """Get recent comparison records"""

        records = self.db.comparisons.find({})

        clean_records = []
        for r in records[:limit]:
            r.pop('_id', None)
            for key in ['created_at', 'validated_at']:
                if key in r and r[key]:
                    r[key] = str(r[key])
            clean_records.append(r)

        return clean_records

    # ─────────────────────────────────────────────────────
    # UPDATE STATS
    # ─────────────────────────────────────────────────────

    def _update_comparison_stats(self, is_match: bool):
        """Update global comparison statistics"""
        try:
            stats = self.db.ai_performance.find_one({})

            if not stats:
                from database.models import new_performance_record
                self.db.ai_performance.insert_one(new_performance_record())
                stats = self.db.ai_performance.find_one({})

            self.db.ai_performance.update_one(
                {},
                {
                    "$set": {
                        "total_comparisons": stats.get(
                            "total_comparisons", 0) + 1,
                        "match_count": stats.get(
                            "match_count", 0) + (1 if is_match else 0),
                        "mismatch_count": stats.get(
                            "mismatch_count", 0) + (0 if is_match else 1),
                        "updated_at": datetime.now()
                    }
                }
            )
        except Exception as e:
            print(f"Stats update error: {e}")


# ─────────────────────────────────────────────────────────
# SINGLETON
# ─────────────────────────────────────────────────────────

_comparator_instance = None


def get_comparator() -> Comparator:
    global _comparator_instance
    if _comparator_instance is None:
        _comparator_instance = Comparator()
    return _comparator_instance