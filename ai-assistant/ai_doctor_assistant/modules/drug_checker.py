# modules/drug_checker.py

class DrugInteractionChecker:
    """
    Checks for dangerous drug interactions
    Based on known interaction database
    """

    # Known dangerous interactions
    INTERACTIONS = {
        ("warfarin", "aspirin"): {
            "severity": "CRITICAL",
            "effect": "Increased bleeding risk",
            "recommendation": "Avoid combination"
        },
        ("metformin", "alcohol"): {
            "severity": "HIGH",
            "effect": "Risk of lactic acidosis",
            "recommendation": "Avoid alcohol while on Metformin"
        },
        ("ciprofloxacin", "antacids"): {
            "severity": "MODERATE",
            "effect": "Reduced antibiotic absorption",
            "recommendation": "Take 2 hours apart"
        },
        ("ssri", "tramadol"): {
            "severity": "HIGH",
            "effect": "Serotonin syndrome risk",
            "recommendation": "Use with extreme caution"
        }
    }

    def check_interactions(
        self,
        new_medicines: list,
        current_medicines: list,
        patient_allergies: list = None
    ) -> dict:
        """Check for drug interactions"""

        warnings = []
        allergy_alerts = []

        # Check drug-drug interactions
        all_drugs = [d.lower() for d in new_medicines + current_medicines]

        for (drug1, drug2), interaction in self.INTERACTIONS.items():
            if drug1 in all_drugs and drug2 in all_drugs:
                warnings.append({
                    "drugs": [drug1, drug2],
                    "severity": interaction["severity"],
                    "effect": interaction["effect"],
                    "recommendation": interaction["recommendation"]
                })

        # Check allergies
        if patient_allergies:
            for med in new_medicines:
                for allergy in patient_allergies:
                    if allergy.lower() in med.lower():
                        allergy_alerts.append({
                            "medicine": med,
                            "allergen": allergy,
                            "severity": "CRITICAL",
                            "message": f"Patient is allergic to {allergy}!"
                        })

        return {
            "safe_to_prescribe": len(warnings) == 0 and len(allergy_alerts) == 0,
            "interaction_warnings": warnings,
            "allergy_alerts": allergy_alerts,
            "total_issues": len(warnings) + len(allergy_alerts)
        }