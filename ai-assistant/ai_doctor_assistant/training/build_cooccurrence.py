"""
Builds symptom co-occurrence matrix from training data
This powers the smart symptom suggestion feature
"""

import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from collections import defaultdict

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config


def build_cooccurrence_matrix(df, symptom_cols):
    """
    Build symptom co-occurrence probability matrix
    P(symptom_B | symptom_A) for all pairs
    """
    print("\n🔗 Building co-occurrence matrix...")
    
    total_symptoms = len(symptom_cols)
    total_rows = len(df)
    
    # Count co-occurrences
    cooccurrence_counts = defaultdict(lambda: defaultdict(int))
    symptom_counts = defaultdict(int)
    
    for _, row in df.iterrows():
        # Get present symptoms
        present = [sym for sym in symptom_cols if row.get(sym, 0) == 1]
        
        # Count individual
        for sym in present:
            symptom_counts[sym] += 1
        
        # Count pairs
        for sym1 in present:
            for sym2 in present:
                if sym1 != sym2:
                    cooccurrence_counts[sym1][sym2] += 1
    
    print(f"   Processed {total_rows} records")
    print(f"   Found {len(symptom_counts)} active symptoms")
    
    # Convert to probabilities
    cooccurrence_probabilities = {}
    
    for sym1, co_syms in cooccurrence_counts.items():
        sym1_total = symptom_counts[sym1]
        if sym1_total == 0:
            continue
        
        suggestions = []
        for sym2, count in co_syms.items():
            probability = count / sym1_total
            suggestions.append({
                "symptom": sym2,
                "probability": round(probability, 4),
                "percentage": round(probability * 100, 2),
                "count": count
            })
        
        # Sort by probability
        suggestions.sort(key=lambda x: x["probability"], reverse=True)
        cooccurrence_probabilities[sym1] = suggestions[:20]  # Top 20 per symptom
    
    # Save as pickle (fast loading)
    joblib.dump(cooccurrence_probabilities, Config.COOCCURRENCE_PATH)
    
    # Save as JSON (readable)
    with open(Config.COOCCURRENCE_JSON_PATH, 'w') as f:
        json.dump(cooccurrence_probabilities, f, indent=2)
    
    print(f"   ✅ Co-occurrence matrix: {len(cooccurrence_probabilities)} symptoms indexed")
    
    return cooccurrence_probabilities


def build_disease_symptom_strength(df, symptom_cols):
    """
    For each disease, calculate symptom importance/strength
    Used to weight suggestions by likely disease
    """
    print("\n💪 Building disease-symptom strength map...")
    
    strength_map = {}
    
    for disease in df['prognosis'].unique():
        disease_df = df[df['prognosis'] == disease]
        total = len(disease_df)
        
        symptom_strengths = {}
        for sym in symptom_cols:
            count = disease_df[sym].sum()
            if count > 0:
                strength = count / total
                symptom_strengths[sym] = round(strength, 4)
        
        strength_map[disease] = symptom_strengths
    
    # Save
    strength_path = os.path.join(Config.PROCESSED_DATA_DIR, 'disease_symptom_strength.json')
    with open(strength_path, 'w') as f:
        json.dump(strength_map, f, indent=2)
    
    print(f"   ✅ Strength map: {len(strength_map)} diseases")
    return strength_map


def analyze_symptom_statistics(df, symptom_cols):
    """Print interesting statistics about symptoms"""
    print("\n📊 Symptom Statistics:")
    
    symptom_freq = {}
    for sym in symptom_cols:
        freq = df[sym].sum()
        if freq > 0:
            symptom_freq[sym] = int(freq)
    
    sorted_syms = sorted(symptom_freq.items(), key=lambda x: x[1], reverse=True)
    
    print(f"\n   Top 15 Most Common Symptoms:")
    for sym, freq in sorted_syms[:15]:
        bar = "█" * int((freq / sorted_syms[0][1]) * 20)
        print(f"   {sym:<40} {bar} ({freq})")


def main():
    Config.create_directories()
    
    print("=" * 60)
    print("   Building Symptom Co-occurrence Matrix")
    print("=" * 60)
    
    # Load cleaned dataset
    clean_path = os.path.join(Config.PROCESSED_DATA_DIR, 'cleaned_dataset.csv')
    if not os.path.exists(clean_path):
        print("❌ Run preprocess.py first!")
        sys.exit(1)
    
    df = pd.read_csv(clean_path)
    symptom_cols = [col for col in df.columns if col != 'prognosis']
    
    print(f"✅ Loaded: {df.shape}")
    
    # Build matrices
    cooccurrence = build_cooccurrence_matrix(df, symptom_cols)
    strength_map = build_disease_symptom_strength(df, symptom_cols)
    
    # Statistics
    analyze_symptom_statistics(df, symptom_cols)
    
    print("\n" + "=" * 60)
    print("✅ Co-occurrence build complete!")
    print(f"   Symptoms indexed: {len(cooccurrence)}")
    print("=" * 60)
    
    # Show example
    print("\n📋 Example — Suggestions for 'high_fever':")
    if 'high_fever' in cooccurrence:
        for item in cooccurrence['high_fever'][:8]:
            print(f"   → {item['symptom']:<35} {item['percentage']:>6.1f}%")


if __name__ == '__main__':
    main()