# modules/emergency_detector.py

class EmergencyDetector:
    """
    Detects emergency situations from symptoms
    Immediately alerts doctor
    """

    # Symptoms that indicate medical emergency
    EMERGENCY_SYMPTOMS = {
        "chest_pain": {
            "condition": "Possible Heart Attack",
            "urgency": "CALL AMBULANCE",
            "action": "Administer aspirin, ECG immediately"
        },
        "breathlessness": {
            "condition": "Respiratory Emergency",
            "urgency": "IMMEDIATE",
            "action": "Check oxygen saturation, nebulizer"
        },
        "altered_sensorium": {
            "condition": "Neurological Emergency",
            "urgency": "CALL AMBULANCE",
            "action": "CT scan immediately"
        },
        "coma": {
            "condition": "Loss of Consciousness",
            "urgency": "CALL AMBULANCE",
            "action": "Stabilize patient, check vitals"
        },
        "stomach_bleeding": {
            "condition": "Internal Bleeding",
            "urgency": "IMMEDIATE",
            "action": "IV access, blood group, surgical consult"
        }
    }

    # Emergency diseases
    EMERGENCY_DISEASES = [
        "Heart attack",
        "Paralysis (brain hemorrhage)",
        "Hepatitis E"
    ]

    def check_emergency(
        self,
        symptoms: list,
        predicted_disease: str = None
    ) -> dict:
        """
        Check if situation is emergency
        Returns alert level and actions
        """

        emergency_alerts = []

        # Check emergency symptoms
        for symptom in symptoms:
            sym_clean = symptom.lower().replace(' ', '_')
            if sym_clean in self.EMERGENCY_SYMPTOMS:
                info = self.EMERGENCY_SYMPTOMS[sym_clean]
                emergency_alerts.append({
                    "trigger": symptom,
                    "type": "SYMPTOM",
                    **info
                })

        # Check emergency disease
        if predicted_disease in self.EMERGENCY_DISEASES:
            emergency_alerts.append({
                "trigger": predicted_disease,
                "type": "DISEASE",
                "condition": f"{predicted_disease} detected",
                "urgency": "IMMEDIATE",
                "action": "Refer to specialist immediately"
            })

        is_emergency = len(emergency_alerts) > 0
        max_urgency = (
            "CALL AMBULANCE"
            if any(a["urgency"] == "CALL AMBULANCE" for a in emergency_alerts)
            else "IMMEDIATE" if emergency_alerts else "ROUTINE"
        )

        return {
            "is_emergency": is_emergency,
            "urgency_level": max_urgency,
            "alerts": emergency_alerts,
            "emergency_count": len(emergency_alerts)
        }