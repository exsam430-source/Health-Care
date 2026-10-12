# routes/analytics_routes.py

from flask import Blueprint, jsonify, request
from database.connection import get_db
from datetime import datetime, timedelta
from collections import Counter

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/analytics/overview', methods=['GET'])
def get_analytics_overview():
    """Comprehensive analytics for doctor dashboard"""

    db = get_db()
    days = int(request.args.get('days', 30))
    since = datetime.now() - timedelta(days=days)

    try:
        # All comparisons
        all_comparisons = db.comparisons.find({})
        all_predictions = db.ai_predictions.find({})
        all_sessions = db.symptom_sessions.find({})

        comparisons = list(all_comparisons)
        predictions = list(all_predictions)
        sessions = list(all_sessions)

        # Most common diseases
        diseases = [c.get('ai_prediction', '') for c in comparisons]
        disease_freq = Counter(diseases).most_common(10)

        # AI accuracy over time
        validated = [
            c for c in comparisons
            if c.get('lab_validated') and c.get('ai_correct') is not None
        ]

        # Most common symptoms
        all_symptoms = []
        for s in sessions:
            all_symptoms.extend(s.get('all_confirmed_symptoms', []))
        symptom_freq = Counter(all_symptoms).most_common(15)

        # Match rate
        matched = sum(1 for c in comparisons if c.get('match_status') == 'MATCH')
        total_comp = len(comparisons)
        match_rate = round(matched / max(total_comp, 1) * 100, 1)

        # AI accuracy from validated
        correct = sum(1 for v in validated if v.get('ai_correct'))
        ai_accuracy = round(correct / max(len(validated), 1) * 100, 1)

        # Suggestion acceptance
        total_suggested = sum(
            len(s.get('ai_suggested_confirmed', [])) +
            len(s.get('ai_suggested_denied', []))
            for s in sessions
        )
        total_confirmed = sum(
            len(s.get('ai_suggested_confirmed', []))
            for s in sessions
        )
        acceptance_rate = round(
            total_confirmed / max(total_suggested, 1) * 100, 1
        )

        return jsonify({
            "success": True,
            "data": {
                "period_days": days,
                "total_consultations": len(predictions),
                "total_comparisons": total_comp,
                "total_validations": len(validated),
                "ai_accuracy": ai_accuracy,
                "doctor_ai_match_rate": match_rate,
                "symptom_suggestion_acceptance": acceptance_rate,
                "top_diseases": [
                    {"disease": d, "count": c}
                    for d, c in disease_freq
                ],
                "top_symptoms": [
                    {"symptom": s, "count": c}
                    for s, c in symptom_freq
                ]
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500