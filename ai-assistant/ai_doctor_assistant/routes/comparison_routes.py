"""
Comparison Routes
POST /api/ai/compare      — Save AI vs Doctor comparison
GET  /api/ai/comparison   — Get comparison record
GET  /api/ai/comparisons  — Get all comparisons
"""

from flask import Blueprint, request, jsonify
from modules.comparator import get_comparator
from modules.predictor import get_predictor

comparison_bp = Blueprint('comparison', __name__)


# ─────────────────────────────────────────────────────────
# POST /api/ai/compare
# ─────────────────────────────────────────────────────────

@comparison_bp.route('/compare', methods=['POST'])
def compare():
    """
    Save and compare AI prediction with Doctor diagnosis

    Request Body:
    {
        "patient_id": "P001",
        "appointment_id": "A001",
        "symptoms": ["high_fever", "chills", "headache"],
        "doctor_diagnosis": "Malaria",
        "doctor_notes": "Patient has been to tropical region"
    }

    Note: ai_prediction is automatically fetched from DB
          or re-predicted from symptoms
    """

    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body required"}), 400

        # Required fields
        patient_id = data.get('patient_id')
        appointment_id = data.get('appointment_id')
        doctor_diagnosis = data.get('doctor_diagnosis')

        if not patient_id:
            return jsonify({"error": "patient_id is required"}), 400
        if not appointment_id:
            return jsonify({"error": "appointment_id is required"}), 400
        if not doctor_diagnosis:
            return jsonify({"error": "doctor_diagnosis is required"}), 400

        symptoms = data.get('symptoms', [])
        doctor_notes = data.get('doctor_notes', '')
        ai_prediction = data.get('ai_prediction', '')
        ai_confidence = data.get('ai_confidence', 0.0)

        # If AI prediction not provided, get from DB or re-predict
        if not ai_prediction:
            try:
                from database.connection import get_db
                db = get_db()

                # Check if we have a saved prediction
                saved = db.ai_predictions.find_one({
                    "patient_id": str(patient_id),
                    "appointment_id": str(appointment_id)
                })

                if saved:
                    ai_prediction = saved.get('predicted_disease', '')
                    ai_confidence = saved.get('confidence', 0.0)
                    if not symptoms:
                        symptoms = saved.get('symptoms', [])

                elif symptoms:
                    # Re-predict from symptoms
                    predictor = get_predictor()
                    pred_result = predictor.predict(symptoms)
                    ai_prediction = pred_result.get('predicted_disease', '')
                    ai_confidence = pred_result.get('confidence', 0.0)

            except Exception as e:
                print(f"   AI prediction fetch error: {e}")

        if not ai_prediction:
            return jsonify({
                "error": "Could not determine AI prediction",
                "tip": "Include symptoms or ai_prediction in request"
            }), 400

        # Save comparison
        comparator = get_comparator()
        result = comparator.compare_and_save(
            patient_id=patient_id,
            appointment_id=appointment_id,
            symptoms=symptoms,
            ai_prediction=ai_prediction,
            ai_confidence=ai_confidence,
            doctor_diagnosis=doctor_diagnosis,
            doctor_notes=doctor_notes
        )

        return jsonify({
            "success": True,
            "data": result
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Comparison failed",
            "details": str(e)
        }), 500


# ─────────────────────────────────────────────────────────
# GET /api/ai/comparison
# ─────────────────────────────────────────────────────────

@comparison_bp.route('/comparison', methods=['GET'])
def get_comparison():
    """
    Get comparison record for a patient/appointment

    Query params:
        patient_id=P001
        appointment_id=A001
    """

    try:
        patient_id = request.args.get('patient_id')
        appointment_id = request.args.get('appointment_id')

        if not patient_id or not appointment_id:
            return jsonify({
                "error": "patient_id and appointment_id are required"
            }), 400

        comparator = get_comparator()
        record = comparator.get_comparison(patient_id, appointment_id)

        if not record:
            return jsonify({
                "error": "No comparison found",
                "patient_id": patient_id,
                "appointment_id": appointment_id
            }), 404

        return jsonify({
            "success": True,
            "data": record
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────────────────
# GET /api/ai/comparisons
# ─────────────────────────────────────────────────────────

@comparison_bp.route('/comparisons', methods=['GET'])
def get_all_comparisons():
    """Get all comparison records"""

    try:
        limit = int(request.args.get('limit', 50))

        comparator = get_comparator()
        records = comparator.get_all_comparisons(limit=limit)

        return jsonify({
            "success": True,
            "total": len(records),
            "data": records
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500