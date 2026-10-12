"""
Validation Routes
POST /api/ai/validate          — Validate with lab results
GET  /api/ai/validation-history — Get validation history
POST /api/ai/batch-retrain      — Trigger batch retraining
"""

from flask import Blueprint, request, jsonify
from modules.validator import get_validator
from modules.retrainer import get_retrainer

validation_bp = Blueprint('validation', __name__)


# ─────────────────────────────────────────────────────────
# POST /api/ai/validate
# ─────────────────────────────────────────────────────────

@validation_bp.route('/validate', methods=['POST'])
def validate():
    """
    Validate AI and Doctor predictions against lab results
    Auto-triggers retraining if AI was wrong

    Request Body:
    {
        "patient_id": "P001",
        "appointment_id": "A001",
        "lab_confirmed_disease": "Malaria"
    }

    Response:
    {
        "ai_prediction": "Malaria",
        "doctor_diagnosis": "Dengue",
        "lab_confirmed_disease": "Malaria",
        "ai_correct": true,
        "doctor_correct": false,
        "retrain_triggered": false,
        "result_message": "AI was correct..."
    }
    """

    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body required"}), 400

        patient_id = data.get('patient_id')
        appointment_id = data.get('appointment_id')
        lab_confirmed_disease = data.get('lab_confirmed_disease')

        if not patient_id:
            return jsonify({"error": "patient_id is required"}), 400
        if not appointment_id:
            return jsonify({"error": "appointment_id is required"}), 400
        if not lab_confirmed_disease:
            return jsonify({
                "error": "lab_confirmed_disease is required"
            }), 400

        validator = get_validator()
        result = validator.validate_with_lab(
            patient_id=patient_id,
            appointment_id=appointment_id,
            lab_confirmed_disease=lab_confirmed_disease
        )

        if result.get('error'):
            return jsonify({"error": result['error']}), 404

        return jsonify({
            "success": True,
            "data": result
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Validation failed",
            "details": str(e)
        }), 500


# ─────────────────────────────────────────────────────────
# GET /api/ai/validation-history
# ─────────────────────────────────────────────────────────

@validation_bp.route('/validation-history', methods=['GET'])
def validation_history():
    """Get recent validation records"""

    try:
        limit = int(request.args.get('limit', 20))

        validator = get_validator()
        records = validator.get_validation_history(limit=limit)

        return jsonify({
            "success": True,
            "total": len(records),
            "data": records
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────────────────
# POST /api/ai/batch-retrain
# ─────────────────────────────────────────────────────────

@validation_bp.route('/batch-retrain', methods=['POST'])
def batch_retrain():
    """
    Trigger batch retraining with all pending feedback
    Should be called periodically
    """

    try:
        retrainer = get_retrainer()
        result = retrainer.batch_retrain()

        return jsonify({
            "success": True,
            "data": result
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Batch retraining failed",
            "details": str(e)
        }), 500