"""
Lab Test Routes
Complete API for lab test lifecycle

POST /api/ai/lab/suggest          — AI suggests tests
POST /api/ai/lab/doctor-confirm   — Doctor confirms/modifies tests
POST /api/ai/lab/upload-results   — Lab uploads results
GET  /api/ai/lab/record           — Get lab record
GET  /api/ai/lab/records          — Get all lab records
GET  /api/ai/lab/comparison       — Get comparison result
"""

from flask import Blueprint, request, jsonify
from modules.lab_suggester import get_lab_suggester

lab_bp = Blueprint('lab', __name__)


# ─────────────────────────────────────────────────────────
# POST /api/ai/lab/suggest
# AI suggests lab tests after prediction
# ─────────────────────────────────────────────────────────

@lab_bp.route('/lab/suggest', methods=['POST'])
def suggest_lab_tests():
    """
    AI suggests lab tests based on predicted disease

    Request Body:
    {
        "predicted_disease": "Malaria",
        "symptoms": ["high_fever", "chills", "headache"],
        "patient_id": "P001",
        "appointment_id": "A001",
        "include_optional": true
    }

    Response:
    {
        "predicted_disease": "Malaria",
        "urgency_level": "EMERGENCY",
        "essential_tests": [
            {
                "name": "Peripheral Blood Smear",
                "type": "Microscopy",
                "urgency": "emergency",
                "description": "Gold standard for malaria"
            }
        ],
        "optional_tests": [...],
        "normal_ranges": {...},
        "ai_notes": "..."
    }
    """

    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body required"}), 400

        predicted_disease = data.get('predicted_disease')
        if not predicted_disease:
            return jsonify({
                "error": "predicted_disease is required"
            }), 400

        symptoms = data.get('symptoms', [])
        patient_id = data.get('patient_id')
        appointment_id = data.get('appointment_id')
        include_optional = data.get('include_optional', True)

        lab_suggester = get_lab_suggester()
        result = lab_suggester.suggest_tests(
            predicted_disease=predicted_disease,
            symptoms=symptoms,
            patient_id=patient_id,
            appointment_id=appointment_id,
            include_optional=include_optional
        )

        return jsonify({
            "success": True,
            "data": result
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Lab suggestion failed",
            "details": str(e)
        }), 500


# ─────────────────────────────────────────────────────────
# POST /api/ai/lab/doctor-confirm
# Doctor confirms or modifies AI suggested tests
# ─────────────────────────────────────────────────────────

@lab_bp.route('/lab/doctor-confirm', methods=['POST'])
def doctor_confirm_tests():
    """
    Doctor reviews AI test suggestions and
    confirms or modifies the test list

    Request Body:
    {
        "patient_id": "P001",
        "appointment_id": "A001",
        "ordered_tests": [
            "Peripheral Blood Smear",
            "Complete Blood Count",
            "Blood Glucose"
        ],
        "doctor_notes": "Added glucose test due to diabetic history"
    }

    Response:
    {
        "agreed_tests": ["Peripheral Blood Smear", "CBC"],
        "doctor_added_tests": ["Blood Glucose"],
        "doctor_skipped_ai_tests": ["RDT"],
        "agreement_rate": 85.5,
        "was_modified": true
    }
    """

    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body required"}), 400

        patient_id = data.get('patient_id')
        appointment_id = data.get('appointment_id')
        ordered_tests = data.get('ordered_tests', [])
        doctor_notes = data.get('doctor_notes', '')

        if not patient_id:
            return jsonify({"error": "patient_id is required"}), 400
        if not appointment_id:
            return jsonify({"error": "appointment_id is required"}), 400
        if not ordered_tests:
            return jsonify({
                "error": "ordered_tests list is required"
            }), 400

        lab_suggester = get_lab_suggester()
        result = lab_suggester.doctor_confirm_tests(
            patient_id=patient_id,
            appointment_id=appointment_id,
            ordered_tests=ordered_tests,
            doctor_notes=doctor_notes
        )

        if result.get('error'):
            return jsonify({"error": result['error']}), 404

        return jsonify({
            "success": True,
            "data": result
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Doctor confirmation failed",
            "details": str(e)
        }), 500


# ─────────────────────────────────────────────────────────
# POST /api/ai/lab/upload-results
# Lab uploads test results
# ─────────────────────────────────────────────────────────

@lab_bp.route('/lab/upload-results', methods=['POST'])
def upload_lab_results():
    """
    Lab technician uploads test results
    Automatically triggers comparison with AI and Doctor

    Request Body:
    {
        "patient_id": "P001",
        "appointment_id": "A001",
        "confirmed_disease": "Malaria",
        "lab_notes": "P. falciparum detected",
        "lab_results": [
            {
                "test_name": "Peripheral Blood Smear",
                "value": "P. falciparum seen (2+ parasitemia)",
                "unit": "",
                "reference_range": "No parasites seen",
                "status": "abnormal",
                "notes": "Ring forms and gametocytes seen"
            },
            {
                "test_name": "Complete Blood Count",
                "value": "9.2",
                "unit": "g/dL",
                "reference_range": "12-16 g/dL",
                "status": "abnormal",
                "notes": "Hemoglobin low — malaria anemia"
            },
            {
                "test_name": "Platelet Count",
                "value": "85000",
                "unit": "/μL",
                "reference_range": "150000-400000 /μL",
                "status": "critical",
                "notes": "Thrombocytopenia — monitor closely"
            }
        ]
    }
    """

    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body required"}), 400

        patient_id = data.get('patient_id')
        appointment_id = data.get('appointment_id')
        lab_results = data.get('lab_results', [])
        confirmed_disease = data.get('confirmed_disease', '')
        lab_notes = data.get('lab_notes', '')

        if not patient_id:
            return jsonify({"error": "patient_id is required"}), 400
        if not appointment_id:
            return jsonify({"error": "appointment_id is required"}), 400
        if not lab_results:
            return jsonify({
                "error": "lab_results list is required"
            }), 400

        lab_suggester = get_lab_suggester()
        result = lab_suggester.upload_lab_results(
            patient_id=patient_id,
            appointment_id=appointment_id,
            lab_results=lab_results,
            confirmed_disease=confirmed_disease,
            lab_notes=lab_notes
        )

        if result.get('error'):
            return jsonify({"error": result['error']}), 400

        return jsonify({
            "success": True,
            "data": result
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Lab upload failed",
            "details": str(e)
        }), 500


# ─────────────────────────────────────────────────────────
# GET /api/ai/lab/record
# Get lab record for patient
# ─────────────────────────────────────────────────────────

@lab_bp.route('/lab/record', methods=['GET'])
def get_lab_record():
    """
    Get complete lab record for a patient appointment

    Query Params:
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

        lab_suggester = get_lab_suggester()
        record = lab_suggester.get_lab_record(patient_id, appointment_id)

        if not record:
            return jsonify({
                "error": "No lab record found",
                "tip": "Call POST /api/ai/lab/suggest first"
            }), 404

        return jsonify({
            "success": True,
            "data": record
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────────────────
# GET /api/ai/lab/records
# Get all lab records
# ─────────────────────────────────────────────────────────

@lab_bp.route('/lab/records', methods=['GET'])
def get_all_lab_records():
    """Get all lab records with optional filtering"""

    try:
        limit = int(request.args.get('limit', 50))
        status = request.args.get('status', '')

        lab_suggester = get_lab_suggester()
        records = lab_suggester.get_all_lab_records(limit=limit)

        # Filter by status if provided
        if status:
            records = [
                r for r in records
                if r.get('lab_status', '').lower() == status.lower()
            ]

        return jsonify({
            "success": True,
            "total": len(records),
            "data": records
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────────────────
# GET /api/ai/lab/comparison
# Get comparison result
# ─────────────────────────────────────────────────────────

@lab_bp.route('/lab/comparison', methods=['GET'])
def get_lab_comparison():
    """
    Get comparison result between:
    AI prediction vs Doctor diagnosis vs Lab result

    Query Params:
        patient_id=P001
        appointment_id=A001
    """

    try:
        patient_id = request.args.get('patient_id')
        appointment_id = request.args.get('appointment_id')

        if not patient_id or not appointment_id:
            return jsonify({
                "error": "patient_id and appointment_id required"
            }), 400

        lab_suggester = get_lab_suggester()
        record = lab_suggester.get_lab_record(patient_id, appointment_id)

        if not record:
            return jsonify({"error": "No lab record found"}), 404

        if not record.get('validated'):
            return jsonify({
                "message": "Lab results not yet uploaded",
                "lab_status": record.get('lab_status', 'pending'),
                "data": {
                    "predicted_disease": record.get('predicted_disease'),
                    "lab_status": record.get('lab_status'),
                    "essential_tests": record.get('essential_tests', []),
                    "doctor_ordered_tests": record.get(
                        'doctor_ordered_tests', []
                    )
                }
            }), 200

        return jsonify({
            "success": True,
            "data": {
                "validation_result": record.get('validation_result'),
                "lab_results": record.get('lab_results', []),
                "normal_ranges": record.get('normal_ranges', {}),
                "lab_confirmed_disease": record.get('lab_confirmed_disease'),
                "abnormal_count": record.get('abnormal_results_count', 0),
                "critical_count": record.get('critical_results_count', 0)
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500