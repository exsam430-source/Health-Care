"""
Trains Multiple ML Models and selects the best one
Uses the cleaned dataset from preprocessing
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import SGDClassifier, LogisticRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import (
    accuracy_score, classification_report,
    confusion_matrix
)

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config


def load_cleaned_data():
    """Load preprocessed dataset"""
    clean_path = os.path.join(Config.PROCESSED_DATA_DIR, 'cleaned_dataset.csv')
    
    if not os.path.exists(clean_path):
        print("❌ Cleaned dataset not found. Run preprocess.py first!")
        sys.exit(1)
    
    df = pd.read_csv(clean_path)
    print(f"✅ Loaded dataset: {df.shape}")
    return df


def prepare_features(df):
    """Prepare X and y for training"""
    symptom_cols = [col for col in df.columns if col != 'prognosis']
    
    X = df[symptom_cols].values
    y = df['prognosis'].values
    
    # Encode labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    print(f"✅ Features: {X.shape}")
    print(f"✅ Classes: {len(label_encoder.classes_)}")
    
    return X, y_encoded, symptom_cols, label_encoder


def train_and_evaluate_models(X_train, X_test, y_train, y_test):
    """Train multiple models and compare"""
    
    print("\n" + "=" * 60)
    print("   Training Multiple Models")
    print("=" * 60)

    models = {
        'Random Forest': RandomForestClassifier(
            n_estimators=200,
            max_depth=None,
            min_samples_split=2,
            min_samples_leaf=1,
            random_state=42,
            n_jobs=-1
        ),
        'Gradient Boosting': GradientBoostingClassifier(
            n_estimators=150,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        ),
        'Logistic Regression': LogisticRegression(
            max_iter=1000,
            random_state=42,
            solver='lbfgs'
        ),
        'SGD Classifier': SGDClassifier(
            loss='modified_huber',
            max_iter=1000,
            random_state=42,
            n_jobs=-1
        ),
        'SVM': SVC(
            kernel='rbf',
            probability=True,
            random_state=42
        ),
    }
    
    results = {}
    
    for name, model in models.items():
        print(f"\n🔄 Training {name}...")
        
        # Train
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        # Cross-validation
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring='accuracy')
        
        results[name] = {
            'model': model,
            'test_accuracy': accuracy,
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std()
        }
        
        print(f"   Test Accuracy:  {accuracy * 100:.2f}%")
        print(f"   CV Accuracy:    {cv_scores.mean() * 100:.2f}% ± {cv_scores.std() * 100:.2f}%")
    
    return results


def select_best_model(results):
    """Select the best performing model"""
    print("\n" + "=" * 60)
    print("   Model Comparison")
    print("=" * 60)
    
    print(f"\n{'Model':<25} {'Test Acc':>10} {'CV Mean':>10} {'CV Std':>10}")
    print("-" * 60)
    
    best_name = None
    best_score = 0
    
    for name, result in results.items():
        test_acc = result['test_accuracy'] * 100
        cv_mean = result['cv_mean'] * 100
        cv_std = result['cv_std'] * 100
        
        print(f"{name:<25} {test_acc:>9.2f}% {cv_mean:>9.2f}% {cv_std:>9.2f}%")
        
        # Select based on CV mean (more reliable)
        if result['cv_mean'] > best_score:
            best_score = result['cv_mean']
            best_name = name
    
    print(f"\n🏆 Best Model: {best_name} (CV: {best_score * 100:.2f}%)")
    return best_name, results[best_name]['model']


def save_models(model, label_encoder, symptom_cols, best_name, accuracy):
    """Save all model artifacts"""
    print("\n💾 Saving model artifacts...")
    
    os.makedirs(Config.MODELS_DIR, exist_ok=True)
    
    # Save model
    joblib.dump(model, Config.MODEL_PATH)
    print(f"   ✅ Model saved: {Config.MODEL_PATH}")
    
    # Save encoder
    joblib.dump(label_encoder, Config.ENCODER_PATH)
    print(f"   ✅ Encoder saved: {Config.ENCODER_PATH}")
    
    # Save feature columns
    joblib.dump(symptom_cols, Config.FEATURES_PATH)
    print(f"   ✅ Features saved: {Config.FEATURES_PATH}")
    
    # Save metadata
    metadata = {
        "model_type": best_name,
        "accuracy": round(accuracy * 100, 2),
        "n_features": len(symptom_cols),
        "n_classes": len(label_encoder.classes_),
        "classes": list(label_encoder.classes_),
        "feature_names": symptom_cols,
        "trained_at": datetime.now().isoformat(),
        "supports_partial_fit": hasattr(model, 'partial_fit'),
        "version": "1.0.0"
    }
    
    with open(Config.METADATA_PATH, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"   ✅ Metadata saved: {Config.METADATA_PATH}")
    
    return metadata


def print_classification_report(model, X_test, y_test, label_encoder):
    """Print detailed classification report"""
    y_pred = model.predict(X_test)
    
    print("\n" + "=" * 60)
    print("   Detailed Classification Report")
    print("=" * 60)
    
    report = classification_report(
        y_test, y_pred,
        target_names=label_encoder.classes_,
        zero_division=0
    )
    print(report)


def main():
    Config.create_directories()
    
    print("=" * 60)
    print("   AI Doctor Assistant — Model Training")
    print("=" * 60)
    
    # Load data
    df = load_cleaned_data()
    
    # Prepare features
    X, y, symptom_cols, label_encoder = prepare_features(df)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )
    
    print(f"\n📊 Data Split:")
    print(f"   Training: {len(X_train)} samples")
    print(f"   Testing:  {len(X_test)} samples")
    
    # Train models
    results = train_and_evaluate_models(X_train, X_test, y_train, y_test)
    
    # Select best
    best_name, best_model = select_best_model(results)
    
    # Save models
    accuracy = results[best_name]['test_accuracy']
    metadata = save_models(best_model, label_encoder, symptom_cols, best_name, accuracy)
    
    # Print report
    print_classification_report(best_model, X_test, y_test, label_encoder)
    
    print("\n" + "=" * 60)
    print(f"✅ Training Complete!")
    print(f"   Best Model:  {best_name}")
    print(f"   Accuracy:    {accuracy * 100:.2f}%")
    print(f"   Diseases:    {metadata['n_classes']}")
    print(f"   Symptoms:    {metadata['n_features']}")
    print("=" * 60)
    
    return best_model, label_encoder, symptom_cols


if __name__ == '__main__':
    main()