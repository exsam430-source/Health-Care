"""
Complete API Test Suite
Tests all endpoints of the AI Doctor Assistant
Run: python tests/test_api.py
"""

import sys
import os
import json
import time

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import requests
except ImportError:
    print("requests not installed. Run: pip install requests")
    sys.exit(1)

BASE_URL = "http://localhost:5001/api/ai"


def print_header(title):
    print(f"\n{'═' * 60}")
    print(f"  {title}")
    print(f"{'═' * 60}")


def print_result(endpoint, method, status, response_data, passed):
    status_icon = "✅" if passed else "❌"
    print(f"\n  {status_icon} {method} {endpoint}")
    print(f"     Status: {status}")
    if isinstance(response_data, dict):
        if 'data' in response_data:
            data = response_data['data']
            if isinstance(data, dict):
                for key in list(data.keys())[:4]:
                    val = data[key]
                    if isinstance(val, list):
                        val = f"[{len(val)} items]"
                    elif isinstance(val, str) and len(str(val)) > 50:
                        val = str(val)[:47] + "..."
                    print(f"     {key}: {val}")
        elif 'error' in response_data:
            print(f"     Error: {response_data['error']}")


def test_health():
    print_header("TEST 1: Health Check")
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=10)
        data = r.json()
        passed = r.status_code == 200 and data.get('status') in ['healthy', 'degraded']
        print_result("/health", "GET", r.status_code, data, passed)
        print(f"\n     Components:")
        for comp, info in data.get('components', {}).items():
            status = info.get('status', 'unknown')
            icon = "✅" if status == 'ok' else "⚠️"
            print(f"     {icon} {comp}: {status}")
        return passed
    except Exception as e:
        print(f"  ❌ Health check failed: {e}")
        return False


def test_model_info():
    print_header("TEST 2: Model Info")
    try:
        r = requests.get(f"{BASE_URL}/info", timeout=10)
        data = r.json()
        passed = r.status_code == 200 and data.get('success')
        print_result("/info", "GET", r.status_code, data, passed)
        if passed:
            info = data.get('data', {}).get('model_info', {})
            print(f"\n     Model Type:  {info.get('model_type')}")
            print(f"     Accuracy:    {info.get('accuracy')}%")
            print(f"     Diseases:    {info.get('n_diseases')}")
            print(f"     Symptoms:    {info.get('n_symptoms')}")
        return passed
    except Exception as e:
        print(f"  ❌ Model info failed: {e}")
        return False


def test_get_symptoms():
    print_header("TEST 3: Get All Symptoms")
    try:
        r = requests.get(f"{BASE_URL}/symptoms", timeout=10)
        data = r.json()
        passed = r.status_code == 200 and data.get('success')
        print_result("/symptoms", "GET", r.status_code, data, passed)
        if passed:
            syms = data.get('data', {}).get('symptoms', [])
            print(f"\n     Total symptoms: {len(syms)}")
            print(f"     Sample: {', '.join([s['display'] for s in syms[:5]])}")

        # Test search
        r2 = requests.get(f"{BASE_URL}/symptoms?search=fever", timeout=10)
        data2 = r2.json()
        syms2 = data2.get('data', {}).get('symptoms', [])
        print(f"\n     Search 'fever': {len(syms2)} results")
        return passed
    except Exception as e:
        print(f"  ❌ Get symptoms failed: {e}")
        return False


def test_prediction():
    print_header("TEST 4: Disease Prediction")

    test_cases = [
        {
            "name": "Malaria",
            "payload": {
                "symptoms": [
                    "high_fever", "chills", "sweating",
                    "headache", "muscle_pain", "nausea"
                ],
                "patient_id": "TEST_P001",
                "appointment_id": "TEST_A001"
            },
            "expected": "malaria"
        },
        {
            "name": "Diabetes",
            "payload": {
                "symptoms": [
                    "fatigue", "weight_loss", "polyuria",
                    "excessive_hunger", "blurred_and_distorted_vision"
                ],
                "patient_id": "TEST_P002",
                "appointment_id": "TEST_A002"
            },
            "expected": "diabetes"
        },
        {
            "name": "Pneumonia",
            "payload": {
                "symptoms": [
                    "high_fever", "cough", "chest_pain",
                    "breathlessness", "phlegm", "fatigue", "chills"
                ],
                "patient_id": "TEST_P003",
                "appointment_id": "TEST_A003"
            },
            "expected": "pneumonia"
        }
    ]

    all_passed = True
    for test in test_cases:
        try:
            r = requests.post(
                f"{BASE_URL}/predict",
                json=test["payload"],
                timeout=15
            )
            data = r.json()
            prediction = ""
            if data.get('success') and data.get('data'):
                prediction = data['data'].get('predicted_disease', '')
            confidence = data.get('data', {}).get('confidence', 0)
            passed = (
                r.status_code == 200 and
                data.get('success') and
                test["expected"] in prediction.lower()
            )
            if not passed:
                all_passed = False
            icon = "✅" if passed else "❌"
            print(f"\n  {icon} {test['name']}")
            print(f"     Predicted: {prediction} ({confidence}%)")
            print(f"     Expected:  Contains '{test['expected']}'")
            if data.get('data'):
                d = data['data']
                print(f"     Specialist: {d.get('specialist', 'N/A')}")
                print(f"     Tests: {', '.join(d.get('recommended_tests', [])[:2])}")
        except Exception as e:
            print(f"  ❌ {test['name']} failed: {e}")
            all_passed = False

    return all_passed


def test_symptom_suggestions():
    print_header("TEST 5: Symptom Suggestions")
    try:
        payload = {
            "current_symptoms": ["high_fever", "headache"],
            "confirmed_symptoms": [],
            "denied_symptoms": [],
            "max_suggestions": 6
        }

        r = requests.post(
            f"{BASE_URL}/suggest-symptoms",
            json=payload,
            timeout=15
        )
        data = r.json()
        passed = r.status_code == 200 and data.get('success')

        print_result(
            "/suggest-symptoms", "POST",
            r.status_code, data, passed
        )

        if passed and data.get('data'):
            d = data['data']
            suggestions = d.get('suggestions', [])
            early_pred = d.get('early_prediction')

            print(f"\n     Suggestions ({len(suggestions)}):")
            for s in suggestions[:4]:
                print(
                    f"     [{s['relevance_level']:<6}] "
                    f"{s['symptom_name']:<30} "
                    f"Score: {s['relevance_score']}"
                )

            if early_pred:
                print(
                    f"\n     Early Prediction: "
                    f"{early_pred['disease']} "
                    f"({early_pred['confidence']}%)"
                )

        return passed
    except Exception as e:
        print(f"  ❌ Symptom suggestions failed: {e}")
        return False


def test_update_suggestions():
    print_header("TEST 6: Update Suggestions After Response")
    try:
        payload = {
            "current_symptoms": ["high_fever", "headache"],
            "confirmed_symptoms": ["chills", "sweating"],
            "denied_symptoms": ["vomiting"],
            "max_suggestions": 4
        }

        r = requests.post(
            f"{BASE_URL}/update-suggestions",
            json=payload,
            timeout=15
        )
        data = r.json()
        passed = r.status_code == 200 and data.get('success')
        print_result(
            "/update-suggestions", "POST",
            r.status_code, data, passed
        )

        if passed and data.get('data'):
            suggestions = data['data'].get('suggestions', [])
            early_pred = data['data'].get('early_prediction')
            print(f"\n     New suggestions: {len(suggestions)}")
            for s in suggestions[:3]:
                print(f"     → {s['symptom_name']}")
            if early_pred:
                print(
                    f"     Updated prediction: "
                    f"{early_pred['disease']} "
                    f"({early_pred['confidence']}%)"
                )

        return passed
    except Exception as e:
        print(f"  ❌ Update suggestions failed: {e}")
        return False


def test_finalize_symptoms():
    print_header("TEST 7: Finalize Symptoms")
    try:
        payload = {
            "patient_id": "TEST_P001",
            "appointment_id": "TEST_A001",
            "original_symptoms": ["high_fever", "headache"],
            "confirmed_additional": ["chills", "sweating", "muscle_pain"],
            "denied_symptoms": ["vomiting", "skin_rash"]
        }

        r = requests.post(
            f"{BASE_URL}/finalize-symptoms",
            json=payload,
            timeout=15
        )
        data = r.json()
        passed = r.status_code == 200 and data.get('success')
        print_result(
            "/finalize-symptoms", "POST",
            r.status_code, data, passed
        )

        if passed and data.get('data'):
            d = data['data']
            summary = d.get('symptom_summary', {})
            fp = d.get('final_prediction', {})
            print(f"\n     Total confirmed: {summary.get('total_confirmed')}")
            print(f"     AI suggested & confirmed: {summary.get('ai_suggested_confirmed')}")
            print(f"     Acceptance rate: {summary.get('suggestion_acceptance_rate')}%")
            print(f"     Final disease: {fp.get('predicted_disease')}")
            print(f"     Confidence: {fp.get('confidence')}%")

        return passed
    except Exception as e:
        print(f"  ❌ Finalize symptoms failed: {e}")
        return False


def test_compare():
    print_header("TEST 8: AI vs Doctor Comparison")
    try:
        payload = {
            "patient_id": "TEST_P001",
            "appointment_id": "TEST_A001",
            "symptoms": [
                "high_fever", "chills", "sweating",
                "headache", "muscle_pain"
            ],
            "doctor_diagnosis": "Malaria",
            "doctor_notes": "Patient traveled to tropical region"
        }

        r = requests.post(
            f"{BASE_URL}/compare",
            json=payload,
            timeout=15
        )
        data = r.json()
        passed = r.status_code == 200 and data.get('success')
        print_result("/compare", "POST", r.status_code, data, passed)

        if passed and data.get('data'):
            d = data['data']
            print(f"\n     AI Prediction:    {d.get('ai_prediction')}")
            print(f"     Doctor Diagnosis: {d.get('doctor_diagnosis')}")
            print(f"     Match Status:     {d.get('match_status')}")
            print(f"     Message: {d.get('message')}")

        return passed
    except Exception as e:
        print(f"  ❌ Compare failed: {e}")
        return False


def test_validate():
    print_header("TEST 9: Lab Result Validation")
    try:
        payload = {
            "patient_id": "TEST_P001",
            "appointment_id": "TEST_A001",
            "lab_confirmed_disease": "Malaria"
        }

        r = requests.post(
            f"{BASE_URL}/validate",
            json=payload,
            timeout=15
        )
        data = r.json()
        passed = r.status_code == 200 and data.get('success')
        print_result("/validate", "POST", r.status_code, data, passed)

        if passed and data.get('data'):
            d = data['data']
            print(f"\n     AI Correct:     {d.get('ai_correct')}")
            print(f"     Doctor Correct: {d.get('doctor_correct')}")
            print(f"     Lab Confirmed:  {d.get('lab_confirmed_disease')}")
            print(f"     Retrained:      {d.get('retrain_triggered')}")
            print(f"     Message: {d.get('result_message')}")

        return passed
    except Exception as e:
        print(f"  ❌ Validate failed: {e}")
        return False


def test_performance():
    print_header("TEST 10: Performance Statistics")
    try:
        r = requests.get(f"{BASE_URL}/performance", timeout=10)
        data = r.json()
        passed = r.status_code == 200 and data.get('success')
        print_result("/performance", "GET", r.status_code, data, passed)

        if passed and data.get('data'):
            d = data['data']
            print(f"\n     Total Predictions: {d.get('total_predictions')}")
            print(f"     Correct:           {d.get('correct_predictions')}")
            print(f"     Wrong:             {d.get('wrong_predictions')}")
            print(f"     Accuracy:          {d.get('accuracy_percentage')}%")
            print(f"     Total Comparisons: {d.get('total_comparisons')}")
            print(f"     AI-Doctor Match:   {d.get('doctor_ai_agreement_rate')}%")

        return passed
    except Exception as e:
        print(f"  ❌ Performance failed: {e}")
        return False


def main():
    print("\n" + "=" * 60)
    print("   🧪 AI Doctor Assistant — API Test Suite")
    print("=" * 60)
    print(f"\n   Testing: {BASE_URL}")
    print("   Make sure server is running: python app.py\n")

    # Check server is running
    try:
        r = requests.get("http://localhost:5001/", timeout=5)
        print("   ✅ Server is running")
    except Exception:
        print("   ❌ Server not running!")
        print("   Start it with: python app.py")
        sys.exit(1)

    # Run all tests
    tests = [
        ("Health Check",           test_health),
        ("Model Info",             test_model_info),
        ("Get Symptoms",           test_get_symptoms),
        ("Disease Prediction",     test_prediction),
        ("Symptom Suggestions",    test_symptom_suggestions),
        ("Update Suggestions",     test_update_suggestions),
        ("Finalize Symptoms",      test_finalize_symptoms),
        ("AI vs Doctor Compare",   test_compare),
        ("Lab Validation",         test_validate),
        ("Performance Stats",      test_performance),
    ]

    results = []
    for name, test_func in tests:
        try:
            passed = test_func()
            results.append((name, passed))
            time.sleep(0.3)
        except Exception as e:
            print(f"\n  ❌ {name} crashed: {e}")
            results.append((name, False))

    # Final summary
    print("\n\n" + "=" * 60)
    print("   📊 TEST RESULTS SUMMARY")
    print("=" * 60)

    passed_count = 0
    for name, passed in results:
        icon = "✅" if passed else "❌"
        print(f"   {icon} {name}")
        if passed:
            passed_count += 1

    total = len(results)
    print(f"\n   Result: {passed_count}/{total} tests passed")
    print(
        f"   Status: {'🎉 ALL PASSED!' if passed_count == total else '⚠️  Some tests failed'}"
    )
    print("=" * 60 + "\n")


if __name__ == '__main__':
    main()