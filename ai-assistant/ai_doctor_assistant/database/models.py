"""
Database document schemas and helper functions
Defines structure for all collections
"""

from datetime import datetime


# ─────────────────────────────────────────────────────────
# COLLECTION SCHEMAS
# ─────────────────────────────────────────────────────────

def new_prediction_record(
    patient_id,
    appointment_id,
    symptoms,
    predicted_disease,
    confidence,
    top_predictions,
    recommended_tests,
    suggested_medicines,
    specialist,
    severity,
    notes
):
    """Schema for ai_predictions collection"""
    return {
        "patient_id": str(patient_id),
        "appointment_id": str(appointment_id),
        "symptoms": symptoms,
        "predicted_disease": predicted_disease,
        "confidence": confidence,
        "top_predictions": top_predictions,
        "recommended_tests": recommended_tests,
        "suggested_medicines": suggested_medicines,
        "specialist": specialist,
        "severity": severity,
        "notes": notes,
        "created_at": datetime.now()
    }


def new_comparison_record(
    patient_id,
    appointment_id,
    symptoms,
    ai_prediction,
    ai_confidence,
    doctor_diagnosis,
    doctor_notes
):
    """Schema for comparisons collection"""

    match = ai_prediction.strip().lower() == doctor_diagnosis.strip().lower()

    return {
        "patient_id": str(patient_id),
        "appointment_id": str(appointment_id),
        "symptoms": symptoms,
        "ai_prediction": ai_prediction,
        "ai_confidence": ai_confidence,
        "doctor_diagnosis": doctor_diagnosis,
        "doctor_notes": doctor_notes,
        "match_status": "MATCH" if match else "MISMATCH",
        "lab_validated": False,
        "lab_confirmed_disease": None,
        "ai_correct": None,
        "doctor_correct": None,
        "retrain_triggered": False,
        "created_at": datetime.now(),
        "validated_at": None
    }


def new_symptom_session(
    patient_id,
    appointment_id,
    original_symptoms,
    ai_suggested_confirmed,
    ai_suggested_denied,
    all_confirmed_symptoms,
    final_prediction,
    final_confidence
):
    """Schema for symptom_sessions collection"""

    total_suggested = len(ai_suggested_confirmed) + len(ai_suggested_denied)
    acceptance_rate = (
        round(len(ai_suggested_confirmed) / total_suggested * 100, 1)
        if total_suggested > 0 else 0
    )

    return {
        "patient_id": str(patient_id),
        "appointment_id": str(appointment_id),
        "original_symptoms": original_symptoms,
        "ai_suggested_confirmed": ai_suggested_confirmed,
        "ai_suggested_denied": ai_suggested_denied,
        "all_confirmed_symptoms": all_confirmed_symptoms,
        "final_prediction": final_prediction,
        "final_confidence": final_confidence,
        "suggestion_acceptance_rate": acceptance_rate,
        "created_at": datetime.now()
    }


def new_training_feedback(symptoms, correct_disease, source):
    """Schema for training_feedback collection"""
    return {
        "symptoms": symptoms,
        "correct_disease": correct_disease,
        "source": source,
        "used_in_training": False,
        "created_at": datetime.now()
    }


def new_performance_record():
    """Initial schema for ai_performance collection"""
    return {
        "total_predictions": 0,
        "correct_predictions": 0,
        "wrong_predictions": 0,
        "accuracy_percentage": 0.0,
        "total_comparisons": 0,
        "match_count": 0,
        "mismatch_count": 0,
        "last_retrain_date": None,
        "retraining_count": 0,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

# ─────────────────────────────────────────────────────────
# ADD THIS TO BOTTOM OF database/models.py
# ─────────────────────────────────────────────────────────

from datetime import datetime


def new_patient_profile(
    patient_id,
    name,
    age,
    gender,
    blood_group=None,
    weight_kg=None,
    height_cm=None,
    chronic_conditions=None,
    current_medications=None,
    allergies=None,
    past_surgeries=None,
    family_history=None
):
    """
    Schema for patient_profiles collection
    Call this function to create a new patient profile document
    """
    return {
        # ── Identity ───────────────────────────────────────
        "patient_id": str(patient_id),

        # ── Personal Information ───────────────────────────
        "personal_info": {
            "name": str(name),
            "age": int(age) if age else None,
            "gender": str(gender) if gender else None,
            "blood_group": str(blood_group) if blood_group else None,
            "weight_kg": float(weight_kg) if weight_kg else None,
            "height_cm": float(height_cm) if height_cm else None,
            "bmi": round(
                float(weight_kg) / ((float(height_cm) / 100) ** 2), 1
            ) if weight_kg and height_cm else None
        },

        # ── Medical History ────────────────────────────────
        "medical_history": {
            "chronic_conditions": chronic_conditions or [],
            "current_medications": current_medications or [],
            "allergies": allergies or [],
            "past_surgeries": past_surgeries or [],
            "family_history": family_history or []
        },

        # ── AI Risk Factors ────────────────────────────────
        # Computed automatically based on medical history
        "ai_risk_factors": compute_risk_factors(
            age=age,
            chronic_conditions=chronic_conditions or [],
            family_history=family_history or [],
            bmi=round(
                float(weight_kg) / ((float(height_cm) / 100) ** 2), 1
            ) if weight_kg and height_cm else None
        ),

        # ── Stats ──────────────────────────────────────────
        "consultation_count": 0,
        "last_consultation": None,

        # ── Timestamps ─────────────────────────────────────
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }


def compute_risk_factors(
    age=None,
    chronic_conditions=None,
    family_history=None,
    bmi=None
):
    """
    Auto-compute AI risk factors based on patient data
    Called when creating or updating patient profile
    """
    chronic_conditions = chronic_conditions or []
    family_history = family_history or []

    risks = {}

    # ── Diabetes Risk ──────────────────────────────────────
    diabetes_score = 0
    if age and age > 45:
        diabetes_score += 2
    if bmi and bmi > 30:
        diabetes_score += 2
    if any("diabetes" in c.lower() for c in chronic_conditions):
        diabetes_score += 3
    if any("diabetes" in f.lower() for f in family_history):
        diabetes_score += 2
    risks["diabetes_risk"] = (
        "HIGH" if diabetes_score >= 5 else
        "MODERATE" if diabetes_score >= 3 else
        "LOW"
    )

    # ── Cardiac Risk ───────────────────────────────────────
    cardiac_score = 0
    if age and age > 50:
        cardiac_score += 2
    if bmi and bmi > 30:
        cardiac_score += 1
    if any("hypertension" in c.lower() for c in chronic_conditions):
        cardiac_score += 2
    if any("heart" in f.lower() for f in family_history):
        cardiac_score += 2
    if any("diabetes" in c.lower() for c in chronic_conditions):
        cardiac_score += 1
    risks["cardiac_risk"] = (
        "HIGH" if cardiac_score >= 5 else
        "MODERATE" if cardiac_score >= 3 else
        "LOW"
    )

    # ── Hypertension Risk ──────────────────────────────────
    htn_score = 0
    if age and age > 40:
        htn_score += 1
    if bmi and bmi > 28:
        htn_score += 1
    if any("hypertension" in f.lower() for f in family_history):
        htn_score += 2
    if any("kidney" in c.lower() for c in chronic_conditions):
        htn_score += 2
    risks["hypertension_risk"] = (
        "HIGH" if htn_score >= 4 else
        "MODERATE" if htn_score >= 2 else
        "LOW"
    )

    # ── Obesity Status ─────────────────────────────────────
    if bmi:
        risks["bmi_category"] = (
            "Obese" if bmi >= 30 else
            "Overweight" if bmi >= 25 else
            "Normal" if bmi >= 18.5 else
            "Underweight"
        )
    else:
        risks["bmi_category"] = "Unknown"

    risks["computed_at"] = str(datetime.now().date())

    return risks


def update_patient_profile_fields(updates: dict):
    """
    Build MongoDB update dict for partial profile updates
    Only updates fields that are provided
    """
    set_fields = {"updated_at": datetime.now()}

    # Map of allowed update fields
    allowed_personal = [
        "name", "age", "gender", "blood_group",
        "weight_kg", "height_cm"
    ]
    allowed_history = [
        "chronic_conditions", "current_medications",
        "allergies", "past_surgeries", "family_history"
    ]

    for field in allowed_personal:
        if field in updates:
            set_fields[f"personal_info.{field}"] = updates[field]

    for field in allowed_history:
        if field in updates:
            set_fields[f"medical_history.{field}"] = updates[field]

    # Recompute BMI if weight or height updated
    if "weight_kg" in updates or "height_cm" in updates:
        w = updates.get("weight_kg")
        h = updates.get("height_cm")
        if w and h:
            bmi = round(float(w) / ((float(h) / 100) ** 2), 1)
            set_fields["personal_info.bmi"] = bmi

    return {"$set": set_fields}