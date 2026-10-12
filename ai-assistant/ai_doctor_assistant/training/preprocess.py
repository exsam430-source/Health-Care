"""
Cleans and prepares the raw dataset for training
"""

import os
import sys
import json
import pandas as pd
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config


def clean_symptom_name(symptom: str) -> str:
    """Standardize symptom names"""
    if not isinstance(symptom, str):
        return ''
    return (symptom.strip()
                   .lower()
                   .replace(' ', '_')
                   .replace('-', '_')
                   .replace('(', '')
                   .replace(')', ''))


def load_and_clean_dataset():
    """Load raw dataset and clean it"""
    print("\n📊 Loading raw dataset...")
    
    dataset_path = os.path.join(Config.RAW_DATA_DIR, 'dataset.csv')
    df = pd.read_csv(dataset_path)
    
    print(f"   Raw shape: {df.shape}")
    print(f"   Columns: {list(df.columns[:5])}...")

    # ── Detect format ─────────────────────────────────────
    # Format A: Binary columns (1 column per symptom)
    # Format B: Text columns (Symptom_1, Symptom_2, etc.)
    
    if 'prognosis' in df.columns:
        disease_col = 'prognosis'
    elif 'Disease' in df.columns:
        disease_col = 'Disease'
    else:
        disease_col = df.columns[-1]
    
    print(f"   Disease column: {disease_col}")

    # Check if it's text-based format
    text_format = any('Symptom' in col for col in df.columns)
    
    if text_format:
        print("   Format: Text-based (converting to binary...)")
        df = convert_text_to_binary(df, disease_col)
    else:
        print("   Format: Binary columns")
        # Clean column names
        df.columns = [
            clean_symptom_name(col) if col != disease_col else 'prognosis'
            for col in df.columns
        ]
        df = df.rename(columns={disease_col: 'prognosis'})

    # ── Clean disease names ───────────────────────────────
    df['prognosis'] = df['prognosis'].str.strip()
    
    # ── Remove duplicates and nulls ───────────────────────
    df = df.dropna(subset=['prognosis'])
    df = df.drop_duplicates()
    
    # ── Get symptom columns ───────────────────────────────
    symptom_cols = [col for col in df.columns if col != 'prognosis']
    
    # Convert all symptom values to binary
    for col in symptom_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        df[col] = (df[col] > 0).astype(int)
    
    print(f"   Clean shape: {df.shape}")
    print(f"   Diseases: {df['prognosis'].nunique()}")
    print(f"   Symptoms: {len(symptom_cols)}")
    
    return df, symptom_cols


def convert_text_to_binary(df, disease_col):
    """Convert text-format dataset to binary format"""
    
    # Get all unique symptoms
    symptom_cols = [col for col in df.columns if 'Symptom' in col]
    all_symptoms = set()
    
    for col in symptom_cols:
        symptoms = df[col].dropna().apply(clean_symptom_name)
        all_symptoms.update(symptoms[symptoms != ''])
    
    all_symptoms = sorted(list(all_symptoms))
    print(f"   Found {len(all_symptoms)} unique symptoms")
    
    # Build binary matrix
    rows = []
    for _, row in df.iterrows():
        binary_row = {sym: 0 for sym in all_symptoms}
        binary_row['prognosis'] = row[disease_col]
        
        for col in symptom_cols:
            if pd.notna(row[col]):
                sym = clean_symptom_name(str(row[col]))
                if sym in binary_row:
                    binary_row[sym] = 1
        
        rows.append(binary_row)
    
    return pd.DataFrame(rows)


def build_disease_symptom_map(df, symptom_cols):
    """Build disease → symptoms frequency map"""
    print("\n🗺️  Building disease-symptom map...")
    
    disease_map = {}
    
    for disease in df['prognosis'].unique():
        disease_df = df[df['prognosis'] == disease]
        total = len(disease_df)
        
        symptoms_info = []
        for sym in symptom_cols:
            count = disease_df[sym].sum()
            if count > 0:
                pct = round((count / total) * 100, 1)
                symptoms_info.append({
                    "symptom": sym,
                    "frequency_percent": pct,
                    "count": int(count)
                })
        
        # Sort by frequency
        symptoms_info.sort(key=lambda x: x["frequency_percent"], reverse=True)
        disease_map[disease] = symptoms_info
    
    # Save
    map_path = Config.SYMPTOM_MAP_PATH
    with open(map_path, 'w') as f:
        json.dump(disease_map, f, indent=2)
    
    print(f"   ✅ Disease-symptom map saved ({len(disease_map)} diseases)")
    return disease_map


def build_symptom_lists(df, symptom_cols):
    """Save symptom and disease lists"""
    print("\n📋 Building symptom and disease lists...")
    
    # Symptom list with stats
    symptom_stats = []
    for sym in symptom_cols:
        freq = int(df[sym].sum())
        if freq > 0:
            symptom_stats.append({
                "key": sym,
                "display": sym.replace('_', ' ').title(),
                "frequency": freq
            })
    
    symptom_stats.sort(key=lambda x: x["frequency"], reverse=True)
    
    with open(Config.SYMPTOM_LIST_PATH, 'w') as f:
        json.dump(symptom_stats, f, indent=2)
    
    # Disease list
    disease_counts = df['prognosis'].value_counts().to_dict()
    disease_list = [
        {"name": d, "sample_count": int(c)}
        for d, c in disease_counts.items()
    ]
    
    with open(Config.DISEASE_LIST_PATH, 'w') as f:
        json.dump(disease_list, f, indent=2)
    
    print(f"   ✅ Symptom list: {len(symptom_stats)} symptoms")
    print(f"   ✅ Disease list: {len(disease_list)} diseases")


def save_cleaned_dataset(df):
    """Save cleaned dataset"""
    clean_path = os.path.join(Config.PROCESSED_DATA_DIR, 'cleaned_dataset.csv')
    df.to_csv(clean_path, index=False)
    print(f"\n💾 Cleaned dataset saved: {clean_path}")
    return clean_path


def main():
    Config.create_directories()
    
    print("=" * 60)
    print("   Data Preprocessing Pipeline")
    print("=" * 60)
    
    # Load and clean
    df, symptom_cols = load_and_clean_dataset()
    
    # Build maps
    build_disease_symptom_map(df, symptom_cols)
    build_symptom_lists(df, symptom_cols)
    
    # Save cleaned data
    save_cleaned_dataset(df)
    
    print("\n" + "=" * 60)
    print("✅ Preprocessing complete!")
    print(f"   Total records: {len(df)}")
    print(f"   Total symptoms: {len(symptom_cols)}")
    print(f"   Total diseases: {df['prognosis'].nunique()}")
    
    # Print disease list
    print("\n📋 Diseases in dataset:")
    for i, disease in enumerate(sorted(df['prognosis'].unique()), 1):
        count = len(df[df['prognosis'] == disease])
        print(f"   {i:2d}. {disease} ({count} samples)")
    
    return df, symptom_cols


if __name__ == '__main__':
    main()