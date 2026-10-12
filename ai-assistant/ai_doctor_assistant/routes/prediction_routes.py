"""
Prediction Routes
POST /api/ai/predict  — Predict disease from symptoms
GET  /api/ai/symptoms — Get all valid symptoms
GET  /api/ai/diseases — Get all disease names
GET  /api/ai/info     — Get model info
"""

from flask import Blueprint, request, jsonify
from modules.predictor import get_predictor

prediction_bp = Blueprint('prediction', __name__)


# ─────────────────────────────────────────────────────────
# POST /api/ai/predict
# ─────────────────────────────────────────────────────────

@prediction_bp.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', [])

        predictor = get_predictor()
        result = predictor.predict(symptoms)

        if result.get('error'):
            return jsonify({"error": result['error']}), 400

        # ── ADD MEDICAL VALIDATION ──────────────────────────
        try:
            from modules.medical_validator import get_medical_validator
            validator = get_medical_validator()

            validation_report = validator.generate_full_report(
                predicted_disease=result['predicted_disease'],
                symptoms=symptoms,
                confidence=result['confidence'],
                medicines=result.get('suggested_medicines', []),
                top_predictions=result.get('top_predictions', []),
                patient_conditions=data.get('patient_conditions', [])
            )

            result['medical_validation'] = validation_report

        except Exception as ve:
            result['medical_validation'] = {
                "error": str(ve),
                "note": "Validation unavailable"
            }
        # ────────────────────────────────────────────────────

        # Save to DB (existing code)
        patient_id = data.get('patient_id')
        appointment_id = data.get('appointment_id')
        if patient_id and appointment_id:
            try:
                from database.connection import get_db
                from database.models import new_prediction_record
                db = get_db()
                record = new_prediction_record(
                    patient_id=patient_id,
                    appointment_id=appointment_id,
                    symptoms=symptoms,
                    predicted_disease=result['predicted_disease'],
                    confidence=result['confidence'],
                    top_predictions=result.get('top_predictions', []),
                    recommended_tests=result.get('recommended_tests', []),
                    suggested_medicines=result.get('suggested_medicines', []),
                    specialist=result.get('specialist', ''),
                    severity=result.get('severity', ''),
                    notes=result.get('notes', '')
                )
                db.ai_predictions.insert_one(record)
                result['saved_to_db'] = True
            except Exception:
                result['saved_to_db'] = False

        return jsonify({"success": True, "data": result}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────────────────
# GET /api/ai/symptoms
# ─────────────────────────────────────────────────────────

@prediction_bp.route('/symptoms', methods=['GET'])
def get_symptoms():
    """
    Get all valid symptom keys

    Query params:
        search=fever  (optional - filter symptoms)
    """

    try:
        predictor = get_predictor()
        all_symptoms = predictor.get_all_symptoms()

        search = request.args.get('search', '').lower().strip()

        if search:
            all_symptoms = [
                s for s in all_symptoms
                if search in s.lower()
            ]

        # Add display names
        symptoms_with_names = []
        for sym in all_symptoms:
            symptoms_with_names.append({
                "key": sym,
                "display": predictor.get_display_name(sym)
            })

        return jsonify({
            "success": True,
            "total": len(symptoms_with_names),
            "symptoms": symptoms_with_names
        }), 200

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


# ─────────────────────────────────────────────────────────
# GET /api/ai/diseases
# ─────────────────────────────────────────────────────────

@prediction_bp.route('/diseases', methods=['GET'])
def get_diseases():
    """Get all disease names the model can predict"""

    try:
        predictor = get_predictor()
        diseases = predictor.get_all_diseases()

        return jsonify({
            "success": True,
            "total": len(diseases),
            "diseases": sorted(diseases)
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────────────────
# GET /api/ai/info
# ─────────────────────────────────────────────────────────

@prediction_bp.route('/info', methods=['GET'])
def model_info():
    """Get AI model information and metadata"""

    try:
        predictor = get_predictor()
        info = predictor.get_model_info()

        return jsonify({
            "success": True,
            "model_info": info
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500