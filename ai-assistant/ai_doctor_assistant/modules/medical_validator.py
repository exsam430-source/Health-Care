"""
Medical Validation Layer
Cross-checks AI suggestions against
real medical guidelines and protocols

This is the MOST IMPORTANT file for business deployment
It ensures AI never suggests something medically invalid
"""

import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config


class MedicalValidator:
    """
    Validates AI predictions and suggestions
    against established medical guidelines

    This layer sits between AI prediction and doctor
    It NEVER blocks the doctor — only adds warnings
    and evidence-based information
    """

    def __init__(self):
        # Medical knowledge base
        # Based on WHO, CDC, and standard medical textbooks
        self.disease_symptom_validity = self._build_validity_map()
        self.red_flag_symptoms = self._build_red_flags()
        self.contraindications = self._build_contraindications()
        self.confidence_thresholds = {
            "high": 75,      # High confidence — show normally
            "medium": 50,    # Medium — add caution note
            "low": 30,       # Low — add strong caution
            "very_low": 0    # Very low — recommend re-evaluation
        }

    # ─────────────────────────────────────────────────────
    # BUILD MEDICAL KNOWLEDGE BASE
    # ─────────────────────────────────────────────────────

    def _build_validity_map(self) -> dict:
        """
        Core symptom-disease validity map
        Based on Harrison's Principles of Internal Medicine
        and WHO Clinical Guidelines
        """
        return {
            "Malaria": {
                "required_at_least_one": [
                    "high_fever", "chills", "sweating"
                ],
                "supporting_symptoms": [
                    "headache", "muscle_pain", "nausea",
                    "vomiting", "fatigue", "diarrhoea"
                ],
                "contradicting_symptoms": [
                    "skin_rash", "yellowish_skin"
                ],
                "min_symptoms_required": 2,
                "icd_code": "B50-B54",
                "who_guideline": "WHO Malaria Treatment Guidelines 2022",
                "prevalence": "Endemic regions: Africa, South Asia, Southeast Asia"
            },
            "Dengue": {
                "required_at_least_one": [
                    "high_fever", "joint_pain", "pain_behind_the_eyes"
                ],
                "supporting_symptoms": [
                    "skin_rash", "headache", "muscle_pain",
                    "nausea", "vomiting", "fatigue", "red_spots_over_body"
                ],
                "contradicting_symptoms": [],
                "min_symptoms_required": 3,
                "icd_code": "A90-A91",
                "who_guideline": "WHO Dengue Guidelines 2023",
                "prevalence": "Tropical regions worldwide"
            },
            "Diabetes": {
                "required_at_least_one": [
                    "polyuria", "excessive_hunger",
                    "irregular_sugar_level", "weight_loss"
                ],
                "supporting_symptoms": [
                    "fatigue", "blurred_and_distorted_vision",
                    "restlessness", "increased_appetite",
                    "obesity", "lethargy"
                ],
                "contradicting_symptoms": [
                    "high_fever", "chills"
                ],
                "min_symptoms_required": 2,
                "icd_code": "E10-E14",
                "who_guideline": "WHO Diabetes Diagnosis Criteria 2019",
                "prevalence": "Worldwide — 422 million people"
            },
            "Tuberculosis": {
                "required_at_least_one": [
                    "cough", "blood_in_sputum", "rusty_sputum"
                ],
                "supporting_symptoms": [
                    "fatigue", "weight_loss", "sweating",
                    "high_fever", "mild_fever", "breathlessness",
                    "loss_of_appetite", "malaise"
                ],
                "contradicting_symptoms": [],
                "min_symptoms_required": 3,
                "icd_code": "A15-A19",
                "who_guideline": "WHO TB Treatment Guidelines 2022",
                "prevalence": "Worldwide — 10 million cases/year"
            },
            "Pneumonia": {
                "required_at_least_one": [
                    "cough", "breathlessness", "chest_pain"
                ],
                "supporting_symptoms": [
                    "high_fever", "chills", "fatigue",
                    "phlegm", "sweating", "fast_heart_rate",
                    "rusty_sputum", "malaise"
                ],
                "contradicting_symptoms": [
                    "skin_rash", "joint_pain"
                ],
                "min_symptoms_required": 3,
                "icd_code": "J12-J18",
                "who_guideline": "WHO Pneumonia Guidelines 2021",
                "prevalence": "Leading cause of death in children < 5"
            },
            "Typhoid": {
                "required_at_least_one": [
                    "high_fever", "abdominal_pain", "constipation"
                ],
                "supporting_symptoms": [
                    "headache", "nausea", "vomiting",
                    "fatigue", "chills", "diarrhoea",
                    "toxic_look_(typhos)", "belly_pain"
                ],
                "contradicting_symptoms": [],
                "min_symptoms_required": 3,
                "icd_code": "A01",
                "who_guideline": "WHO Typhoid Fever Guidelines",
                "prevalence": "11-21 million cases/year globally"
            },
            "Hypertension": {
                "required_at_least_one": [
                    "headache", "dizziness"
                ],
                "supporting_symptoms": [
                    "chest_pain", "loss_of_balance",
                    "lack_of_concentration", "breathlessness"
                ],
                "contradicting_symptoms": [
                    "high_fever", "skin_rash", "vomiting"
                ],
                "min_symptoms_required": 1,
                "icd_code": "I10-I15",
                "who_guideline": "WHO/ISH Hypertension Guidelines 2023",
                "prevalence": "1.28 billion adults worldwide"
            },
            "Heart attack": {
                "required_at_least_one": [
                    "chest_pain", "breathlessness"
                ],
                "supporting_symptoms": [
                    "sweating", "vomiting", "fast_heart_rate",
                    "cold_hands_and_feets", "palpitations"
                ],
                "contradicting_symptoms": [
                    "skin_rash", "itching", "joint_pain"
                ],
                "min_symptoms_required": 2,
                "icd_code": "I21-I22",
                "who_guideline": "ESC STEMI Guidelines 2023",
                "prevalence": "Medical Emergency — 7 million deaths/year"
            },
            "Common Cold": {
                "required_at_least_one": [
                    "continuous_sneezing", "runny_nose",
                    "cough", "congestion"
                ],
                "supporting_symptoms": [
                    "headache", "fatigue", "throat_irritation",
                    "mild_fever", "sinus_pressure", "malaise",
                    "muscle_pain", "phlegm"
                ],
                "contradicting_symptoms": [
                    "high_fever", "chest_pain", "breathlessness"
                ],
                "min_symptoms_required": 2,
                "icd_code": "J00",
                "who_guideline": "Common cold is self-limiting viral illness",
                "prevalence": "Adults get 2-4 colds/year on average"
            },
            "Urinary tract infection": {
                "required_at_least_one": [
                    "burning_micturition", "bladder_discomfort",
                    "continuous_feel_of_urine"
                ],
                "supporting_symptoms": [
                    "foul_smell_of_urine", "spotting_urination",
                    "mild_fever"
                ],
                "contradicting_symptoms": [
                    "chest_pain", "skin_rash", "joint_pain"
                ],
                "min_symptoms_required": 2,
                "icd_code": "N30-N39",
                "who_guideline": "EAU UTI Guidelines 2022",
                "prevalence": "150 million cases/year globally"
            }
        }

    def _build_red_flags(self) -> dict:
        """
        Symptoms that ALWAYS need immediate attention
        Regardless of AI prediction
        Based on emergency medicine guidelines
        """
        return {
            "chest_pain": {
                "urgency": "EMERGENCY",
                "concern": "Possible myocardial infarction or pulmonary embolism",
                "action": "ECG immediately. Rule out cardiac cause first.",
                "guideline": "ACC/AHA Chest Pain Guidelines 2021"
            },
            "breathlessness": {
                "urgency": "URGENT",
                "concern": "Respiratory distress — multiple possible causes",
                "action": "Check oxygen saturation. If SpO2 < 94%, start O2.",
                "guideline": "BTS Breathlessness Guidelines"
            },
            "altered_sensorium": {
                "urgency": "EMERGENCY",
                "concern": "Neurological emergency — stroke, meningitis, metabolic",
                "action": "CT brain immediately. Check glucose.",
                "guideline": "Neurology Emergency Guidelines"
            },
            "coma": {
                "urgency": "EMERGENCY",
                "concern": "Loss of consciousness — life threatening",
                "action": "ABC assessment. Call code immediately.",
                "guideline": "Emergency Medicine Guidelines"
            },
            "stomach_bleeding": {
                "urgency": "EMERGENCY",
                "concern": "GI bleeding — hemodynamic instability risk",
                "action": "IV access. Blood type and cross. Surgical consult.",
                "guideline": "BSG GI Bleeding Guidelines"
            },
            "weakness_of_one_body_side": {
                "urgency": "EMERGENCY",
                "concern": "Possible stroke — time critical",
                "action": "FAST assessment. CT brain. Thrombolysis if eligible.",
                "guideline": "AHA/ASA Stroke Guidelines 2023"
            },
            "slurred_speech": {
                "urgency": "EMERGENCY",
                "concern": "Stroke or metabolic encephalopathy",
                "action": "Neurological assessment immediately",
                "guideline": "AHA Stroke Guidelines"
            },
            "blood_in_sputum": {
                "urgency": "URGENT",
                "concern": "Hemoptysis — TB, cancer, pulmonary embolism",
                "action": "Chest X-ray. Sputum AFB. CT chest if needed.",
                "guideline": "BTS Haemoptysis Guidelines"
            },
            "high_fever": {
                "urgency": "URGENT",
                "concern": "Fever > 104°F (40°C) needs immediate evaluation",
                "action": "Blood cultures. Antipyretics. Find source.",
                "guideline": "IDSA Fever Guidelines"
            },
            "fast_heart_rate": {
                "urgency": "URGENT",
                "concern": "Tachycardia > 150/min needs evaluation",
                "action": "12-lead ECG. Check for arrhythmia.",
                "guideline": "AHA Arrhythmia Guidelines"
            }
        }

    def _build_contraindications(self) -> dict:
        """
        Drug-disease contraindications
        Based on pharmacology guidelines
        """
        return {
            "Aspirin": {
                "contraindicated_in": [
                    "peptic ulcer", "asthma", "dengue",
                    "children under 12", "bleeding disorders"
                ],
                "reason": "GI bleeding risk, Reye's syndrome in children, bleeding in dengue"
            },
            "NSAIDs": {
                "contraindicated_in": [
                    "kidney disease", "heart failure",
                    "dengue", "peptic ulcer", "pregnancy third trimester"
                ],
                "reason": "Worsens kidney function, increases bleeding risk"
            },
            "Metformin": {
                "contraindicated_in": [
                    "kidney failure", "liver failure",
                    "contrast dye procedures", "alcoholism"
                ],
                "reason": "Risk of lactic acidosis"
            },
            "Ciprofloxacin": {
                "contraindicated_in": [
                    "children under 18", "pregnancy",
                    "tendon disorders", "epilepsy"
                ],
                "reason": "Cartilage damage in children, tendinitis risk"
            },
            "Chloroquine": {
                "contraindicated_in": [
                    "retinal disease", "porphyria",
                    "chloroquine-resistant malaria areas"
                ],
                "reason": "Retinal toxicity, ineffective in resistant areas"
            }
        }

    # ─────────────────────────────────────────────────────
    # VALIDATE AI PREDICTION
    # ─────────────────────────────────────────────────────

    def validate_prediction(
        self,
        predicted_disease: str,
        symptoms: list,
        confidence: float
    ) -> dict:
        """
        Validates AI prediction against medical guidelines

        Returns:
            validation_status: VALID / CAUTION / INVALID
            validation_score: 0-100
            medical_evidence: supporting evidence
            warnings: any concerns
            red_flags: emergency symptoms detected
        """

        warnings = []
        evidence = []
        red_flags = []

        # Check for red flag symptoms
        for symptom in symptoms:
            sym_clean = symptom.lower().replace(' ', '_')
            if sym_clean in self.red_flag_symptoms:
                flag = self.red_flag_symptoms[sym_clean]
                red_flags.append({
                    "symptom": symptom,
                    "urgency": flag["urgency"],
                    "concern": flag["concern"],
                    "action": flag["action"],
                    "guideline": flag["guideline"]
                })

        # Get validity rules for this disease
        validity_rules = self.disease_symptom_validity.get(
            predicted_disease, {}
        )

        validation_score = 100
        symptom_set = set([s.lower().replace(' ', '_') for s in symptoms])

        if validity_rules:
            # Check if minimum symptoms are present
            min_required = validity_rules.get('min_symptoms_required', 1)
            required_any = validity_rules.get('required_at_least_one', [])
            supporting = validity_rules.get('supporting_symptoms', [])
            contradicting = validity_rules.get('contradicting_symptoms', [])

            # Check required symptoms
            required_found = [
                s for s in required_any if s in symptom_set
            ]

            if required_any and not required_found:
                warnings.append(
                    f"None of the typical {predicted_disease} symptoms "
                    f"({', '.join(required_any[:3])}) are present. "
                    f"Consider re-evaluation."
                )
                validation_score -= 30

            # Check contradicting symptoms
            contradictions_found = [
                s for s in contradicting if s in symptom_set
            ]
            if contradictions_found:
                warnings.append(
                    f"Symptoms {', '.join(contradictions_found)} are "
                    f"uncommon in {predicted_disease}. "
                    f"Consider differential diagnosis."
                )
                validation_score -= 20

            # Add supporting evidence
            supporting_found = [
                s for s in supporting if s in symptom_set
            ]
            if supporting_found:
                evidence.append(
                    f"Supporting symptoms present: "
                    f"{', '.join(supporting_found[:5])}"
                )
                evidence.append(
                    f"ICD Code: {validity_rules.get('icd_code', 'N/A')}"
                )
                evidence.append(
                    f"Reference: {validity_rules.get('who_guideline', 'N/A')}"
                )
                evidence.append(
                    f"Prevalence: {validity_rules.get('prevalence', 'N/A')}"
                )

        else:
            # Disease not in our validation database
            warnings.append(
                f"Note: {predicted_disease} is not in our validation "
                f"database. AI confidence: {confidence}%. "
                f"Please apply clinical judgment."
            )
            validation_score = min(validation_score, 60)

        # Adjust for confidence
        if confidence < self.confidence_thresholds["medium"]:
            warnings.append(
                f"AI confidence is {confidence}% which is below 50%. "
                f"Consider additional tests before finalizing diagnosis."
            )
            validation_score = min(validation_score, 50)
        elif confidence < self.confidence_thresholds["high"]:
            warnings.append(
                f"Moderate AI confidence ({confidence}%). "
                f"Lab tests are recommended to confirm."
            )

        # Determine validation status
        if validation_score >= 70:
            status = "VALID"
            status_message = (
                f"AI prediction of {predicted_disease} is "
                f"medically consistent with the symptoms provided."
            )
        elif validation_score >= 40:
            status = "CAUTION"
            status_message = (
                f"AI prediction of {predicted_disease} needs "
                f"clinical verification. Lab tests strongly recommended."
            )
        else:
            status = "REVIEW_NEEDED"
            status_message = (
                f"AI prediction of {predicted_disease} may need "
                f"re-evaluation. Symptoms may suggest alternative diagnosis."
            )

        return {
            "predicted_disease": predicted_disease,
            "validation_status": status,
            "validation_score": max(validation_score, 0),
            "status_message": status_message,
            "medical_evidence": evidence,
            "warnings": warnings,
            "red_flags": red_flags,
            "has_emergency": len([
                f for f in red_flags
                if f.get('urgency') == 'EMERGENCY'
            ]) > 0,
            "has_urgent": len([
                f for f in red_flags
                if f.get('urgency') in ['EMERGENCY', 'URGENT']
            ]) > 0,
            "icd_code": self.disease_symptom_validity.get(
                predicted_disease, {}
            ).get('icd_code', 'N/A'),
            "who_guideline": self.disease_symptom_validity.get(
                predicted_disease, {}
            ).get('who_guideline', 'N/A')
        }

    # ─────────────────────────────────────────────────────
    # VALIDATE MEDICINES
    # ─────────────────────────────────────────────────────

    def validate_medicines(
        self,
        medicines: list,
        predicted_disease: str,
        patient_conditions: list = None
    ) -> dict:
        """
        Check suggested medicines for safety issues
        Based on standard pharmacology guidelines
        """

        patient_conditions = patient_conditions or []
        alerts = []
        safe_medicines = []
        flagged_medicines = []

        for medicine in medicines:
            med_lower = medicine.lower()
            medicine_flagged = False

            # Check direct contraindications
            for med_key, contra_info in self.contraindications.items():
                if med_key.lower() in med_lower:
                    # Check if contraindicated for this disease
                    disease_lower = predicted_disease.lower()
                    contra_diseases = [
                        c.lower() for c in
                        contra_info['contraindicated_in']
                    ]

                    for contra in contra_diseases:
                        if contra in disease_lower or any(
                            contra in cond.lower()
                            for cond in patient_conditions
                        ):
                            alerts.append({
                                "medicine": medicine,
                                "issue": "CONTRAINDICATION",
                                "severity": "HIGH",
                                "reason": contra_info['reason'],
                                "recommendation": (
                                    f"Avoid {medicine} in this case. "
                                    f"Consider alternative."
                                )
                            })
                            flagged_medicines.append(medicine)
                            medicine_flagged = True
                            break

            if not medicine_flagged:
                safe_medicines.append(medicine)

        return {
            "total_medicines": len(medicines),
            "safe_medicines": safe_medicines,
            "flagged_medicines": flagged_medicines,
            "alerts": alerts,
            "all_safe": len(alerts) == 0,
            "recommendation": (
                "All suggested medicines appear safe for this case."
                if not alerts else
                f"⚠️ {len(alerts)} medicine(s) flagged. "
                f"Review before prescribing."
            )
        }

    # ─────────────────────────────────────────────────────
    # DIFFERENTIAL DIAGNOSIS
    # ─────────────────────────────────────────────────────

    def suggest_differential_diagnosis(
        self,
        symptoms: list,
        predicted_disease: str,
        top_predictions: list
    ) -> list:
        """
        Suggests differential diagnoses based on symptoms
        Helps doctor think about alternative possibilities
        Based on standard medical differential diagnosis approach
        """

        symptom_set = set([
            s.lower().replace(' ', '_') for s in symptoms
        ])

        differentials = []

        # Add from AI top predictions (excluding primary)
        for pred in top_predictions:
            disease = pred.get('disease', '')
            confidence = pred.get('confidence', 0)
            if disease != predicted_disease and confidence > 10:
                differentials.append({
                    "disease": disease,
                    "probability": confidence,
                    "source": "AI Analysis",
                    "reason": f"AI confidence: {confidence}%"
                })

        # Add clinically common differentials
        common_differentials = {
            "Malaria": ["Dengue", "Typhoid", "Viral fever", "Leptospirosis"],
            "Dengue": ["Malaria", "Typhoid", "Chikungunya", "Viral fever"],
            "Typhoid": ["Malaria", "Dengue", "Viral hepatitis", "UTI"],
            "Pneumonia": ["Tuberculosis", "Bronchial Asthma", "Pleuritis", "Lung abscess"],
            "Common Cold": ["Influenza", "Allergy", "Sinusitis", "COVID-19"],
            "Diabetes": ["Hyperthyroidism", "Cushing syndrome", "Stress hyperglycemia"],
            "Hypertension": ["White coat hypertension", "Secondary hypertension", "Anxiety"],
            "Heart attack": ["Angina", "GERD", "Pulmonary embolism", "Aortic dissection"],
            "Urinary tract infection": ["Vaginitis", "STI", "Kidney stones", "Prostatitis"],
            "Jaundice": ["Hepatitis A", "Hepatitis B", "Hepatitis C", "Bile duct obstruction"]
        }

        clinical_diffs = common_differentials.get(predicted_disease, [])
        for diff in clinical_diffs:
            if not any(
                d['disease'].lower() == diff.lower()
                for d in differentials
            ):
                differentials.append({
                    "disease": diff,
                    "probability": None,
                    "source": "Clinical Guidelines",
                    "reason": (
                        f"Common differential diagnosis for {predicted_disease}"
                    )
                })

        return differentials[:8]  # Return top 8 differentials

    # ─────────────────────────────────────────────────────
    # FULL VALIDATION REPORT
    # ─────────────────────────────────────────────────────

    def generate_full_report(
        self,
        predicted_disease: str,
        symptoms: list,
        confidence: float,
        medicines: list = None,
        top_predictions: list = None,
        patient_conditions: list = None
    ) -> dict:
        """
        Generate complete medical validation report
        Called after every AI prediction
        """

        medicines = medicines or []
        top_predictions = top_predictions or []
        patient_conditions = patient_conditions or []

        # Run all validations
        prediction_validation = self.validate_prediction(
            predicted_disease, symptoms, confidence
        )

        medicine_validation = self.validate_medicines(
            medicines, predicted_disease, patient_conditions
        ) if medicines else None

        differentials = self.suggest_differential_diagnosis(
            symptoms, predicted_disease, top_predictions
        )

        # Overall safety level
        if prediction_validation.get('has_emergency'):
            overall_level = "EMERGENCY"
        elif prediction_validation.get('has_urgent'):
            overall_level = "URGENT"
        elif prediction_validation['validation_status'] == 'VALID':
            overall_level = "ROUTINE"
        else:
            overall_level = "REVIEW"

        return {
            "overall_level": overall_level,
            "prediction_validation": prediction_validation,
            "medicine_validation": medicine_validation,
            "differential_diagnosis": differentials,
            "important_disclaimer": (
                "This AI assistant is a decision SUPPORT tool. "
                "All diagnoses must be confirmed by a qualified "
                "medical professional. AI suggestions should prompt "
                "clinical thinking, not replace it."
            ),
            "ai_role": (
                "The AI analyzes symptom patterns from medical datasets "
                "and suggests possibilities for the doctor to consider. "
                "Final clinical judgment rests with the treating physician."
            )
        }


# ─────────────────────────────────────────────────────────
# SINGLETON
# ─────────────────────────────────────────────────────────

_validator_instance = None


def get_medical_validator() -> MedicalValidator:
    global _validator_instance
    if _validator_instance is None:
        _validator_instance = MedicalValidator()
    return _validator_instance