import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # ── Flask ────────────────────────────────────────────
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev_secret_key')
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5002))
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'True') == 'True'

    # ── MongoDB ──────────────────────────────────────────
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'ai_doctor_assistant')

    # ── Paths ────────────────────────────────────────────
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(BASE_DIR, 'data')
    RAW_DATA_DIR = os.path.join(DATA_DIR, 'raw')
    PROCESSED_DATA_DIR = os.path.join(DATA_DIR, 'processed')
    MODELS_DIR = os.path.join(BASE_DIR, 'models')
    DATA_FILES_DIR = os.path.join(BASE_DIR, 'data_files')

    # ── Model Files ──────────────────────────────────────
    MODEL_PATH = os.path.join(MODELS_DIR, 'disease_model.pkl')
    ENCODER_PATH = os.path.join(MODELS_DIR, 'label_encoder.pkl')
    FEATURES_PATH = os.path.join(MODELS_DIR, 'feature_columns.pkl')
    COOCCURRENCE_PATH = os.path.join(MODELS_DIR, 'symptom_cooccurrence.pkl')
    METADATA_PATH = os.path.join(MODELS_DIR, 'model_metadata.json')

    # ── Data Files ───────────────────────────────────────
    SYMPTOM_MAP_PATH = os.path.join(PROCESSED_DATA_DIR, 'symptom_disease_map.json')
    COOCCURRENCE_JSON_PATH = os.path.join(PROCESSED_DATA_DIR, 'symptom_cooccurrence.json')
    SYMPTOM_LIST_PATH = os.path.join(PROCESSED_DATA_DIR, 'symptom_list.json')
    DISEASE_LIST_PATH = os.path.join(PROCESSED_DATA_DIR, 'disease_list.json')
    RECOMMENDATIONS_PATH = os.path.join(DATA_FILES_DIR, 'disease_recommendations.json')
    DISPLAY_NAMES_PATH = os.path.join(DATA_FILES_DIR, 'symptom_display_names.json')
    QUESTIONS_PATH = os.path.join(DATA_FILES_DIR, 'symptom_questions.json')
    SPECIALIZATIONS_PATH = os.path.join(DATA_FILES_DIR, 'disease_specializations.json')

    # ── AI Settings ──────────────────────────────────────
    MIN_CONFIDENCE = float(os.getenv('MIN_CONFIDENCE_THRESHOLD', 30.0))
    MAX_SUGGESTIONS = int(os.getenv('MAX_SUGGESTIONS_PER_ROUND', 6))
    MAX_ROUNDS = int(os.getenv('MAX_SUGGESTION_ROUNDS', 2))

    @staticmethod
    def create_directories():
        """Create all required directories"""
        dirs = [
            Config.RAW_DATA_DIR,
            Config.PROCESSED_DATA_DIR,
            Config.MODELS_DIR,
            Config.DATA_FILES_DIR,
            os.path.join(Config.BASE_DIR, 'tests'),
        ]
        for d in dirs:
            os.makedirs(d, exist_ok=True)
        print("All directories created successfully")