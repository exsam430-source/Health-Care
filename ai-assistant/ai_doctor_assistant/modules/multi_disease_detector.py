# modules/multi_disease_detector.py

class MultiDiseaseDetector:
    """
    Detects if patient might have multiple diseases
    Based on symptom clusters
    """

    # Disease clusters that commonly occur together
    COMMON_COMORBIDITIES = {
        "Diabetes": ["Hypertension", "Hyperlipidemia", "Kidney Disease"],
        "Hypertension": ["Diabetes", "Heart attack", "Cervical spondylosis"],
        "Hypothyroidism": ["Depression", "Hypertension", "Diabetes"],
        "Obesity": ["Diabetes", "Hypertension", "Osteoarthritis"],
        "GERD": ["Peptic ulcer disease", "Bronchial Asthma"]
    }

    def check_comorbidities(
        self,
        primary_disease: str,
        symptoms: list,
        top_predictions: list
    ) -> dict:
        """
        Check if patient might have additional diseases
        """

        potential_additional = []

        # Check known comorbidities
        comorbidities = self.COMMON_COMORBIDITIES.get(primary_disease, [])

        for disease, confidence in top_predictions:
            if disease != primary_disease and confidence > 15:
                potential_additional.append({
                    "disease": disease,
                    "confidence": confidence,
                    "reason": (
                        "Comorbidity with " + primary_disease
                        if disease in comorbidities
                        else "Significant symptom overlap"
                    ),
                    "is_known_comorbidity": disease in comorbidities
                })

        return {
            "primary_disease": primary_disease,
            "potential_additional_diseases": potential_additional[:3],
            "comorbidity_risk": len(comorbidities) > 0,
            "recommendation": (
                "Consider testing for comorbid conditions"
                if potential_additional else
                "No significant comorbidities detected"
            )
        }