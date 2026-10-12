"""
Downloads REAL Kaggle datasets
Run this to get medically validated data
"""

import os
import sys
import json
import zipfile
import requests
import pandas as pd

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config


def download_from_kaggle_api():
    """
    Method 1: Use Kaggle API (Best method)
    Requires: kaggle account + API token
    """

    print("📥 Method 1: Kaggle API")
    print("─" * 40)
    print("Steps to get real dataset:")
    print("1. Go to: https://www.kaggle.com")
    print("2. Create free account")
    print("3. Go to: Account → API → Create New Token")
    print("4. Download kaggle.json file")
    print("5. Place it at: C:/Users/YourName/.kaggle/kaggle.json")
    print("6. Run: kaggle datasets download itachi9604/disease-symptom-description-dataset")
    print()

    # Try automatic download
    try:
        import kaggle
        print("🔄 Attempting automatic download...")

        kaggle.api.authenticate()

        dataset_id = "itachi9604/disease-symptom-description-dataset"
        download_path = Config.RAW_DATA_DIR

        kaggle.api.dataset_download_files(
            dataset_id,
            path=download_path,
            unzip=True
        )

        print("✅ Real dataset downloaded successfully!")
        return True

    except Exception as e:
        print(f"⚠️  Kaggle API not configured: {e}")
        print("→ Using backup method...")
        return False


def download_from_github():
    """
    Method 2: Download from GitHub mirrors
    These are the exact Kaggle dataset files
    hosted publicly on GitHub
    """

    print("\n📥 Method 2: GitHub Mirror Download")
    print("─" * 40)

    files = {
        # Main training dataset
        "Training.csv": (
            "https://raw.githubusercontent.com/"
            "Anuradha9/ML-Disease-Prediction-Using-Symptoms/main/"
            "dataset/Training.csv"
        ),
        # Testing dataset
        "Testing.csv": (
            "https://raw.githubusercontent.com/"
            "Anuradha9/ML-Disease-Prediction-Using-Symptoms/main/"
            "dataset/Testing.csv"
        ),
        # Disease descriptions
        "symptom_Description.csv": (
            "https://raw.githubusercontent.com/"
            "Anuradha9/ML-Disease-Prediction-Using-Symptoms/main/"
            "MasterData/symptom_Description.csv"
        ),
        # Symptom severity weights
        "Symptom-severity.csv": (
            "https://raw.githubusercontent.com/"
            "Anuradha9/ML-Disease-Prediction-Using-Symptoms/main/"
            "MasterData/Symptom-severity.csv"
        ),
        # Precautions
        "symptom_precaution.csv": (
            "https://raw.githubusercontent.com/"
            "Anuradha9/ML-Disease-Prediction-Using-Symptoms/main/"
            "MasterData/symptom_precaution.csv"
        )
    }

    os.makedirs(Config.RAW_DATA_DIR, exist_ok=True)
    downloaded = 0

    for filename, url in files.items():
        filepath = os.path.join(Config.RAW_DATA_DIR, filename)
        print(f"   Downloading {filename}...")
        try:
            response = requests.get(url, timeout=30)
            if response.status_code == 200:
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                size = os.path.getsize(filepath)

                # Validate file is not empty
                if size > 1000:
                    print(f"   ✅ {filename} ({size:,} bytes)")
                    downloaded += 1
                else:
                    print(f"   ⚠️  {filename} too small — removing")
                    os.remove(filepath)
            else:
                print(f"   ❌ {filename}: HTTP {response.status_code}")

        except Exception as e:
            print(f"   ❌ {filename}: {e}")

    return downloaded > 0


def validate_downloaded_data():
    """
    Validate the downloaded dataset is real and usable
    """
    print("\n🔍 Validating downloaded data...")

    # Check for training file
    possible_names = [
        "Training.csv", "dataset.csv",
        "training.csv", "train.csv"
    ]

    training_file = None
    for name in possible_names:
        path = os.path.join(Config.RAW_DATA_DIR, name)
        if os.path.exists(path) and os.path.getsize(path) > 10000:
            training_file = path
            break

    if not training_file:
        print("❌ No valid training file found")
        return False, None

    # Load and validate
    df = pd.read_csv(training_file)

    print(f"   File: {os.path.basename(training_file)}")
    print(f"   Rows: {len(df):,}")
    print(f"   Columns: {len(df.columns)}")

    # Check disease column
    disease_col = None
    for col in ['prognosis', 'Disease', 'disease', 'label']:
        if col in df.columns:
            disease_col = col
            break

    if not disease_col:
        print("❌ No disease/prognosis column found")
        return False, None

    diseases = df[disease_col].unique()
    print(f"   Diseases: {len(diseases)}")
    print(f"   Samples per disease (avg): {len(df)//len(diseases)}")

    # Validate it's the real Kaggle dataset
    expected_diseases = [
        'Fungal infection', 'Allergy', 'GERD', 'Diabetes',
        'Malaria', 'Dengue', 'Typhoid', 'Common Cold', 'Pneumonia'
    ]

    found_count = sum(
        1 for d in expected_diseases
        if any(d.lower() in str(disease).lower() for disease in diseases)
    )

    is_valid = found_count >= 7
    print(f"   Validation: {found_count}/{len(expected_diseases)} expected diseases found")

    if is_valid:
        print("   ✅ VALID - This is the real Kaggle medical dataset!")
        print(f"   ✅ Ready for training")

        # Rename to standard name
        standard_path = os.path.join(Config.RAW_DATA_DIR, 'dataset.csv')
        if training_file != standard_path:
            df.to_csv(standard_path, index=False)
            print(f"   ✅ Saved as: dataset.csv")
    else:
        print("   ⚠️  Dataset might not be the expected one")

    return is_valid, df


def show_dataset_info(df):
    """Show detailed dataset statistics"""

    print("\n" + "=" * 55)
    print("   REAL DATASET INFORMATION")
    print("=" * 55)

    disease_col = 'prognosis' if 'prognosis' in df.columns else df.columns[-1]
    symptom_cols = [c for c in df.columns if c != disease_col]

    print(f"\n📊 Dataset Statistics:")
    print(f"   Total records:    {len(df):,}")
    print(f"   Total diseases:   {df[disease_col].nunique()}")
    print(f"   Total symptoms:   {len(symptom_cols)}")
    print(f"   Records/disease:  {len(df)//df[disease_col].nunique()}")

    print(f"\n📋 All Diseases in Dataset:")
    disease_counts = df[disease_col].value_counts()
    for i, (disease, count) in enumerate(disease_counts.items(), 1):
        print(f"   {i:2d}. {disease:<45} {count:3d} records")

    print(f"\n🩺 Sample Symptoms (first 15):")
    for i, sym in enumerate(symptom_cols[:15], 1):
        freq = df[sym].sum() if sym in df.columns else 0
        print(f"   {i:2d}. {sym:<40} ({freq} occurrences)")


def main():
    Config.create_directories()

    print("=" * 55)
    print("   DOWNLOADING REAL MEDICAL DATASET")
    print("=" * 55)

    # Try Kaggle API first
    success = download_from_kaggle_api()

    # If Kaggle fails, try GitHub
    if not success:
        success = download_from_github()

    if not success:
        print("\n❌ All download methods failed")
        print("\n📋 MANUAL DOWNLOAD INSTRUCTIONS:")
        print("─" * 40)
        print("1. Go to: https://www.kaggle.com/datasets/itachi9604/disease-symptom-description-dataset")
        print("2. Click 'Download' button")
        print("3. Extract the ZIP file")
        print("4. Copy 'Training.csv' to:")
        print(f"   {Config.RAW_DATA_DIR}\\dataset.csv")
        print("5. Run this script again")
        return False

    # Validate
    is_valid, df = validate_downloaded_data()

    if is_valid and df is not None:
        show_dataset_info(df)
        print("\n✅ Real dataset ready! Now run:")
        print("   python setup_and_train.py")

    return is_valid


if __name__ == '__main__':
    main()