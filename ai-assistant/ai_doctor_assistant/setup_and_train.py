"""
Master setup script — Run this to set up everything
1. Creates directories
2. Downloads dataset
3. Preprocesses data
4. Trains model
5. Builds co-occurrence matrix
6. Verifies everything works
"""

import os
import sys
import time

def print_banner():
    print("\n" + "=" * 60)
    print("   AI Doctor Assistant - Complete Setup")
    print("=" * 60 + "\n")

def run_step(step_num, title, func):
    print(f"\n{'-' * 60}")
    print(f"  STEP {step_num}: {title}")
    print(f"{'-' * 60}")
    start = time.time()
    result = func()
    elapsed = time.time() - start
    print(f"\n  Completed in {elapsed:.1f}s")
    return result

def verify_setup():
    """Verify all required files exist"""
    from config import Config
    
    print("\n🔍 Verifying setup...")
    
    required_files = {
        "Model": Config.MODEL_PATH,
        "Label Encoder": Config.ENCODER_PATH,
        "Feature Columns": Config.FEATURES_PATH,
        "Co-occurrence Matrix": Config.COOCCURRENCE_PATH,
        "Model Metadata": Config.METADATA_PATH,
        "Symptom-Disease Map": Config.SYMPTOM_MAP_PATH,
        "Symptom List": Config.SYMPTOM_LIST_PATH,
        "Disease List": Config.DISEASE_LIST_PATH,
    }
    
    all_good = True
    for name, path in required_files.items():
        exists = os.path.exists(path)
        status = "✅" if exists else "❌"
        print(f"   {status} {name}: {os.path.basename(path)}")
        if not exists:
            all_good = False
    
    return all_good

def quick_test():
    """Quick test to verify model works"""
    print("\n🧪 Quick Model Test...")

    import sys
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

    from modules.predictor import Predictor

    predictor = Predictor()

    test_cases = [
        {
            "symptoms": [
                "high_fever", "chills", "sweating",
                "headache", "muscle_pain"
            ],
            "expected_hint": "Malaria"
        },
        {
            "symptoms": [
                "fatigue", "weight_loss", "polyuria",
                "excessive_hunger"
            ],
            "expected_hint": "Diabetes"
        },
        {
            "symptoms": [
                "continuous_sneezing", "runny_nose",
                "cough", "headache"
            ],
            "expected_hint": "Cold"
        }
    ]

    print(
        f"\n{'Symptoms':<45} "
        f"{'Prediction':<35} "
        f"{'Confidence':>10} "
        f"{'Status':>8}"
    )
    print("─" * 102)

    all_passed = True
    for test in test_cases:
        result = predictor.predict(test["symptoms"])
        syms = ", ".join(test["symptoms"][:3]) + "..."
        prediction = result.get("predicted_disease", "ERROR")
        confidence = result.get("confidence", 0)
        hint = test["expected_hint"]
        status = "✅" if hint.lower() in prediction.lower() else "🔄"
        if "🔄" in status:
            all_passed = False

        print(
            f"{syms:<45} "
            f"{prediction:<35} "
            f"{confidence:>9.1f}%  "
            f"{status:>8}"
        )

    print("─" * 102)
    print(f"\n{'✅ All tests passed!' if all_passed else '🔄 Check predictions above'}")
    print("\n✅ AI Doctor Assistant is ready!")

def main():
    print_banner()
    
    # ── Step 1: Directories ───────────────────────────────
    def setup_dirs():
        from config import Config
        Config.create_directories()
        return True
    
    run_step(1, "Creating Directories", setup_dirs)
    
    # ── Step 2: Download Data ─────────────────────────────
    def download():
        from training.download_data import main as download_main
        return download_main()
    
    run_step(2, "Setting Up Dataset", download)
    
    # ── Step 3: Preprocess ────────────────────────────────
    def preprocess():
        from training.preprocess import main as preprocess_main
        return preprocess_main()
    
    run_step(3, "Preprocessing Data", preprocess)
    
    # ── Step 4: Train Model ───────────────────────────────
    def train():
        from training.train_model import main as train_main
        return train_main()
    
    run_step(4, "Training ML Models", train)
    
    # ── Step 5: Build Co-occurrence ───────────────────────
    def build_cooccurrence():
        from training.build_cooccurrence import main as cooccurrence_main
        return cooccurrence_main()
    
    run_step(5, "Building Symptom Suggestion Matrix", build_cooccurrence)
    
    # ── Step 6: Create Data Files ─────────────────────────
    def create_data_files():
        from training.create_data_files import main as data_files_main
        return data_files_main()
    
    run_step(6, "Creating Data Files", create_data_files)
    
    # ── Step 7: Verify ────────────────────────────────────
    all_good = verify_setup()
    
    # ── Step 8: Quick Test ────────────────────────────────
    if all_good:
        quick_test()
    
    print("\n" + "=" * 60)
    if all_good:
        print("🎉 SETUP COMPLETE! AI Doctor Assistant is ready.")
        print("\n   To start the AI service:")
        print("   → python app.py")
        print("\n   API will be available at:")
        print("   → http://localhost:5001")
    else:
        print("⚠️  Setup incomplete. Check errors above.")
    print("=" * 60 + "\n")


if __name__ == '__main__':
    main()