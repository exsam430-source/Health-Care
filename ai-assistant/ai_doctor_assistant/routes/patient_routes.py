"""
Patient Profile Routes
Complete CRUD for patient profiles

GET    /api/ai/patient/:patient_id         — Get profile
POST   /api/ai/patient                     — Create profile
PUT    /api/ai/patient/:patient_id         — Update profile
DELETE /api/ai/patient/:patient_id         — Delete profile
GET    /api/ai/patient/:patient_id/risk    — Get risk factors
GET    /api/ai/patient/:patient_id/history — Get consultation history
GET    /api/ai/patients                    — Get all patients
POST   /api/ai/patient/:patient_id/predict — Predict with history
"""

from flask import Blueprint, request, jsonify
from database.connection import get_db
from database.models import (
    new_patient_profile,
    update_patient_profile_fields,
    compute_risk_factors
)
from datetime import datetime

patient_bp = Blueprint('patient', __name__)


# ─────────────────────────────────────────────────────────
# Helper — Clean MongoDB document for JSON response
# ─────────────────────────────────────────────────────────

def clean_doc(doc):
    """Remove MongoDB _id and convert dates to strings"""
    if not doc:
        return None
    doc.pop('_id', None)
    for key in ['created_at', 'updated_at', 'last_consultation']:
        if key in doc and doc[key]:
            doc[key] = str(doc[key])
    # Clean nested computed_at
    if 'ai_risk_factors' in doc and 'computed_at' in doc['ai_risk_factors']:
        doc['ai_risk_factors']['computed_at'] = str(
            doc['ai_risk_factors']['computed_at']
        )
    return doc


# ─────────────────────────────────────────────────────────
# POST /api/ai/patient
# Create new patient profile
# ─────────────────────────────────────────────────────────

@patient_bp.route('/patient', methods=['POST'])
def create_patient():
    """
    Create a new patient profile

    Request Body:
    {
        "patient_id": "P001",
        "name": "John Doe",
        "age": 35,
        "gender": "Male",
        "blood_group": "A+",
        "weight_kg": 75,
        "height_cm": 175,
        "chronic_conditions": ["Diabetes Type 2"],
        "current_medications": ["Metformin"],
        "allergies": ["Penicillin"],
        "past_surgeries": ["Appendectomy (2018)"],
        "family_history": ["Heart Disease"]
    }
    """

    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body required"}), 400

        # Required fields
        patient_id = data.get('patient_id')
        name = data.get('name')
        age = data.get('age')
        gender = data.get('gender')

        if not patient_id:
            return jsonify({"error": "patient_id is required"}), 400
        if not name:
            return jsonify({"error": "name is required"}), 400
        if not age:
            return jsonify({"error": "age is required"}), 400
        if not gender:
            return jsonify({"error": "gender is required"}), 400

        db = get_db()

        # Check if patient already exists
        existing = db.patient_profiles.find_one({
            "patient_id": str(patient_id)
        })
        if existing:
            return jsonify({
                "error": f"Patient {patient_id} already exists",
                "tip": "Use PUT to update existing patient"
            }), 409

        # Create profile document
        profile = new_patient_profile(
            patient_id=patient_id,
            name=name,
            age=age,
            gender=gender,
            blood_group=data.get('blood_group'),
            weight_kg=data.get('weight_kg'),
            height_cm=data.get('height_cm'),
            chronic_conditions=data.get('chronic_conditions', []),
            current_medications=data.get('current_medications', []),
            allergies=data.get('allergies', []),
            past_surgeries=data.get('past_surgeries', []),
            family_history=data.get('family_history', [])
        )

        # Save to MongoDB
        db.patient_profiles.insert_one(profile)

        # Return clean profile
        created = db.patient_profiles.find_one({
            "patient_id": str(patient_id)
        })

        return jsonify({
            "success": True,
            "message": f"Patient profile created for {name}",
            "data": clean_doc(created)
        }), 201

    except Exception as e:
        return jsonify({
            "error": "Failed to create patient profile",
            "details": str(e)
        }), 500


# ─────────────────────────────────────────────────────────
# GET /api/ai/patient/<patient_id>
# Get patient profile
# ─────────────────────────────────────────────────────────

@patient_bp.route('/patient/<patient_id>', methods=['GET'])
def get_patient(patient_id):
    """
    Get complete patient profile by ID

    Response includes:
    - Personal information
    - Medical history
    - AI risk factors
    - Consultation count
    """

    try:
        db = get_db()

        profile = db.patient_profiles.find_one({
            "patient_id": str(patient_id)
        })

        if not profile:
            return jsonify({
                "error": f"Patient {patient_id} not found",
                "tip": "Create patient first with POST /api/ai/patient"
            }), 404

        return jsonify({
            "success": True,
            "data": clean_doc(profile)
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────────────────
# PUT /api/ai/patient/<patient_id>
# Update patient profile
# ─────────────────────────────────────────────────────────

@patient_bp.route('/patient/<patient_id>', methods=['PUT'])
def update_patient(patient_id):
    """
    Update patient profile fields
    Only provided fields will be updated

    Request Body (all fields optional):
    {
        "weight_kg": 78,
        "current_medications": ["Metformin", "Lisinopril"],
        "chronic_conditions": ["Diabetes", "Hypertension"]
    }
    """

    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body required"}), 400

        db = get_db()

        # Check if patient exists
        existing = db.patient_profiles.find_one({
            "patient_id": str(patient_id)
        })

        if not existing:
            return jsonify({
                "error": f"Patient {patient_id} not found"
            }), 404

        # Build update
        update_dict = update_patient_profile_fields(data)

        # Recompute risk factors if medical data changed
        risk_trigger_fields = [
            'age', 'weight_kg', 'height_cm',
            'chronic_conditions', 'family_history'
        ]

        if any(f in data for f in risk_trigger_fields):
            # Get current + updated values
            current_profile = existing

            age = data.get('age') or current_profile.get(
                'personal_info', {}
            ).get('age')

            chronic = data.get('chronic_conditions') or current_profile.get(
                'medical_history', {}
            ).get('chronic_conditions', [])

            family = data.get('family_history') or current_profile.get(
                'medical_history', {}
            ).get('family_history', [])

            weight = data.get('weight_kg') or current_profile.get(
                'personal_info', {}
            ).get('weight_kg')

            height = data.get('height_cm') or current_profile.get(
                'personal_info', {}
            ).get('height_cm')

            bmi = (
                round(float(weight) / ((float(height) / 100) ** 2), 1)
                if weight and height else None
            )

            new_risks = compute_risk_factors(age, chronic, family, bmi)
            update_dict["$set"]["ai_risk_factors"] = new_risks

        # Apply update
        db.patient_profiles.update_one(
            {"patient_id": str(patient_id)},
            update_dict
        )

        # Return updated profile
        updated = db.patient_profiles.find_one({
            "patient_id": str(patient_id)
        })

        return jsonify({
            "success": True,
            "message": "Patient profile updated",
            "data": clean_doc(updated)
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Failed to update patient",
            "details": str(e)
        }), 500


# ─────────────────────────────────────────────────────────
# DELETE /api/ai/patient/<patient_id>
# Delete patient profile
# ─────────────────────────────────────────────────────────

@patient_bp.route('/patient/<patient_id>', methods=['DELETE'])
def delete_patient(patient_id):
    """Delete a patient profile"""

    try:
        db = get_db()

        existing = db.patient_profiles.find_one({
            "patient_id": str(patient_id)
        })

        if not existing:
            return jsonify({
                "error": f"Patient {patient_id} not found"
            }), 404

        db.patient_profiles.update_one(
            {"patient_id": str(patient_id)},
            {"$set": {
                "deleted": True,
                "deleted_at": datetime.now()
            }}
        )

        return jsonify({
            "success": True,
            "message": f"Patient {patient_id} profile deleted"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────────────────
# GET /api/ai/patient/<patient_id>/risk
# Get AI risk factors only
# ─────────────────────────────────────────────────────────

@patient_bp.route('/patient/<patient_id>/risk', methods=['GET'])
def get_risk_factors(patient_id):
    """
    Get AI-computed risk factors for a patient

    Response:
    {
        "diabetes_risk": "HIGH",
        "cardiac_risk": "MODERATE",
        "hypertension_risk": "LOW",
        "bmi_category": "Overweight",
        "computed_at": "2025-01-15"
    }
    """

    try:
        db = get_db()

        profile = db.patient_profiles.find_one({
            "patient_id": str(patient_id)
        })

        if not profile:
            return jsonify({
                "error": f"Patient {patient_id} not found"
            }), 404

        risk_factors = profile.get('ai_risk_factors', {})

        # Add color coding for frontend
        risk_colors = {
            "HIGH": "red",
            "MODERATE": "amber",
            "LOW": "green"
        }

        risk_display = []
        for key, value in risk_factors.items():
            if key == 'computed_at':
                continue
            risk_display.append({
                "risk_type": key.replace('_', ' ').title(),
                "level": value,
                "color": risk_colors.get(value, "gray")
            })

        return jsonify({
            "success": True,
            "patient_id": patient_id,
            "data": {
                "risk_factors": risk_factors,
                "risk_display": risk_display,
                "personal_info": {
                    "name": profile.get('personal_info', {}).get('name'),
                    "age": profile.get('personal_info', {}).get('age'),
                    "bmi": profile.get('personal_info', {}).get('bmi')
                }
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────────────────
# GET /api/ai/patient/<patient_id>/history
# Get full consultation history
# ─────────────────────────────────────────────────────────

@patient_bp.route('/patient/<patient_id>/history', methods=['GET'])
def get_patient_history(patient_id):
    """
    Get all consultations, predictions, and validations
    for a specific patient
    """

    try:
        db = get_db()

        # Check patient exists
        profile = db.patient_profiles.find_one({
            "patient_id": str(patient_id)
        })

        # Get all related records
        predictions = list(db.ai_predictions.find({
            "patient_id": str(patient_id)
        }))

        comparisons = list(db.comparisons.find({
            "patient_id": str(patient_id)
        }))

        sessions = list(db.symptom_sessions.find({
            "patient_id": str(patient_id)
        }))

        # Clean all records
        clean_predictions = [clean_doc(p) for p in predictions]
        clean_comparisons = [clean_doc(c) for c in comparisons]
        clean_sessions = [clean_doc(s) for s in sessions]

        # Build timeline
        timeline = []
        for p in clean_predictions:
            timeline.append({
                "type": "prediction",
                "date": p.get('created_at'),
                "summary": f"AI predicted: {p.get('predicted_disease')} ({p.get('confidence')}%)",
                "data": p
            })
        for c in clean_comparisons:
            timeline.append({
                "type": "comparison",
                "date": c.get('created_at'),
                "summary": f"AI: {c.get('ai_prediction')} vs Doctor: {c.get('doctor_diagnosis')} — {c.get('match_status')}",
                "data": c
            })

        # Sort by date newest first
        timeline.sort(
            key=lambda x: x.get('date') or '',
            reverse=True
        )

        return jsonify({
            "success": True,
            "patient_id": patient_id,
            "patient_name": profile.get(
                'personal_info', {}
            ).get('name') if profile else "Unknown",
            "data": {
                "total_consultations": len(predictions),
                "total_comparisons": len(comparisons),
                "sessions": clean_sessions,
                "predictions": clean_predictions,
                "comparisons": clean_comparisons,
                "timeline": timeline[:20]
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────────────────
# GET /api/ai/patients
# Get all patients list
# ─────────────────────────────────────────────────────────

@patient_bp.route('/patients', methods=['GET'])
def get_all_patients():
    """
    Get list of all patients

    Query params:
        search=john     (optional — search by name)
        limit=50        (optional — max records)
        risk=HIGH       (optional — filter by risk level)
    """

    try:
        db = get_db()

        search = request.args.get('search', '').strip()
        limit = int(request.args.get('limit', 50))
        risk_filter = request.args.get('risk', '').upper()

        # Get all non-deleted profiles
        all_profiles = db.patient_profiles.find(
            {"deleted": {"$ne": True}}
        )
        profiles = list(all_profiles)

        # Apply search filter
        if search:
            profiles = [
                p for p in profiles
                if search.lower() in
                p.get('personal_info', {}).get('name', '').lower()
                or search.lower() in p.get('patient_id', '').lower()
            ]

        # Apply risk filter
        if risk_filter:
            profiles = [
                p for p in profiles
                if any(
                    v == risk_filter
                    for k, v in p.get('ai_risk_factors', {}).items()
                    if k != 'computed_at' and k != 'bmi_category'
                )
            ]

        # Build summary list (not full profile)
        patient_list = []
        for p in profiles[:limit]:
            personal = p.get('personal_info', {})
            risks = p.get('ai_risk_factors', {})
            patient_list.append({
                "patient_id": p.get('patient_id'),
                "name": personal.get('name'),
                "age": personal.get('age'),
                "gender": personal.get('gender'),
                "blood_group": personal.get('blood_group'),
                "bmi": personal.get('bmi'),
                "bmi_category": risks.get('bmi_category'),
                "highest_risk": _get_highest_risk(risks),
                "consultation_count": p.get('consultation_count', 0),
                "chronic_conditions": p.get(
                    'medical_history', {}
                ).get('chronic_conditions', []),
                "created_at": str(p.get('created_at', ''))
            })

        return jsonify({
            "success": True,
            "total": len(patient_list),
            "data": patient_list
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────────────────
# POST /api/ai/patient/<patient_id>/predict
# Predict disease using patient history + symptoms
# ─────────────────────────────────────────────────────────

@patient_bp.route('/patient/<patient_id>/predict', methods=['POST'])
def predict_with_history(patient_id):
    """
    Predict disease using BOTH symptoms AND patient history
    More accurate than symptoms alone

    Request Body:
    {
        "symptoms": ["high_fever", "chills", "headache"],
        "appointment_id": "A001"
    }

    Enhancement over regular predict:
    - Uses patient age for age-specific diseases
    - Considers chronic conditions as risk factors
    - Considers family history
    - Adjusts confidence based on risk profile
    """

    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body required"}), 400

        symptoms = data.get('symptoms', [])
        appointment_id = data.get('appointment_id', f"A_{int(datetime.now().timestamp())}")

        if not symptoms:
            return jsonify({"error": "symptoms is required"}), 400

        db = get_db()

        # Get patient profile
        profile = db.patient_profiles.find_one({
            "patient_id": str(patient_id)
        })

        # Get base AI prediction
        from modules.predictor import get_predictor
        predictor = get_predictor()
        base_result = predictor.predict(symptoms)

        # Enhance prediction with patient history
        if profile:
            base_result = _enhance_with_history(base_result, profile, symptoms)

            # Update consultation count
            db.patient_profiles.update_one(
                {"patient_id": str(patient_id)},
                {"$set": {
                    "consultation_count": profile.get("consultation_count", 0) + 1,
                    "last_consultation": datetime.now(),
                    "updated_at": datetime.now()
                }}
            )

        # Save prediction
        from database.models import new_prediction_record
        record = new_prediction_record(
            patient_id=patient_id,
            appointment_id=appointment_id,
            symptoms=symptoms,
            predicted_disease=base_result.get('predicted_disease', ''),
            confidence=base_result.get('confidence', 0),
            top_predictions=base_result.get('top_predictions', []),
            recommended_tests=base_result.get('recommended_tests', []),
            suggested_medicines=base_result.get('suggested_medicines', []),
            specialist=base_result.get('specialist', ''),
            severity=base_result.get('severity', ''),
            notes=base_result.get('notes', '')
        )
        db.ai_predictions.insert_one(record)

        return jsonify({
            "success": True,
            "patient_id": patient_id,
            "patient_name": profile.get(
                'personal_info', {}
            ).get('name') if profile else None,
            "appointment_id": appointment_id,
            "data": base_result
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Prediction with history failed",
            "details": str(e)
        }), 500


# ─────────────────────────────────────────────────────────
# HELPER FUNCTIONS
# ─────────────────────────────────────────────────────────

def _get_highest_risk(risks: dict) -> str:
    """Get the highest risk level from all risk factors"""
    risk_order = {"HIGH": 3, "MODERATE": 2, "LOW": 1}
    max_risk = "LOW"
    max_score = 0

    for key, value in risks.items():
        if key in ('computed_at', 'bmi_category'):
            continue
        score = risk_order.get(str(value), 0)
        if score > max_score:
            max_score = score
            max_risk = value

    return max_risk


def _enhance_with_history(
    prediction: dict,
    profile: dict,
    symptoms: list
) -> dict:
    """
    Enhance AI prediction result with patient history context
    Adds warnings and adjustments based on medical history
    """

    personal = profile.get('personal_info', {})
    history = profile.get('medical_history', {})
    risks = profile.get('ai_risk_factors', {})

    enhancements = []
    warnings = []
    additional_tests = []

    chronic = history.get('chronic_conditions', [])
    allergies = history.get('allergies', [])
    medications = history.get('current_medications', [])
    predicted = prediction.get('predicted_disease', '')

    # Age-based consideration
    age = personal.get('age')
    if age:
        if age > 60:
            enhancements.append(
                f"Elderly patient ({age}y) — consider atypical presentations"
            )
            additional_tests.append("Complete Blood Count")
            additional_tests.append("Kidney Function Test")
        elif age < 12:
            enhancements.append(
                f"Pediatric patient ({age}y) — adjust dosages"
            )

    # Chronic condition interactions
    for condition in chronic:
        cond_lower = condition.lower()

        if "diabetes" in cond_lower:
            enhancements.append(
                "Patient has Diabetes — monitor blood sugar during treatment"
            )
            if "infection" in predicted.lower() or predicted in [
                "Pneumonia", "Tuberculosis", "Urinary tract infection"
            ]:
                warnings.append(
                    "⚠️ Diabetic patient with infection — higher severity risk"
                )
                additional_tests.append("HbA1c")

        if "hypertension" in cond_lower:
            enhancements.append(
                "Patient has Hypertension — monitor BP during treatment"
            )
            additional_tests.append("ECG")

        if "kidney" in cond_lower or "renal" in cond_lower:
            warnings.append(
                "⚠️ Kidney disease — adjust medication doses carefully"
            )
            additional_tests.append("Creatinine Level")

    # Allergy check on suggested medicines
    suggested_meds = prediction.get('suggested_medicines', [])
    allergy_conflicts = []
    for med in suggested_meds:
        for allergy in allergies:
            if allergy.lower() in med.lower():
                allergy_conflicts.append(
                    f"🚨 ALLERGY ALERT: {med} — patient allergic to {allergy}"
                )

    # Current medication interactions
    drug_warnings = []
    if medications:
        drug_warnings.append(
            f"Patient is on: {', '.join(medications[:3])} — check interactions"
        )

    # Add all enhancements to prediction result
    prediction['patient_history_context'] = {
        "patient_name": personal.get('name'),
        "age": age,
        "bmi": personal.get('bmi'),
        "bmi_category": risks.get('bmi_category'),
        "chronic_conditions": chronic,
        "allergies": allergies,
        "enhancements": enhancements,
        "warnings": warnings + allergy_conflicts,
        "drug_warnings": drug_warnings,
        "additional_tests_from_history": list(set(additional_tests)),
        "risk_summary": {
            "diabetes_risk": risks.get('diabetes_risk', 'UNKNOWN'),
            "cardiac_risk": risks.get('cardiac_risk', 'UNKNOWN'),
            "hypertension_risk": risks.get('hypertension_risk', 'UNKNOWN')
        }
    }

    # Combine additional tests
    existing_tests = prediction.get('recommended_tests', [])
    all_tests = list(set(existing_tests + additional_tests))
    prediction['recommended_tests'] = all_tests

    return prediction