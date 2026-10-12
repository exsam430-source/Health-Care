from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json
import numpy as np
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS
CORS(app, resources={
    r"/api/*": {
        "origins": app.config['CORS_ORIGINS'],
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type"]
    }
})

# Load model and data
print("🔄 Loading AI model...")
model = joblib.load(app.config['MODEL_PATH'])

with open(app.config['SYMPTOMS_PATH'], 'r') as f:
    symptom_list = json.load(f)

with open(app.config['DISEASE_INFO_PATH'], 'r') as f:
    disease_info = json.load(f)

print("✅ AI model loaded successfully!")
print(f"📊 Symptoms in database: {len(symptom_list)}")
print(f"📊 Diseases in database: {len(disease_info)}")

@app.route('/')
def home():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'Healthcare AI API is running',
        'version': '1.0.0',
        'endpoints': {
            'symptoms': '/api/symptoms',
            'predict': '/api/predict'
        }
    })

@app.route('/api/symptoms', methods=['GET'])
def get_symptoms():
    """Get all available symptoms"""
    try:
        # Group symptoms by category (you can enhance this)
        symptoms_formatted = [
            {
                'value': symptom,
                'label': symptom.replace('_', ' ').title()
            }
            for symptom in symptom_list
        ]
        
        return jsonify({
            'success': True,
            'count': len(symptoms_formatted),
            'data': symptoms_formatted
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/predict', methods=['POST'])
def predict_disease():
    """Predict disease from symptoms"""
    try:
        data = request.get_json()
        
        if not data or 'symptoms' not in data:
            return jsonify({
                'success': False,
                'message': 'Symptoms are required'
            }), 400
        
        symptoms = data['symptoms']
        
        if not isinstance(symptoms, list) or len(symptoms) == 0:
            return jsonify({
                'success': False,
                'message': 'Please provide at least one symptom'
            }), 400
        
        # Validate symptoms
        invalid_symptoms = [s for s in symptoms if s not in symptom_list]
        if invalid_symptoms:
            return jsonify({
                'success': False,
                'message': f'Invalid symptoms: {", ".join(invalid_symptoms)}'
            }), 400
        
        # Create feature vector
        feature_vector = [1 if symptom in symptoms else 0 
                         for symptom in symptom_list]
        
        # Get prediction probabilities
        probabilities = model.predict_proba([feature_vector])[0]
        classes = model.classes_
        
        # Get top 5 predictions
        top_indices = np.argsort(probabilities)[::-1][:5]
        
        predictions = []
        for idx in top_indices:
            disease = classes[idx]
            confidence = probabilities[idx]
            
            if confidence > 0.05:  # Only include if confidence > 5%
                predictions.append({
                    'disease': disease,
                    'confidence': round(float(confidence * 100), 2),
                    'specialization': disease_info[disease]['specialization'],
                    'severity': disease_info[disease]['severity'],
                    'description': disease_info[disease]['description']
                })
        
        if not predictions:
            return jsonify({
                'success': False,
                'message': 'Unable to predict disease with given symptoms. Please consult a doctor.'
            }), 200
        
        # Get suggested specialization from top prediction
        suggested_specialization = predictions[0]['specialization']
        
        return jsonify({
            'success': True,
            'data': {
                'predictions': predictions,
                'suggestedSpecialization': suggested_specialization,
                'symptomsAnalyzed': len(symptoms),
                'disclaimer': 'This is an AI prediction and not a medical diagnosis. Please consult a qualified doctor.'
            }
        })
        
    except Exception as e:
        print(f"Error in prediction: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'error': str(e)
        }), 500

@app.route('/api/disease/<disease_name>', methods=['GET'])
def get_disease_info(disease_name):
    """Get information about a specific disease"""
    try:
        # Replace spaces and dashes with underscores
        disease_key = disease_name.replace('-', ' ').title()
        
        if disease_key not in disease_info:
            return jsonify({
                'success': False,
                'message': 'Disease not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': {
                'disease': disease_key,
                **disease_info[disease_key]
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500

if __name__ == '__main__':
    print(f"\n🚀 Starting Flask AI API Server...")
    print(f"🌐 Running on http://{app.config['HOST']}:{app.config['PORT']}")
    print(f"📍 Environment: {'Development' if app.config['DEBUG'] else 'Production'}")
    print(f"🔗 CORS enabled for: {app.config['CORS_ORIGINS']}\n")
    
    app.run(
        host=app.config['HOST'],
        port=app.config['PORT'],
        debug=app.config['DEBUG']
    )