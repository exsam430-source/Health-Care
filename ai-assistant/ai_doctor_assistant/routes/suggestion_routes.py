"""
Symptom Suggestion Routes
POST /api/ai/suggest-symptoms  — Get related symptom suggestions
POST /api/ai/update-suggestions — Refresh after confirm/deny
POST /api/ai/finalize-symptoms  — Get final prediction
"""

from flask import Blueprint, request, jsonify
from modules.symptom_suggester import get_suggester
from database.connection import get_db
from database.models import new_symptom_session

suggestion_bp = Blueprint('suggestion', __name__)


# ─────────────────────────────────────────────────────────
# POST /api/ai/suggest-symptoms
# ─────────────────────────────────────────────────────────

@suggestion_bp.route('/suggest-symptoms', methods=['POST'])
def suggest_symptoms():
    """
    Get related symptom suggestions based on current symptoms

    Request Body:
    {
        "current_symptoms": ["fever", "headache"],
        "confirmed_symptoms": [],
        "denied_symptoms": [],
        "max_suggestions": 6
    }

    Response:
    {
        "suggestions": [
            {
                "symptom_key": "chills",
                "symptom_name": "Chills / Shivering",
                "relevance_score": 72.5,
                "relevance_level": "HIGH",
                "doctor_question": "Is the patient having chills?",
                "status": "pending"
            }, ...
        ],
        "early_prediction": {
            "disease": "Malaria",
            "confidence": 78.3
        }
    }
    """

    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body required"}), 400

        current_symptoms = data.get('current_symptoms', [])
        confirmed_symptoms = data.get('confirmed_symptoms', [])
        denied_symptoms = data.get('denied_symptoms', [])
        max_suggestions = int(data.get('max_suggestions', 6))

        if not current_symptoms:
            return jsonify({
                "error": "current_symptoms is required",
                "example": {
                    "current_symptoms": ["fever", "headache"]
                }
            }), 400

        # Cap max suggestions
        max_suggestions = min(max_suggestions, 10)

        suggester = get_suggester()
        result = suggester.get_suggestions(
            current_symptoms=current_symptoms,
            confirmed_symptoms=confirmed_symptoms,
            denied_symptoms=denied_symptoms,
            max_suggestions=max_suggestions
        )

        return jsonify({
            "success": True,
            "data": result
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Suggestion failed",
            "details": str(e)
        }), 500


# ─────────────────────────────────────────────────────────
# POST /api/ai/update-suggestions
# ─────────────────────────────────────────────────────────

@suggestion_bp.route('/update-suggestions', methods=['POST'])
def update_suggestions():
    """
    Get fresh suggestions after doctor confirms or denies a symptom

    Request Body:
    {
        "current_symptoms": ["fever", "headache"],
        "confirmed_symptoms": ["chills", "sweating"],
        "denied_symptoms": ["vomiting"],
        "max_suggestions": 4
    }
    """

    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body required"}), 400

        current_symptoms = data.get('current_symptoms', [])
        confirmed_symptoms = data.get('confirmed_symptoms', [])
        denied_symptoms = data.get('denied_symptoms', [])
        max_suggestions = int(data.get('max_suggestions', 4))

        if not current_symptoms:
            return jsonify({
                "error": "current_symptoms is required"
            }), 400

        suggester = get_suggester()
        result = suggester.update_after_response(
            current_symptoms=current_symptoms,
            confirmed_symptoms=confirmed_symptoms,
            denied_symptoms=denied_symptoms,
            max_suggestions=max_suggestions
        )

        return jsonify({
            "success": True,
            "data": result
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Update failed",
            "details": str(e)
        }), 500


# ─────────────────────────────────────────────────────────
# POST /api/ai/finalize-symptoms
# ─────────────────────────────────────────────────────────

@suggestion_bp.route('/finalize-symptoms', methods=['POST'])
def finalize_symptoms():
    """
    Get final AI prediction using all confirmed symptoms
    Saves session to database

    Request Body:
    {
        "patient_id": "P001",
        "appointment_id": "A001",
        "original_symptoms": ["fever", "headache"],
        "confirmed_additional": ["chills", "sweating", "fatigue"],
        "denied_symptoms": ["vomiting", "skin_rash"]
    }
    """

    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body required"}), 400

        patient_id = data.get('patient_id', 'unknown')
        appointment_id = data.get('appointment_id', 'unknown')
        original_symptoms = data.get('original_symptoms', [])
        confirmed_additional = data.get('confirmed_additional', [])
        denied_symptoms = data.get('denied_symptoms', [])

        if not original_symptoms:
            return jsonify({
                "error": "original_symptoms is required"
            }), 400

        # Get final prediction
        suggester = get_suggester()
        result = suggester.finalize(
            original_symptoms=original_symptoms,
            confirmed_additional=confirmed_additional,
            denied_symptoms=denied_symptoms
        )

        if result.get('error'):
            return jsonify({"error": result['error']}), 400

        # Save session to database
        try:
            db = get_db()
            final_pred = result.get('final_prediction', {})
            session = new_symptom_session(
                patient_id=patient_id,
                appointment_id=appointment_id,
                original_symptoms=original_symptoms,
                ai_suggested_confirmed=confirmed_additional,
                ai_suggested_denied=denied_symptoms,
                all_confirmed_symptoms=result.get('all_confirmed_symptoms', []),
                final_prediction=final_pred.get('predicted_disease', ''),
                final_confidence=final_pred.get('confidence', 0)
            )
            db.symptom_sessions.insert_one(session)
            result['session_saved'] = True
        except Exception as e:
            result['session_saved'] = False

        result['patient_id'] = patient_id
        result['appointment_id'] = appointment_id

        return jsonify({
            "success": True,
            "data": result
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Finalization failed",
            "details": str(e)
        }), 500