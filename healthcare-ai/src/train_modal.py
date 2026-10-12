import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, MultiLabelBinarizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
import json
import os

class DiseasePredictor:
    def __init__(self):
        self.model = None
        self.symptom_encoder = None
        self.disease_encoder = None
        self.symptom_list = []
        self.disease_info = {}
        
    def prepare_data(self):
        """Load and prepare the dataset"""
        print("📚 Loading dataset...")
        
        # Load diseases
        diseases_df = pd.read_csv('data/diseases.csv')
        
        # Extract all unique symptoms
        all_symptoms = set()
        disease_symptoms = {}
        
        for idx, row in diseases_df.iterrows():
            disease = row['disease_name']
            symptoms = [s.strip() for s in row['symptoms'].split(',')]
            disease_symptoms[disease] = symptoms
            all_symptoms.update(symptoms)
            
            # Store disease info
            self.disease_info[disease] = {
                'specialization': row['specialization'],
                'severity': row['severity'],
                'description': row['description']
            }
        
        self.symptom_list = sorted(list(all_symptoms))
        print(f"✅ Found {len(self.symptom_list)} unique symptoms")
        print(f"✅ Found {len(disease_symptoms)} diseases")
        
        # Create training data
        X = []
        y = []
        
        # Generate samples for each disease
        for disease, symptoms in disease_symptoms.items():
            # Create multiple samples with different symptom combinations
            num_samples = 50  # Generate 50 samples per disease
            
            for _ in range(num_samples):
                # Randomly select 3-7 symptoms for this disease
                num_symptoms = np.random.randint(3, min(8, len(symptoms) + 1))
                selected_symptoms = np.random.choice(symptoms, num_symptoms, replace=False)
                
                # Create feature vector
                feature_vector = [1 if symptom in selected_symptoms else 0 
                                for symptom in self.symptom_list]
                
                X.append(feature_vector)
                y.append(disease)
        
        return np.array(X), np.array(y)
    
    def train(self):
        """Train the disease prediction model"""
        print("\n🎯 Training model...")
        
        # Prepare data
        X, y = self.prepare_data()
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        print(f"📊 Training samples: {len(X_train)}")
        print(f"📊 Testing samples: {len(X_test)}")
        
        # Train Random Forest model
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=20,
            min_samples_split=5,
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"\n✅ Model trained successfully!")
        print(f"🎯 Accuracy: {accuracy * 100:.2f}%")
        
        return accuracy
    
    def save_model(self):
        """Save the trained model and metadata"""
        print("\n💾 Saving model...")
        
        # Create models directory if it doesn't exist
        os.makedirs('models', exist_ok=True)
        
        # Save model
        joblib.dump(self.model, 'models/disease_predictor.pkl')
        
        # Save symptom list
        with open('models/symptoms.json', 'w') as f:
            json.dump(self.symptom_list, f, indent=2)
        
        # Save disease info
        with open('models/disease_info.json', 'w') as f:
            json.dump(self.disease_info, f, indent=2)
        
        print("✅ Model saved successfully!")
        print(f"📁 Model: models/disease_predictor.pkl")
        print(f"📁 Symptoms: models/symptoms.json")
        print(f"📁 Disease Info: models/disease_info.json")
    
    def load_model(self):
        """Load the trained model"""
        self.model = joblib.load('models/disease_predictor.pkl')
        
        with open('models/symptoms.json', 'r') as f:
            self.symptom_list = json.load(f)
        
        with open('models/disease_info.json', 'r') as f:
            self.disease_info = json.load(f)
    
    def predict(self, symptoms):
        """Predict disease from symptoms"""
        # Create feature vector
        feature_vector = [1 if symptom in symptoms else 0 
                         for symptom in self.symptom_list]
        
        # Get prediction probabilities
        probabilities = self.model.predict_proba([feature_vector])[0]
        classes = self.model.classes_
        
        # Get top 3 predictions
        top_indices = np.argsort(probabilities)[::-1][:3]
        
        predictions = []
        for idx in top_indices:
            disease = classes[idx]
            confidence = probabilities[idx]
            
            if confidence > 0.05:  # Only include if confidence > 5%
                predictions.append({
                    'disease': disease,
                    'confidence': float(confidence * 100),
                    'specialization': self.disease_info[disease]['specialization'],
                    'severity': self.disease_info[disease]['severity'],
                    'description': self.disease_info[disease]['description']
                })
        
        return predictions

if __name__ == "__main__":
    print("🚀 Starting Disease Prediction Model Training\n")
    print("=" * 60)
    
    # Initialize predictor
    predictor = DiseasePredictor()
    
    # Train model
    accuracy = predictor.train()
    
    # Save model
    predictor.save_model()
    
    print("\n" + "=" * 60)
    print("🎉 Training completed successfully!")
    print("=" * 60)
    
    # Test prediction
    print("\n🧪 Testing prediction...")
    predictor.load_model()
    
    test_symptoms = ['fever', 'cough', 'fatigue', 'headache']
    print(f"\nTest Symptoms: {test_symptoms}")
    
    predictions = predictor.predict(test_symptoms)
    print("\n📋 Predictions:")
    for i, pred in enumerate(predictions, 1):
        print(f"\n{i}. {pred['disease']}")
        print(f"   Confidence: {pred['confidence']:.2f}%")
        print(f"   Specialization: {pred['specialization']}")
        print(f"   Severity: {pred['severity']}")