"""
AI Doctor Assistant — Main Flask Application
Complete REST API for AI-powered medical assistance

Endpoints:
  POST /api/ai/predict               — Predict disease from symptoms
  GET  /api/ai/symptoms              — Get all valid symptoms
  GET  /api/ai/diseases              — Get all disease names
  GET  /api/ai/info                  — Get model info
  POST /api/ai/suggest-symptoms      — Get symptom suggestions
  POST /api/ai/update-suggestions    — Update suggestions
  POST /api/ai/finalize-symptoms     — Final prediction
  POST /api/ai/compare               — Compare AI vs Doctor
  GET  /api/ai/comparison            — Get comparison record
  GET  /api/ai/comparisons           — Get all comparisons
  POST /api/ai/validate              — Validate with lab results
  GET  /api/ai/validation-history    — Get validation history
  POST /api/ai/batch-retrain         — Batch retraining
  GET  /api/ai/performance           — AI performance stats
  GET  /api/ai/retrain-stats         — Retraining stats
  GET  /api/ai/health                — Health check
  POST /api/ai/patient               — Create patient profile
  GET  /api/ai/patient/<id>          — Get patient profile
  PUT  /api/ai/patient/<id>          — Update patient profile
  DELETE /api/ai/patient/<id>        — Delete patient profile
  GET  /api/ai/patient/<id>/risk     — Get patient risk factors
  GET  /api/ai/patient/<id>/history  — Get patient history
  GET  /api/ai/patients              — Get all patients
  POST /api/ai/patient/<id>/predict  — Predict with patient history
"""

import os
import sys

# ── Add project root to path ──────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify
from flask_cors import CORS

from config import Config

# ── Import all route blueprints ───────────────────────────
from routes.prediction_routes import prediction_bp
from routes.suggestion_routes import suggestion_bp
from routes.comparison_routes import comparison_bp
from routes.validation_routes import validation_bp
from routes.performance_routes import performance_bp
from routes.patient_routes import patient_bp
from routes.lab_routes import lab_bp

# ─────────────────────────────────────────────────────────
# APPLICATION FACTORY
# ─────────────────────────────────────────────────────────

def create_app():
    """Create and configure the Flask application"""

    app = Flask(__name__)
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['JSON_SORT_KEYS'] = False

    # ── CORS Configuration ────────────────────────────────
    CORS(app, resources={r"/*": {"origins": "*"}})

    # ── Register All Blueprints ───────────────────────────
    app.register_blueprint(prediction_bp,  url_prefix='/api/ai')
    app.register_blueprint(suggestion_bp,  url_prefix='/api/ai')
    app.register_blueprint(comparison_bp,  url_prefix='/api/ai')
    app.register_blueprint(validation_bp,  url_prefix='/api/ai')
    app.register_blueprint(performance_bp, url_prefix='/api/ai')
    app.register_blueprint(patient_bp,     url_prefix='/api/ai')
    app.register_blueprint(lab_bp, url_prefix='/api/ai')
    # Add after CORS setup in create_app()

    @app.after_request
    def add_medical_disclaimer(response):
        """
        Add medical disclaimer to every API response
        Required for medical software compliance
        """
        response.headers['X-Medical-Disclaimer'] = (
            'AI Decision Support Only - '
            'Not a substitute for professional medical advice'
        )
        response.headers['X-AI-Version'] = '1.0.0'
        return response
    # ── Root Route ────────────────────────────────────────
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            "name": "AI Doctor Assistant API",
            "version": "1.0.0",
            "status": "running",
            "total_endpoints": 24,
            "endpoints": {

                # ── Prediction ─────────────────────────────
                "predict":              "POST   /api/ai/predict",
                "symptoms_list":        "GET    /api/ai/symptoms",
                "diseases_list":        "GET    /api/ai/diseases",
                "model_info":           "GET    /api/ai/info",

                # ── Symptom Suggestions ────────────────────
                "suggest_symptoms":     "POST   /api/ai/suggest-symptoms",
                "update_suggestions":   "POST   /api/ai/update-suggestions",
                "finalize_symptoms":    "POST   /api/ai/finalize-symptoms",

                # ── Comparison ─────────────────────────────
                "compare":              "POST   /api/ai/compare",
                "get_comparison":       "GET    /api/ai/comparison",
                "all_comparisons":      "GET    /api/ai/comparisons",

                # ── Validation & Retraining ────────────────
                "validate":             "POST   /api/ai/validate",
                "validation_history":   "GET    /api/ai/validation-history",
                "batch_retrain":        "POST   /api/ai/batch-retrain",

                # ── Performance & Health ───────────────────
                "performance":          "GET    /api/ai/performance",
                "retrain_stats":        "GET    /api/ai/retrain-stats",
                "health":               "GET    /api/ai/health",

                # ---- Lab Test Suggestion --------------
                "lab_suggest":        "POST /api/ai/lab/suggest",
                "lab_doctor_confirm": "POST /api/ai/lab/doctor-confirm",
                "lab_upload_results": "POST /api/ai/lab/upload-results",
                "lab_record":         "GET  /api/ai/lab/record",
                "lab_records":        "GET  /api/ai/lab/records",
                "lab_comparison":     "GET  /api/ai/lab/comparison",

                # ── Patient Profiles ───────────────────────
                "create_patient":       "POST   /api/ai/patient",
                "get_patient":          "GET    /api/ai/patient/<patient_id>",
                "update_patient":       "PUT    /api/ai/patient/<patient_id>",
                "delete_patient":       "DELETE /api/ai/patient/<patient_id>",
                "all_patients":         "GET    /api/ai/patients",
                "patient_risk":         "GET    /api/ai/patient/<patient_id>/risk",
                "patient_history":      "GET    /api/ai/patient/<patient_id>/history",
                "predict_with_history": "POST   /api/ai/patient/<patient_id>/predict",
            },
            "docs": "Test all endpoints with: python tests/test_api.py",
            "health_check": "http://localhost:5001/api/ai/health"
        }), 200

    # ── Error Handlers ────────────────────────────────────

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({
            "error": "Bad request",
            "message": str(e),
            "tip": "Check your request body and parameters"
        }), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({
            "error": "Endpoint not found",
            "message": str(e),
            "available_at": "/api/ai/*",
            "tip": "Visit http://localhost:5001 to see all endpoints"
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({
            "error": "Method not allowed for this endpoint",
            "message": str(e)
        }), 405

    @app.errorhandler(409)
    def conflict(e):
        return jsonify({
            "error": "Conflict",
            "message": str(e)
        }), 409

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({
            "error": "Internal server error",
            "message": str(e),
            "tip": "Check the server logs for more details"
        }), 500

    return app


# ─────────────────────────────────────────────────────────
# STARTUP BANNER
# ─────────────────────────────────────────────────────────

def print_startup_banner(port):
    """Print startup information"""

    print("\n" + "=" * 65)
    print("   🤖 AI Doctor Assistant API — Started Successfully!")
    print("=" * 65)
    print(f"\n   🌐 Base URL:    http://localhost:{port}")
    print(f"   📋 API Root:    http://localhost:{port}/")
    print(f"   🏥 Health:      http://localhost:{port}/api/ai/health")
    print(f"   📊 Performance: http://localhost:{port}/api/ai/performance")
    print(f"   👥 Patients:    http://localhost:{port}/api/ai/patients")
    print("\n   ── Key Endpoints ──────────────────────────────────────")
    print(f"   POST http://localhost:{port}/api/ai/predict")
    print(f"   POST http://localhost:{port}/api/ai/suggest-symptoms")
    print(f"   POST http://localhost:{port}/api/ai/finalize-symptoms")
    print(f"   POST http://localhost:{port}/api/ai/compare")
    print(f"   POST http://localhost:{port}/api/ai/validate")
    print(f"   POST http://localhost:{port}/api/ai/patient")
    print(f"   GET  http://localhost:{port}/api/ai/patients")
    print(f"   POST http://localhost:{port}/api/ai/patient/<id>/predict")
    print("\n   ── Run Tests ──────────────────────────────────────────")
    print(f"   python tests/test_api.py")
    print("\n   Press CTRL+C to stop the server")
    print("=" * 65 + "\n")


# ─────────────────────────────────────────────────────────
# PRELOAD ALL COMPONENTS
# ─────────────────────────────────────────────────────────

def preload_components():
    """
    Pre-load all AI components on startup
    So first API request is not slow
    """

    print("\nInitializing AI Doctor Assistant...")
    print("-" * 45)

    errors = []

    # ── Database ──────────────────────────────────────────
    try:
        from database.connection import get_db
        print("   🔌 Connecting to database...")
        db = get_db()
        db_type = (
            "MongoDB"
            if "InMemory" not in type(db).__name__
            else "In-Memory (MongoDB not found)"
        )
        print(f"   ✅ Database: {db_type}")
    except Exception as e:
        msg = f"Database: {str(e)[:50]}"
        errors.append(msg)
        print(f"   ⚠️  {msg}")

    # ── AI Predictor ──────────────────────────────────────
    try:
        from modules.predictor import get_predictor
        print("   🧠 Loading AI prediction model...")
        predictor = get_predictor()
        info = predictor.get_model_info()
        print(f"   ✅ Model: {info.get('model_type')} "
              f"| Accuracy: {info.get('accuracy')}% "
              f"| Diseases: {info.get('n_diseases')} "
              f"| Symptoms: {info.get('n_symptoms')}")
    except Exception as e:
        msg = f"Predictor: {str(e)[:50]}"
        errors.append(msg)
        print(f"   ❌ {msg}")
        print("   ⚠️  Run: python setup_and_train.py")

    # ── Symptom Suggester ─────────────────────────────────
    try:
        from modules.symptom_suggester import get_suggester
        print("   💡 Loading symptom suggestion engine...")
        suggester = get_suggester()
        symptoms_count = len(suggester.cooccurrence_map)
        print(f"   ✅ Symptom Suggester: {symptoms_count} symptoms indexed")
    except Exception as e:
        msg = f"Suggester: {str(e)[:50]}"
        errors.append(msg)
        print(f"   ⚠️  {msg}")

    # ── Comparator ────────────────────────────────────────
    try:
        from modules.comparator import get_comparator
        get_comparator()
        print("   ✅ Comparator: ready")
    except Exception as e:
        msg = f"Comparator: {str(e)[:50]}"
        errors.append(msg)
        print(f"   ⚠️  {msg}")

    # ── Validator ─────────────────────────────────────────
    try:
        from modules.validator import get_validator
        get_validator()
        print("   ✅ Validator: ready")
    except Exception as e:
        msg = f"Validator: {str(e)[:50]}"
        errors.append(msg)
        print(f"   ⚠️  {msg}")

    # ── Retrainer ─────────────────────────────────────────
    try:
        from modules.retrainer import get_retrainer
        retrainer = get_retrainer()
        stats = retrainer.get_retraining_stats()
        print(f"   ✅ Retrainer: ready "
              f"| Retrained {stats.get('retrain_count', 0)} times "
              f"| Pending: {stats.get('pending_feedback', 0)}")
    except Exception as e:
        msg = f"Retrainer: {str(e)[:50]}"
        errors.append(msg)
        print(f"   ⚠️  {msg}")

    print("─" * 45)

    if errors:
        print(f"   ⚠️  {len(errors)} component(s) had issues")
        print("   System will run with available components")
    else:
        print("   ✅ All components loaded successfully!")

    return len(errors) == 0

    # ── Lab Suggester ─────────────────────────────────────
    try:
        from modules.lab_suggester import get_lab_suggester
        lab_suggester = get_lab_suggester()
        tests_count = len(lab_suggester.lab_tests_map)
        print(f"   ✅ Lab Suggester: {tests_count} diseases with test protocols")
    except Exception as e:
        msg = f"Lab Suggester: {str(e)[:50]}"
        errors.append(msg)
        print(f"   ⚠️  {msg}")


# ─────────────────────────────────────────────────────────
# MAIN ENTRY POINT
# ─────────────────────────────────────────────────────────

if __name__ == '__main__':

    # Pre-load all components
    all_loaded = preload_components()

    # Get config
    port = Config.FLASK_PORT
    debug = Config.FLASK_DEBUG

    # Print startup banner
    print_startup_banner(port)

    # Create and run app
    app = create_app()

    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
        use_reloader=False   # False because we pre-load components above
    )