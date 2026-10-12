"""
Downloads the Disease Symptom Dataset
Creates embedded dataset if download fails
"""

import os
import sys
import requests
import pandas as pd
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config


def create_complete_dataset():
    """
    Creates complete dataset with all 41 diseases and 132 symptoms
    Based on the real Kaggle Disease Symptom Prediction dataset
    """
    print("\n📝 Creating complete medical dataset...")

    # ── All 132 symptoms (exact from Kaggle dataset) ──────
    all_symptoms = [
        'itching', 'skin_rash', 'nodal_skin_eruptions',
        'continuous_sneezing', 'shivering', 'chills', 'joint_pain',
        'stomach_pain', 'acidity', 'ulcers_on_tongue', 'muscle_wasting',
        'vomiting', 'burning_micturition', 'spotting_urination', 'fatigue',
        'weight_gain', 'anxiety', 'cold_hands_and_feets', 'mood_swings',
        'weight_loss', 'restlessness', 'lethargy', 'patches_in_throat',
        'irregular_sugar_level', 'cough', 'high_fever', 'sunken_eyes',
        'breathlessness', 'sweating', 'dehydration', 'indigestion',
        'headache', 'yellowish_skin', 'dark_urine', 'nausea',
        'loss_of_appetite', 'pain_behind_the_eyes', 'back_pain',
        'constipation', 'abdominal_pain', 'diarrhoea', 'mild_fever',
        'yellow_urine', 'yellowing_of_eyes', 'acute_liver_failure',
        'fluid_overload', 'swelling_of_stomach', 'swelled_lymph_nodes',
        'malaise', 'blurred_and_distorted_vision', 'phlegm',
        'throat_irritation', 'redness_of_eyes', 'sinus_pressure',
        'runny_nose', 'congestion', 'chest_pain', 'weakness_in_limbs',
        'fast_heart_rate', 'pain_during_bowel_movements',
        'pain_in_anal_region', 'bloody_stool', 'irritation_in_anus',
        'neck_pain', 'dizziness', 'cramps', 'bruising', 'obesity',
        'swollen_legs', 'swollen_blood_vessels', 'puffy_face_and_eyes',
        'enlarged_thyroid', 'brittle_nails', 'swollen_extremeties',
        'excessive_hunger', 'extra_marital_contacts',
        'drying_and_tingling_lips', 'slurred_speech', 'knee_pain',
        'hip_joint_pain', 'muscle_weakness', 'stiff_neck',
        'swelling_joints', 'movement_stiffness', 'spinning_movements',
        'loss_of_balance', 'unsteadiness', 'weakness_of_one_body_side',
        'loss_of_smell', 'bladder_discomfort', 'foul_smell_of_urine',
        'continuous_feel_of_urine', 'passage_of_gases', 'internal_itching',
        'toxic_look_(typhos)', 'depression', 'irritability', 'muscle_pain',
        'altered_sensorium', 'red_spots_over_body', 'belly_pain',
        'abnormal_menstruation', 'dischromic_patches', 'watering_from_eyes',
        'increased_appetite', 'polyuria', 'family_history', 'mucoid_sputum',
        'rusty_sputum', 'lack_of_concentration', 'visual_disturbances',
        'receiving_blood_transfusion', 'receiving_unsterile_injections',
        'coma', 'stomach_bleeding', 'distention_of_abdomen',
        'history_of_alcohol_consumption', 'blood_in_sputum',
        'prominent_veins_on_calf', 'palpitations', 'painful_walking',
        'pus_filled_pimples', 'blackheads', 'scurring', 'skin_peeling',
        'silver_like_dusting', 'small_dents_in_nails', 'inflammatory_nails',
        'blister', 'red_sore_around_nose', 'yellow_crust_ooze'
    ]

    # ── 41 diseases with their exact symptoms ─────────────
    disease_symptoms_map = {
        'Fungal infection': [
            'itching', 'skin_rash', 'nodal_skin_eruptions', 'dischromic_patches'
        ],
        'Allergy': [
            'continuous_sneezing', 'shivering', 'chills',
            'watering_from_eyes', 'runny_nose'
        ],
        'GERD': [
            'stomach_pain', 'acidity', 'ulcers_on_tongue',
            'vomiting', 'cough', 'chest_pain'
        ],
        'Chronic cholestasis': [
            'itching', 'vomiting', 'yellowish_skin', 'nausea',
            'loss_of_appetite', 'abdominal_pain', 'yellowing_of_eyes'
        ],
        'Drug Reaction': [
            'itching', 'skin_rash', 'stomach_pain',
            'vomiting', 'burning_micturition'
        ],
        'Peptic ulcer disease': [
            'vomiting', 'indigestion', 'loss_of_appetite',
            'abdominal_pain', 'passage_of_gases', 'internal_itching'
        ],
        'AIDS': [
            'muscle_wasting', 'patches_in_throat', 'high_fever',
            'extra_marital_contacts', 'fatigue', 'weight_loss'
        ],
        'Diabetes': [
            'fatigue', 'weight_loss', 'restlessness', 'lethargy',
            'irregular_sugar_level', 'blurred_and_distorted_vision',
            'obesity', 'excessive_hunger', 'increased_appetite', 'polyuria'
        ],
        'Gastroenteritis': [
            'vomiting', 'sunken_eyes', 'dehydration', 'diarrhoea'
        ],
        'Bronchial Asthma': [
            'fatigue', 'cough', 'high_fever', 'breathlessness',
            'family_history', 'mucoid_sputum'
        ],
        'Hypertension': [
            'headache', 'chest_pain', 'dizziness',
            'loss_of_balance', 'lack_of_concentration'
        ],
        'Migraine': [
            'acidity', 'indigestion', 'headache',
            'blurred_and_distorted_vision', 'excessive_hunger',
            'stiff_neck', 'depression', 'irritability', 'visual_disturbances'
        ],
        'Cervical spondylosis': [
            'back_pain', 'weakness_in_limbs', 'neck_pain',
            'dizziness', 'loss_of_balance'
        ],
        'Paralysis (brain hemorrhage)': [
            'vomiting', 'headache', 'weakness_of_one_body_side',
            'altered_sensorium'
        ],
        'Jaundice': [
            'itching', 'vomiting', 'fatigue', 'weight_loss',
            'high_fever', 'yellowish_skin', 'dark_urine', 'abdominal_pain'
        ],
        'Malaria': [
            'chills', 'vomiting', 'high_fever', 'sweating',
            'headache', 'nausea', 'diarrhoea', 'muscle_pain'
        ],
        'Chicken pox': [
            'itching', 'skin_rash', 'fatigue', 'lethargy', 'high_fever',
            'headache', 'loss_of_appetite', 'mild_fever',
            'swelled_lymph_nodes', 'malaise', 'red_spots_over_body'
        ],
        'Dengue': [
            'skin_rash', 'chills', 'joint_pain', 'vomiting', 'fatigue',
            'high_fever', 'headache', 'nausea', 'loss_of_appetite',
            'pain_behind_the_eyes', 'back_pain', 'malaise',
            'muscle_pain', 'red_spots_over_body'
        ],
        'Typhoid': [
            'chills', 'vomiting', 'fatigue', 'high_fever', 'headache',
            'nausea', 'constipation', 'abdominal_pain', 'diarrhoea',
            'toxic_look_(typhos)', 'belly_pain'
        ],
        'hepatitis A': [
            'joint_pain', 'vomiting', 'yellowish_skin', 'dark_urine',
            'nausea', 'loss_of_appetite', 'abdominal_pain', 'diarrhoea',
            'mild_fever', 'yellowing_of_eyes', 'muscle_pain'
        ],
        'Hepatitis B': [
            'itching', 'fatigue', 'lethargy', 'yellowish_skin',
            'dark_urine', 'loss_of_appetite', 'abdominal_pain',
            'yellow_urine', 'yellowing_of_eyes', 'malaise',
            'receiving_blood_transfusion', 'receiving_unsterile_injections'
        ],
        'Hepatitis C': [
            'fatigue', 'yellowish_skin', 'nausea', 'loss_of_appetite',
            'family_history', 'yellowing_of_eyes'
        ],
        'Hepatitis D': [
            'joint_pain', 'vomiting', 'fatigue', 'yellowish_skin',
            'dark_urine', 'nausea', 'loss_of_appetite',
            'abdominal_pain', 'yellowing_of_eyes'
        ],
        'Hepatitis E': [
            'joint_pain', 'vomiting', 'fatigue', 'high_fever',
            'yellowish_skin', 'dark_urine', 'nausea', 'loss_of_appetite',
            'abdominal_pain', 'yellowing_of_eyes', 'coma', 'stomach_bleeding'
        ],
        'Alcoholic hepatitis': [
            'vomiting', 'yellowish_skin', 'abdominal_pain',
            'swelling_of_stomach', 'history_of_alcohol_consumption',
            'fluid_overload', 'nausea'
        ],
        'Tuberculosis': [
            'chills', 'vomiting', 'fatigue', 'weight_loss', 'cough',
            'high_fever', 'breathlessness', 'sweating', 'loss_of_appetite',
            'mild_fever', 'swelled_lymph_nodes', 'malaise',
            'phlegm', 'blood_in_sputum', 'rusty_sputum'
        ],
        'Common Cold': [
            'continuous_sneezing', 'chills', 'fatigue', 'cough',
            'headache', 'swelled_lymph_nodes', 'malaise', 'phlegm',
            'throat_irritation', 'redness_of_eyes', 'sinus_pressure',
            'runny_nose', 'congestion', 'chest_pain',
            'loss_of_smell', 'muscle_pain'
        ],
        'Pneumonia': [
            'chills', 'fatigue', 'cough', 'high_fever', 'breathlessness',
            'sweating', 'malaise', 'phlegm', 'chest_pain',
            'fast_heart_rate', 'rusty_sputum'
        ],
        'Dimorphic hemmorhoids(piles)': [
            'constipation', 'pain_during_bowel_movements',
            'pain_in_anal_region', 'bloody_stool', 'irritation_in_anus'
        ],
        'Heart attack': [
            'vomiting', 'breathlessness', 'sweating',
            'chest_pain', 'fast_heart_rate'
        ],
        'Varicose veins': [
            'fatigue', 'cramps', 'bruising', 'obesity',
            'swollen_legs', 'swollen_blood_vessels', 'prominent_veins_on_calf'
        ],
        'Hypothyroidism': [
            'fatigue', 'weight_gain', 'cold_hands_and_feets', 'mood_swings',
            'lethargy', 'dizziness', 'puffy_face_and_eyes', 'enlarged_thyroid',
            'brittle_nails', 'swollen_extremeties', 'depression',
            'irritability', 'abnormal_menstruation'
        ],
        'Hyperthyroidism': [
            'fatigue', 'mood_swings', 'weight_loss', 'restlessness',
            'sweating', 'diarrhoea', 'fast_heart_rate',
            'excessive_hunger', 'muscle_weakness', 'irritability',
            'abnormal_menstruation'
        ],
        'Hypoglycemia': [
            'fatigue', 'anxiety', 'cold_hands_and_feets', 'sweating',
            'headache', 'nausea', 'blurred_and_distorted_vision',
            'excessive_hunger', 'slurred_speech', 'irritability', 'palpitations'
        ],
        'Osteoarthritis': [
            'joint_pain', 'neck_pain', 'knee_pain', 'hip_joint_pain',
            'swelling_joints', 'painful_walking'
        ],
        'Arthritis': [
            'muscle_weakness', 'stiff_neck', 'swelling_joints',
            'movement_stiffness', 'painful_walking', 'joint_pain'
        ],
        '(vertigo) Paroymsal Positional Vertigo': [
            'vomiting', 'headache', 'nausea', 'spinning_movements',
            'loss_of_balance', 'unsteadiness'
        ],
        'Acne': [
            'skin_rash', 'pus_filled_pimples', 'blackheads', 'scurring'
        ],
        'Urinary tract infection': [
            'burning_micturition', 'bladder_discomfort',
            'foul_smell_of_urine', 'continuous_feel_of_urine'
        ],
        'Psoriasis': [
            'skin_rash', 'joint_pain', 'skin_peeling',
            'silver_like_dusting', 'small_dents_in_nails',
            'inflammatory_nails'
        ],
        'Impetigo': [
            'skin_rash', 'high_fever', 'blister',
            'red_sore_around_nose', 'yellow_crust_ooze'
        ],
    }

    # ── Generate dataset rows ──────────────────────────────
    np.random.seed(42)
    rows = []
    samples_per_disease = 120  # 41 × 120 = 4920 rows

    print(f"   Generating {len(disease_symptoms_map)} diseases × "
          f"{samples_per_disease} samples...")

    for disease, core_symptoms in disease_symptoms_map.items():

        # Filter symptoms that exist in all_symptoms list
        valid_core = [s for s in core_symptoms if s in all_symptoms]

        for i in range(samples_per_disease):
            # Start with all zeros
            row = {sym: 0 for sym in all_symptoms}
            row['prognosis'] = disease

            # Always set core symptoms to 1
            for sym in valid_core:
                row[sym] = 1

            # Add small random variation
            # Randomly drop 0-1 non-critical core symptoms
            if len(valid_core) > 3 and np.random.random() < 0.1:
                drop = np.random.choice(valid_core[2:], size=1)[0]
                row[drop] = 0

            # Randomly add 0-1 extra symptom (noise)
            if np.random.random() < 0.15:
                non_core = [
                    s for s in all_symptoms
                    if s not in valid_core and s != 'prognosis'
                ]
                if non_core:
                    extra = np.random.choice(non_core, size=1)[0]
                    row[extra] = 1

            rows.append(row)

    # ── Build DataFrame ────────────────────────────────────
    df = pd.DataFrame(rows)

    # Make sure prognosis is last column
    cols = [c for c in df.columns if c != 'prognosis'] + ['prognosis']
    df = df[cols]

    # ── Verify not empty ───────────────────────────────────
    print(f"   DataFrame shape: {df.shape}")
    assert len(df) > 0, "Dataset is empty!"
    assert 'prognosis' in df.columns, "Missing prognosis column!"

    # ── Save dataset.csv ───────────────────────────────────
    os.makedirs(Config.RAW_DATA_DIR, exist_ok=True)
    dataset_path = os.path.join(Config.RAW_DATA_DIR, 'dataset.csv')
    df.to_csv(dataset_path, index=False)

    # ── Verify saved file ──────────────────────────────────
    saved_size = os.path.getsize(dataset_path)
    print(f"   File size: {saved_size:,} bytes")
    assert saved_size > 1000, "Saved file is too small!"

    print(f"   ✅ Dataset saved: {dataset_path}")
    print(f"   ✅ Rows: {len(df)}")
    print(f"   ✅ Symptoms: {len(all_symptoms)}")
    print(f"   ✅ Diseases: {df['prognosis'].nunique()}")

    # ── Create severity file ───────────────────────────────
    create_severity_file(all_symptoms)

    # ── Create description file ────────────────────────────
    create_description_file(disease_symptoms_map)

    return True


def create_severity_file(all_symptoms):
    """Create symptom severity weights file"""

    severity_weights = {
        'itching': 1, 'skin_rash': 3, 'nodal_skin_eruptions': 4,
        'continuous_sneezing': 4, 'shivering': 5, 'chills': 3,
        'joint_pain': 3, 'stomach_pain': 5, 'acidity': 3,
        'ulcers_on_tongue': 4, 'muscle_wasting': 3, 'vomiting': 5,
        'burning_micturition': 6, 'spotting_urination': 6, 'fatigue': 4,
        'weight_gain': 3, 'anxiety': 4, 'cold_hands_and_feets': 5,
        'mood_swings': 3, 'weight_loss': 3, 'restlessness': 5,
        'lethargy': 2, 'patches_in_throat': 6, 'irregular_sugar_level': 5,
        'cough': 4, 'high_fever': 7, 'sunken_eyes': 6,
        'breathlessness': 4, 'sweating': 3, 'dehydration': 4,
        'indigestion': 5, 'headache': 3, 'yellowish_skin': 3,
        'dark_urine': 4, 'nausea': 5, 'loss_of_appetite': 4,
        'pain_behind_the_eyes': 4, 'back_pain': 3, 'constipation': 4,
        'abdominal_pain': 5, 'diarrhoea': 6, 'mild_fever': 5,
        'yellow_urine': 4, 'yellowing_of_eyes': 4,
        'acute_liver_failure': 6, 'fluid_overload': 6,
        'swelling_of_stomach': 7, 'swelled_lymph_nodes': 6,
        'malaise': 6, 'blurred_and_distorted_vision': 5,
        'phlegm': 5, 'throat_irritation': 4, 'redness_of_eyes': 5,
        'sinus_pressure': 4, 'runny_nose': 5, 'congestion': 5,
        'chest_pain': 7, 'weakness_in_limbs': 7, 'fast_heart_rate': 5,
        'pain_during_bowel_movements': 5, 'pain_in_anal_region': 6,
        'bloody_stool': 5, 'irritation_in_anus': 6, 'neck_pain': 5,
        'dizziness': 4, 'cramps': 4, 'bruising': 4, 'obesity': 4,
        'swollen_legs': 5, 'swollen_blood_vessels': 5,
        'puffy_face_and_eyes': 4, 'enlarged_thyroid': 6,
        'brittle_nails': 5, 'swollen_extremeties': 5,
        'excessive_hunger': 4, 'extra_marital_contacts': 5,
        'drying_and_tingling_lips': 4, 'slurred_speech': 4,
        'knee_pain': 3, 'hip_joint_pain': 2, 'muscle_weakness': 3,
        'stiff_neck': 4, 'swelling_joints': 3, 'movement_stiffness': 3,
        'spinning_movements': 6, 'loss_of_balance': 4,
        'unsteadiness': 2, 'weakness_of_one_body_side': 4,
        'loss_of_smell': 3, 'bladder_discomfort': 4,
        'foul_smell_of_urine': 5, 'continuous_feel_of_urine': 6,
        'passage_of_gases': 5, 'internal_itching': 4,
        'toxic_look_(typhos)': 5, 'depression': 3, 'irritability': 2,
        'muscle_pain': 2, 'altered_sensorium': 2,
        'red_spots_over_body': 3, 'belly_pain': 4,
        'abnormal_menstruation': 6, 'dischromic_patches': 5,
        'watering_from_eyes': 4, 'increased_appetite': 5,
        'polyuria': 4, 'family_history': 5, 'mucoid_sputum': 4,
        'rusty_sputum': 4, 'lack_of_concentration': 3,
        'visual_disturbances': 3, 'receiving_blood_transfusion': 5,
        'receiving_unsterile_injections': 2, 'coma': 7,
        'stomach_bleeding': 6, 'distention_of_abdomen': 4,
        'history_of_alcohol_consumption': 5, 'blood_in_sputum': 5,
        'prominent_veins_on_calf': 6, 'palpitations': 4,
        'painful_walking': 2, 'pus_filled_pimples': 2,
        'blackheads': 2, 'scurring': 1, 'skin_peeling': 3,
        'silver_like_dusting': 2, 'small_dents_in_nails': 2,
        'inflammatory_nails': 2, 'blister': 4,
        'red_sore_around_nose': 3, 'yellow_crust_ooze': 3,
    }

    rows = []
    for sym in all_symptoms:
        rows.append({
            'Symptom': sym,
            'weight': severity_weights.get(sym, 3)
        })

    severity_df = pd.DataFrame(rows)
    severity_path = os.path.join(Config.RAW_DATA_DIR, 'symptom_severity.csv')
    severity_df.to_csv(severity_path, index=False)
    print(f"   ✅ Severity file saved ({len(rows)} symptoms)")


def create_description_file(disease_symptoms_map):
    """Create disease description file"""

    descriptions = {
        'Fungal infection': 'A fungal infection, or mycosis, is a skin disease caused by a fungus.',
        'Allergy': 'An allergy is an immune system response to a foreign substance not harmful to most people.',
        'GERD': 'Gastroesophageal reflux disease is a chronic digestive disease.',
        'Chronic cholestasis': 'Cholestasis is a condition where bile cannot flow from the liver to the duodenum.',
        'Drug Reaction': 'An adverse drug reaction is an injury caused by taking medication.',
        'Peptic ulcer disease': 'Peptic ulcers are open sores on the inner lining of the stomach.',
        'AIDS': 'AIDS is a chronic, potentially life-threatening condition caused by HIV.',
        'Diabetes': 'Diabetes is a disease that occurs when blood glucose is too high.',
        'Gastroenteritis': 'Gastroenteritis is an intestinal infection with diarrhea, cramps, nausea, vomiting, and fever.',
        'Bronchial Asthma': 'Asthma is a condition in which airways narrow and swell causing breathing difficulty.',
        'Hypertension': 'Hypertension is a long-term medical condition where blood pressure is persistently elevated.',
        'Migraine': 'A migraine is a headache that can cause severe throbbing pain or pulsing sensation.',
        'Cervical spondylosis': 'Cervical spondylosis is age-related wear affecting the spinal disks in your neck.',
        'Paralysis (brain hemorrhage)': 'Paralysis from brain hemorrhage where bleeding occurs inside the skull.',
        'Jaundice': 'Jaundice is a condition producing yellowing of skin and whites of the eyes.',
        'Malaria': 'Malaria is a mosquito-borne infectious disease affecting humans and other animals.',
        'Chicken pox': 'Chickenpox is a highly contagious viral infection causing an itchy, blister-like rash.',
        'Dengue': 'Dengue fever is a mosquito-borne tropical disease caused by the dengue virus.',
        'Typhoid': 'Typhoid fever is a bacterial infection due to Salmonella typhi.',
        'hepatitis A': 'Hepatitis A is a highly contagious liver infection caused by the hepatitis A virus.',
        'Hepatitis B': 'Hepatitis B is a serious liver infection caused by the hepatitis B virus.',
        'Hepatitis C': 'Hepatitis C is a viral infection that causes liver inflammation.',
        'Hepatitis D': 'Hepatitis D is a serious liver disease caused by infection with the hepatitis D virus.',
        'Hepatitis E': 'Hepatitis E is a liver disease caused by the hepatitis E virus.',
        'Alcoholic hepatitis': 'Alcoholic hepatitis is inflammation of the liver caused by drinking alcohol.',
        'Tuberculosis': 'Tuberculosis is a potentially serious infectious disease mainly affecting the lungs.',
        'Common Cold': 'The common cold is a viral infectious disease of the upper respiratory tract.',
        'Pneumonia': 'Pneumonia is an infection that inflames the air sacs in one or both lungs.',
        'Dimorphic hemmorhoids(piles)': 'Hemorrhoids are swollen veins in the lower rectum and anus.',
        'Heart attack': 'A heart attack occurs when blood flow to the heart is blocked.',
        'Varicose veins': 'Varicose veins are gnarled, enlarged veins close to the skin surface.',
        'Hypothyroidism': 'Hypothyroidism is a condition where the thyroid gland does not produce enough hormones.',
        'Hyperthyroidism': 'Hyperthyroidism occurs when the thyroid gland produces too much thyroid hormone.',
        'Hypoglycemia': 'Hypoglycemia is an abnormally low level of blood sugar.',
        'Osteoarthritis': 'Osteoarthritis is the most common form of arthritis affecting joint cartilage.',
        'Arthritis': 'Arthritis is inflammation of one or more joints causing pain and stiffness.',
        '(vertigo) Paroymsal Positional Vertigo': 'BPPV causes intense, brief dizziness episodes.',
        'Acne': 'Acne is a skin condition that occurs when hair follicles become clogged.',
        'Urinary tract infection': 'A UTI is an infection in any part of the urinary system.',
        'Psoriasis': 'Psoriasis is a skin disease that causes red, itchy scaly patches.',
        'Impetigo': 'Impetigo is a common and highly contagious skin infection.',
    }

    rows = []
    for disease in disease_symptoms_map.keys():
        rows.append({
            'Disease': disease,
            'Description': descriptions.get(disease, f'{disease} is a medical condition.')
        })

    desc_df = pd.DataFrame(rows)
    desc_path = os.path.join(Config.RAW_DATA_DIR, 'symptom_Description.csv')
    desc_df.to_csv(desc_path, index=False)
    print(f"   ✅ Description file saved ({len(rows)} diseases)")


def main():
    Config.create_directories()

    print("=" * 60)
    print("   AI Doctor Assistant — Dataset Setup")
    print("=" * 60)

    dataset_path = os.path.join(Config.RAW_DATA_DIR, 'dataset.csv')

    # ── Check if valid dataset already exists ─────────────
    if os.path.exists(dataset_path):
        file_size = os.path.getsize(dataset_path)
        if file_size > 10000:  # Must be at least 10KB
            try:
                df = pd.read_csv(dataset_path)
                if len(df) > 100 and 'prognosis' in df.columns:
                    print(f"\n✅ Valid dataset already exists!")
                    print(f"   Rows: {len(df)}")
                    print(f"   Columns: {len(df.columns)}")
                    print(f"   Diseases: {df['prognosis'].nunique()}")
                    return True
                else:
                    print(f"\n⚠️  Dataset exists but invalid. Recreating...")
                    os.remove(dataset_path)
            except Exception as e:
                print(f"\n⚠️  Dataset corrupted ({e}). Recreating...")
                os.remove(dataset_path)
        else:
            print(f"\n⚠️  Dataset too small ({file_size} bytes). Recreating...")
            os.remove(dataset_path)

    # ── Create the dataset ────────────────────────────────
    create_complete_dataset()

    # ── Final verification ────────────────────────────────
    print("\n🔍 Final verification...")
    df = pd.read_csv(dataset_path)
    assert len(df) > 100, "Dataset too small!"
    assert 'prognosis' in df.columns, "Missing prognosis!"

    print(f"\n✅ Dataset ready!")
    print(f"   Total rows:    {len(df)}")
    print(f"   Total columns: {len(df.columns)}")
    print(f"   Diseases:      {df['prognosis'].nunique()}")

    print("\n📋 Disease distribution:")
    disease_counts = df['prognosis'].value_counts()
    for disease, count in disease_counts.items():
        print(f"   {disease:<45} {count} samples")

    return True


if __name__ == '__main__':
    main()