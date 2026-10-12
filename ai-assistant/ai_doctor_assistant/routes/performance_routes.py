"""
Performance Routes
GET /api/ai/performance    — Get AI accuracy stats
GET /api/ai/retrain-stats  — Get retraining history
GET /api/ai/health         — Health check
"""

from flask import Blueprint, request, jsonify
from database.connection import get_db
from modules.retrainer import get_retrainer
from datetime import datetime

performance_bp = Blueprint('performance', __name__)


# ─────────────────────────────────────────────────────────
# GET /api/ai/performance
# ─────────────────────────────────────────────────────────

@performance_bp.route('/performance', methods=['GET'])
def get_performance():
    """
    Get AI performance statistics

    Response:
    {
        "total_predictions": 150,
        "correct_predictions": 127,
        "wrong_predictions": 23,
        "accuracy_percentage": 84.6,
        "total_comparisons": 89,
        "match_count": 67,
        "mismatch_count": 22,
        "last_retrain_date": "2025-01-10",
        "retraining_count": 5
    }
    """

    try:
        db = get_db()
        stats = db.ai_performance.find_one({})

        if not stats:
            # Return default stats if none exist
            return jsonify({
                "success": True,
                "data": {
                    "total_predictions": 0,
                    "correct_predictions": 0,
                    "wrong_predictions": 0,
                    "accuracy_percentage": 0.0,
                    "total_comparisons": 0,
                    "match_count": 0,
                    "mismatch_count": 0,
                    "last_retrain_date": None,
                    "retraining_count": 0,
                    "message": "No data yet — start making predictions"
                }
            }), 200

        # Clean for JSON
        stats.pop('_id', None)
        for key in ['created_at', 'updated_at', 'last_retrain_date']:
            if key in stats and stats[key]:
                stats[key] = str(stats[key])

        # Add extra computed stats
        total_comp = stats.get('total_comparisons', 0)
        if total_comp > 0:
            match_rate = round(
                stats.get('match_count', 0) / total_comp * 100, 1
            )
            stats['doctor_ai_agreement_rate'] = match_rate
        else:
            stats['doctor_ai_agreement_rate'] = 0

        return jsonify({
            "success": True,
            "data": stats
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────────────────
# GET /api/ai/retrain-stats
# ─────────────────────────────────────────────────────────

@performance_bp.route('/retrain-stats', methods=['GET'])
def retrain_stats():
    """Get retraining history and pending feedback count"""

    try:
        retrainer = get_retrainer()
        stats = retrainer.get_retraining_stats()

        return jsonify({
            "success": True,
            "data": stats
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────────────────
# GET /api/ai/health
# ─────────────────────────────────────────────────────────

@performance_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    Tests all components are working
    """

    health = {
        "status": "healthy",
        "timestamp": str(datetime.now()),
        "components": {}
    }

    # Check model
    try:
        from modules.predictor import get_predictor
        predictor = get_predictor()
        info = predictor.get_model_info()
        health["components"]["model"] = {
            "status": "ok",
            "type": info.get("model_type"),
            "accuracy": info.get("accuracy"),
            "diseases": info.get("n_diseases"),
            "symptoms": info.get("n_symptoms")
        }
    except Exception as e:
        health["components"]["model"] = {
            "status": "error",
            "error": str(e)
        }
        health["status"] = "degraded"

    # Check symptom suggester
    try:
        from modules.symptom_suggester import get_suggester
        suggester = get_suggester()
        health["components"]["symptom_suggester"] = {
            "status": "ok",
            "symptoms_indexed": len(suggester.cooccurrence_map)
        }
    except Exception as e:
        health["components"]["symptom_suggester"] = {
            "status": "error",
            "error": str(e)
        }

    # Check database
    try:
        db = get_db()
        health["components"]["database"] = {
            "status": "ok",
            "type": (
                "MongoDB"
                if "InMemory" not in type(db).__name__
                else "In-Memory"
            )
        }
    except Exception as e:
        health["components"]["database"] = {
            "status": "error",
            "error": str(e)
        }
        health["status"] = "degraded"

    status_code = 200 if health["status"] == "healthy" else 207

    return jsonify(health), status_code