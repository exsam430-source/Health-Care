"""
Lab Test Suggester Module
Suggests relevant lab tests based on AI predicted disease
Stores suggestions in database
Compares with actual doctor orders and lab results
"""

import os
import sys
import json
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config
from database.connection import get_db


class LabSuggester:
    """
    Suggests lab tests based on predicted disease
    Manages complete lab test lifecycle
    """

    def __init__(self):
        self.lab_tests_map = {}
        self._load_lab_data()

    # ─────────────────────────────────────────────────────
    # LOAD LAB DATA
    # ─────────────────────────────────────────────────────

    def _load_lab_data(self):
        """Load lab tests database"""
        lab_path = os.path.join(
            Config.DATA_FILES_DIR,
            'lab_tests_by_disease.json'
        )

        if os.path.exists(lab_path):
            with open(lab_path, 'r') as f:
                self.lab_tests_map = json.load(f)
            print(
                f"   ✅ Lab Tests DB: "
                f"{len(self.lab_tests_map)} diseases loaded"
            )
        else:
            self.lab_tests_map = {}
            print("   ⚠️  Lab tests database not found")

    # ─────────────────────────────────────────────────────
    # SUGGEST TESTS FOR DISEASE
    # ─────────────────────────────────────────────────────

    def suggest_tests(
        self,
        predicted_disease: str,
        symptoms: list = None,
        patient_id: str = None,
        appointment_id: str = None,
        include_optional: bool = True
    ) -> dict:
        """
        Suggest lab tests for a predicted disease

        Parameters:
            predicted_disease: AI predicted disease name
            symptoms: patient symptoms (for additional context)
            patient_id: patient identifier
            appointment_id: appointment identifier
            include_optional: whether to include optional tests

        Returns:
            dict with essential and optional tests
        """

        symptoms = symptoms or []

        # Get tests for this disease
        disease_tests = self.lab_tests_map.get(predicted_disease, {})

        # If exact match not found try partial match
        if not disease_tests:
            for disease_key in self.lab_tests_map:
                if (predicted_disease.lower() in disease_key.lower() or
                        disease_key.lower() in predicted_disease.lower()):
                    disease_tests = self.lab_tests_map[disease_key]
                    break

        # If still not found return general tests
        if not disease_tests:
            disease_tests = self._get_general_tests()

        essential_tests = disease_tests.get('essential_tests', [])
        optional_tests = disease_tests.get('optional_tests', [])
        normal_ranges = disease_tests.get('normal_ranges', {})

        # Add urgency based on symptoms
        urgency_level = self._calculate_urgency(symptoms, essential_tests)

        # Build result
        result = {
            "predicted_disease": predicted_disease,
            "urgency_level": urgency_level,
            "essential_tests": essential_tests,
            "optional_tests": optional_tests if include_optional else [],
            "normal_ranges": normal_ranges,
            "total_essential": len(essential_tests),
            "total_optional": len(optional_tests),
            "ai_notes": self._generate_notes(
                predicted_disease, symptoms, urgency_level
            )
        }

        # Save to database if patient info provided
        if patient_id and appointment_id:
            saved_id = self._save_suggestion(
                patient_id=patient_id,
                appointment_id=appointment_id,
                predicted_disease=predicted_disease,
                symptoms=symptoms,
                suggestion=result
            )
            result['suggestion_id'] = saved_id
            result['saved_to_db'] = True

        return result

    # ─────────────────────────────────────────────────────
    # SAVE SUGGESTION TO DB
    # ─────────────────────────────────────────────────────

    def _save_suggestion(
        self,
        patient_id,
        appointment_id,
        predicted_disease,
        symptoms,
        suggestion
    ) -> str:
        """Save lab test suggestion to database"""

        try:
            db = get_db()

            # Check if already exists
            existing = db.lab_suggestions.find_one({
                "patient_id": str(patient_id),
                "appointment_id": str(appointment_id)
            })

            if existing:
                # Update existing
                db.lab_suggestions.update_one(
                    {
                        "patient_id": str(patient_id),
                        "appointment_id": str(appointment_id)
                    },
                    {
                        "$set": {
                            "predicted_disease": predicted_disease,
                            "symptoms": symptoms,
                            "essential_tests": suggestion['essential_tests'],
                            "optional_tests": suggestion['optional_tests'],
                            "normal_ranges": suggestion['normal_ranges'],
                            "urgency_level": suggestion['urgency_level'],
                            "updated_at": datetime.now()
                        }
                    }
                )
                return str(existing.get('_id', 'updated'))

            # Create new document
            doc = {
                "patient_id": str(patient_id),
                "appointment_id": str(appointment_id),
                "predicted_disease": predicted_disease,
                "symptoms": symptoms,
                "essential_tests": suggestion['essential_tests'],
                "optional_tests": suggestion['optional_tests'],
                "normal_ranges": suggestion['normal_ranges'],
                "urgency_level": suggestion['urgency_level'],
                "ai_notes": suggestion.get('ai_notes', ''),

                # Doctor response (filled later)
                "doctor_ordered_tests": [],
                "doctor_modified": False,
                "doctor_notes": "",

                # Lab results (filled when lab uploads)
                "lab_results": [],
                "lab_status": "pending",

                # Validation (filled after comparison)
                "validated": False,
                "validation_result": None,

                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }

            result = db.lab_suggestions.insert_one(doc)
            return str(result.inserted_id)

        except Exception as e:
            print(f"   Lab suggestion save error: {e}")
            return "unsaved"

    # ─────────────────────────────────────────────────────
    # DOCTOR CONFIRMS/MODIFIES TESTS
    # ─────────────────────────────────────────────────────

    def doctor_confirm_tests(
        self,
        patient_id: str,
        appointment_id: str,
        ordered_tests: list,
        doctor_notes: str = ""
    ) -> dict:
        """
        Doctor reviews AI suggested tests and
        confirms or modifies the test list

        Parameters:
            ordered_tests: list of test names doctor actually ordered
            doctor_notes: any additional notes from doctor
        """

        try:
            db = get_db()

            suggestion = db.lab_suggestions.find_one({
                "patient_id": str(patient_id),
                "appointment_id": str(appointment_id)
            })

            if not suggestion:
                return {
                    "error": "No lab suggestion found",
                    "tip": "Call /api/ai/lab/suggest first"
                }

            # Get AI suggested tests
            ai_essential = [
                t['name'] for t in suggestion.get('essential_tests', [])
            ]
            ai_optional = [
                t['name'] for t in suggestion.get('optional_tests', [])
            ]
            ai_all = ai_essential + ai_optional

            # Compare AI vs Doctor orders
            ai_ordered_set = set([t.lower() for t in ai_all])
            doctor_ordered_set = set([t.lower() for t in ordered_tests])

            # Tests in both (agreed)
            agreed_tests = [
                t for t in ordered_tests
                if t.lower() in ai_ordered_set
            ]

            # Tests doctor added (not in AI list)
            doctor_added = [
                t for t in ordered_tests
                if t.lower() not in ai_ordered_set
            ]

            # Tests AI suggested but doctor skipped
            doctor_skipped = [
                t for t in ai_essential
                if t.lower() not in doctor_ordered_set
            ]

            was_modified = (
                len(doctor_added) > 0 or len(doctor_skipped) > 0
            )

            # Update database
            db.lab_suggestions.update_one(
                {
                    "patient_id": str(patient_id),
                    "appointment_id": str(appointment_id)
                },
                {
                    "$set": {
                        "doctor_ordered_tests": ordered_tests,
                        "doctor_modified": was_modified,
                        "doctor_notes": doctor_notes,
                        "agreed_tests": agreed_tests,
                        "doctor_added_tests": doctor_added,
                        "doctor_skipped_tests": doctor_skipped,
                        "lab_status": "ordered",
                        "updated_at": datetime.now()
                    }
                }
            )

            return {
                "success": True,
                "patient_id": patient_id,
                "appointment_id": appointment_id,
                "ai_suggested_count": len(ai_essential),
                "doctor_ordered_count": len(ordered_tests),
                "agreed_tests": agreed_tests,
                "doctor_added_tests": doctor_added,
                "doctor_skipped_ai_tests": doctor_skipped,
                "was_modified": was_modified,
                "agreement_rate": round(
                    len(agreed_tests) / max(len(ai_essential), 1) * 100, 1
                ),
                "message": (
                    "Doctor followed AI suggestions"
                    if not was_modified
                    else "Doctor modified AI test suggestions"
                ),
                "status": "Tests ordered — awaiting lab results"
            }

        except Exception as e:
            return {"error": str(e)}

    # ─────────────────────────────────────────────────────
    # LAB UPLOADS RESULTS
    # ─────────────────────────────────────────────────────

    def upload_lab_results(
        self,
        patient_id: str,
        appointment_id: str,
        lab_results: list,
        confirmed_disease: str = None,
        lab_notes: str = ""
    ) -> dict:
        """
        Lab uploads test results
        Each result has: test_name, value, unit, status, reference_range

        Parameters:
            lab_results: list of result objects
            confirmed_disease: disease confirmed by lab findings
            lab_notes: lab technician notes
        """

        try:
            db = get_db()

            suggestion = db.lab_suggestions.find_one({
                "patient_id": str(patient_id),
                "appointment_id": str(appointment_id)
            })

            if not suggestion:
                return {"error": "No lab record found for this patient"}

            # Process and validate results
            processed_results = []
            abnormal_count = 0
            critical_count = 0

            for result in lab_results:
                processed = {
                    "test_name": result.get('test_name', ''),
                    "value": result.get('value', ''),
                    "unit": result.get('unit', ''),
                    "reference_range": result.get('reference_range', ''),
                    "status": result.get('status', 'normal'),
                    "notes": result.get('notes', ''),
                    "uploaded_at": str(datetime.now())
                }

                if processed['status'] == 'abnormal':
                    abnormal_count += 1
                elif processed['status'] == 'critical':
                    critical_count += 1

                processed_results.append(processed)

            # Update record
            db.lab_suggestions.update_one(
                {
                    "patient_id": str(patient_id),
                    "appointment_id": str(appointment_id)
                },
                {
                    "$set": {
                        "lab_results": processed_results,
                        "lab_confirmed_disease": confirmed_disease,
                        "lab_notes": lab_notes,
                        "lab_status": "completed",
                        "abnormal_results_count": abnormal_count,
                        "critical_results_count": critical_count,
                        "results_uploaded_at": datetime.now(),
                        "updated_at": datetime.now()
                    }
                }
            )

            # Trigger comparison if disease confirmed
            comparison_result = None
            if confirmed_disease:
                comparison_result = self._compare_all(
                    patient_id=patient_id,
                    appointment_id=appointment_id,
                    lab_confirmed_disease=confirmed_disease,
                    suggestion=suggestion
                )

            return {
                "success": True,
                "patient_id": patient_id,
                "appointment_id": appointment_id,
                "total_results": len(processed_results),
                "normal_results": len(processed_results) - abnormal_count - critical_count,
                "abnormal_results": abnormal_count,
                "critical_results": critical_count,
                "lab_confirmed_disease": confirmed_disease,
                "comparison": comparison_result,
                "message": "Lab results uploaded and compared successfully"
            }

        except Exception as e:
            return {"error": str(e)}

    # ─────────────────────────────────────────────────────
    # COMPARE ALL PREDICTIONS WITH LAB
    # ─────────────────────────────────────────────────────

    def _compare_all(
        self,
        patient_id: str,
        appointment_id: str,
        lab_confirmed_disease: str,
        suggestion: dict
    ) -> dict:
        """
        Full comparison:
        1. AI predicted disease vs Lab confirmed
        2. Doctor diagnosis vs Lab confirmed
        3. AI suggested tests vs Doctor ordered tests
        4. Trigger retraining if AI wrong
        """

        db = get_db()

        # Get comparison record (has AI + Doctor diagnosis)
        comparison = db.comparisons.find_one({
            "patient_id": str(patient_id),
            "appointment_id": str(appointment_id)
        })

        ai_prediction = suggestion.get('predicted_disease', '')
        doctor_diagnosis = ''
        if comparison:
            doctor_diagnosis = comparison.get('doctor_diagnosis', '')

        lab_clean = lab_confirmed_disease.strip().lower()
        ai_correct = ai_prediction.strip().lower() == lab_clean
        doctor_correct = doctor_diagnosis.strip().lower() == lab_clean

        # Test agreement analysis
        ai_essential_names = [
            t['name'].lower()
            for t in suggestion.get('essential_tests', [])
        ]
        doctor_ordered_names = [
            t.lower()
            for t in suggestion.get('doctor_ordered_tests', [])
        ]

        test_agreement = len([
            t for t in ai_essential_names
            if t in doctor_ordered_names
        ])

        test_agreement_rate = round(
            test_agreement / max(len(ai_essential_names), 1) * 100, 1
        )

        # Build comparison result
        comparison_result = {
            "ai_prediction": ai_prediction,
            "doctor_diagnosis": doctor_diagnosis,
            "lab_confirmed_disease": lab_confirmed_disease,
            "ai_disease_correct": ai_correct,
            "doctor_disease_correct": doctor_correct,
            "test_agreement_rate": test_agreement_rate,
            "result_message": self._build_result_message(
                ai_correct, doctor_correct
            ),
            "compared_at": str(datetime.now())
        }

        # Save comparison to lab record
        db.lab_suggestions.update_one(
            {
                "patient_id": str(patient_id),
                "appointment_id": str(appointment_id)
            },
            {
                "$set": {
                    "validated": True,
                    "validation_result": comparison_result,
                    "lab_confirmed_disease": lab_confirmed_disease
                }
            }
        )

        # Also update the main comparisons collection
        if comparison:
            db.comparisons.update_one(
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

        # Trigger retraining if AI was wrong
        if not ai_correct and suggestion.get('symptoms'):
            try:
                from modules.retrainer import get_retrainer
                retrainer = get_retrainer()
                retrainer.retrain_with_feedback(
                    symptoms=suggestion['symptoms'],
                    correct_disease=lab_confirmed_disease
                )
                comparison_result['retrain_triggered'] = True
            except Exception as e:
                comparison_result['retrain_triggered'] = False
                print(f"   Retraining error: {e}")

        # Update performance stats
        self._update_stats(ai_correct)

        return comparison_result

    # ─────────────────────────────────────────────────────
    # GET LAB RECORD
    # ─────────────────────────────────────────────────────

    def get_lab_record(
        self,
        patient_id: str,
        appointment_id: str
    ) -> dict:
        """Get complete lab record for a patient appointment"""

        try:
            db = get_db()

            record = db.lab_suggestions.find_one({
                "patient_id": str(patient_id),
                "appointment_id": str(appointment_id)
            })

            if not record:
                return None

            record.pop('_id', None)
            for key in ['created_at', 'updated_at', 'results_uploaded_at']:
                if key in record and record[key]:
                    record[key] = str(record[key])

            return record

        except Exception as e:
            print(f"   Get lab record error: {e}")
            return None

    # ─────────────────────────────────────────────────────
    # GET ALL LAB RECORDS
    # ─────────────────────────────────────────────────────

    def get_all_lab_records(self, limit: int = 50) -> list:
        """Get all lab records"""

        try:
            db = get_db()
            records = list(db.lab_suggestions.find({}))

            clean = []
            for r in records[:limit]:
                r.pop('_id', None)
                for key in ['created_at', 'updated_at']:
                    if key in r and r[key]:
                        r[key] = str(r[key])
                clean.append(r)

            return clean

        except Exception as e:
            print(f"   Get all lab records error: {e}")
            return []

    # ─────────────────────────────────────────────────────
    # HELPER FUNCTIONS
    # ─────────────────────────────────────────────────────

    def _calculate_urgency(
        self,
        symptoms: list,
        essential_tests: list
    ) -> str:
        """Calculate overall urgency based on symptoms and tests"""

        emergency_symptoms = [
            'chest_pain', 'breathlessness', 'altered_sensorium',
            'coma', 'stomach_bleeding', 'weakness_of_one_body_side'
        ]

        has_emergency = any(
            s.lower().replace(' ', '_') in emergency_symptoms
            for s in symptoms
        )

        has_emergency_test = any(
            t.get('urgency') == 'emergency'
            for t in essential_tests
        )

        if has_emergency or has_emergency_test:
            return "EMERGENCY"

        has_urgent_test = any(
            t.get('urgency') == 'urgent'
            for t in essential_tests
        )

        if has_urgent_test:
            return "URGENT"

        return "ROUTINE"

    def _generate_notes(
        self,
        disease: str,
        symptoms: list,
        urgency: str
    ) -> str:
        """Generate AI notes for lab tests"""

        notes = f"AI predicted {disease} based on {len(symptoms)} symptoms. "

        if urgency == "EMERGENCY":
            notes += "⚠️ EMERGENCY: Order tests immediately and monitor patient closely. "
        elif urgency == "URGENT":
            notes += "Order essential tests within 2-4 hours. "
        else:
            notes += "Schedule tests at patient convenience. "

        notes += f"Essential tests are required for diagnosis confirmation."

        return notes

    def _build_result_message(
        self,
        ai_correct: bool,
        doctor_correct: bool
    ) -> str:
        """Build human-readable comparison message"""

        if ai_correct and doctor_correct:
            return "✅ Both AI and Doctor were correct!"
        elif ai_correct and not doctor_correct:
            return "🤖 AI was correct. Doctor diagnosis differed from lab."
        elif not ai_correct and doctor_correct:
            return "👨‍⚕️ Doctor was correct. AI will learn from this outcome."
        else:
            return "⚠️ Both AI and Doctor had different diagnoses from lab result."

    def _update_stats(self, ai_correct: bool):
        """Update performance statistics"""
        try:
            db = get_db()
            stats = db.ai_performance.find_one({})

            if stats:
                total = stats.get("total_predictions", 0) + 1
                correct = stats.get("correct_predictions", 0) + (
                    1 if ai_correct else 0
                )
                wrong = stats.get("wrong_predictions", 0) + (
                    0 if ai_correct else 1
                )
                accuracy = round(
                    correct / max(total, 1) * 100, 2
                )

                db.ai_performance.update_one(
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
            print(f"   Stats update error: {e}")

    def _get_general_tests(self) -> dict:
        """Default tests when disease not in database"""
        return {
            "essential_tests": [
                {
                    "name": "Complete Blood Count",
                    "type": "Blood",
                    "urgency": "routine",
                    "description": "General health screening"
                },
                {
                    "name": "ESR",
                    "type": "Blood",
                    "urgency": "routine",
                    "description": "Inflammation marker"
                },
                {
                    "name": "CRP",
                    "type": "Blood",
                    "urgency": "routine",
                    "description": "Acute inflammation marker"
                }
            ],
            "optional_tests": [
                {
                    "name": "Liver Function Test",
                    "type": "Blood",
                    "urgency": "routine",
                    "description": "Liver health"
                },
                {
                    "name": "Kidney Function Test",
                    "type": "Blood",
                    "urgency": "routine",
                    "description": "Kidney health"
                }
            ],
            "normal_ranges": {}
        }


# ─────────────────────────────────────────────────────────
# SINGLETON
# ─────────────────────────────────────────────────────────

_lab_suggester_instance = None


def get_lab_suggester() -> LabSuggester:
    global _lab_suggester_instance
    if _lab_suggester_instance is None:
        _lab_suggester_instance = LabSuggester()
    return _lab_suggester_instance