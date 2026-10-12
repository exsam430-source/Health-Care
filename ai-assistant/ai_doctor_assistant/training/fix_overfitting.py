# training/fix_overfitting.py

"""
Solution 1: Use more data augmentation
Solution 2: Add noise to training data
Solution 3: Use proper train/val/test split
Solution 4: Use cross-validation properly
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedKFold

def augment_dataset(df, symptom_cols, augment_factor=5):
    """
    Create realistic variations of each sample
    Makes model more robust and less overfitted
    """
    augmented_rows = []
    np.random.seed(42)

    for _, row in df.iterrows():
        disease = row['prognosis']
        present_symptoms = [
            col for col in symptom_cols if row[col] == 1
        ]

        for _ in range(augment_factor):
            new_row = {col: 0 for col in symptom_cols}
            new_row['prognosis'] = disease

            # Keep 70-100% of original symptoms
            keep_ratio = np.random.uniform(0.7, 1.0)
            keep_count = max(2, int(len(present_symptoms) * keep_ratio))
            kept_symptoms = np.random.choice(
                present_symptoms,
                size=min(keep_count, len(present_symptoms)),
                replace=False
            )

            for sym in kept_symptoms:
                new_row[sym] = 1

            # Add 0-2 random noise symptoms
            noise_count = np.random.randint(0, 3)
            non_symptoms = [
                col for col in symptom_cols
                if col not in present_symptoms
            ]
            if noise_count > 0 and non_symptoms:
                noise_syms = np.random.choice(
                    non_symptoms,
                    size=min(noise_count, len(non_symptoms)),
                    replace=False
                )
                for sym in noise_syms:
                    new_row[sym] = 1

            augmented_rows.append(new_row)

    aug_df = pd.DataFrame(augmented_rows)
    combined = pd.concat([df, aug_df], ignore_index=True)
    combined = combined.sample(frac=1, random_state=42).reset_index(drop=True)

    print(f"✅ Dataset augmented: {len(df)} → {len(combined)} records")
    return combined


def evaluate_realistically(model, X, y, label_encoder):
    """
    Use proper evaluation metrics
    Not just accuracy
    """
    from sklearn.model_selection import StratifiedKFold, cross_validate
    from sklearn.metrics import make_scorer, f1_score

    cv = StratifiedKFold(n_splits=10, shuffle=True, random_state=42)

    scoring = {
        'accuracy': 'accuracy',
        'f1_macro': make_scorer(f1_score, average='macro'),
        'f1_weighted': make_scorer(f1_score, average='weighted')
    }

    results = cross_validate(
        model, X, y, cv=cv, scoring=scoring
    )

    print("\n📊 REALISTIC Model Evaluation:")
    print(f"   Accuracy:    {results['test_accuracy'].mean()*100:.1f}% ± {results['test_accuracy'].std()*100:.1f}%")
    print(f"   F1 (macro):  {results['test_f1_macro'].mean()*100:.1f}%")
    print(f"   F1 (weighted): {results['test_f1_weighted'].mean()*100:.1f}%")
    print("\n   (These are REALISTIC scores, not overfitted ones)")

    return results