# modules/notification_service.py

"""
Send notifications when:
1. Lab report validation complete
2. AI was wrong and model retrained
3. Emergency symptoms detected
4. Weekly performance report
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os


class NotificationService:

    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.email_user = os.getenv('EMAIL_USER', '')
        self.email_pass = os.getenv('EMAIL_PASS', '')

    def send_validation_complete(
        self,
        doctor_email: str,
        patient_id: str,
        ai_correct: bool,
        lab_disease: str
    ):
        """Send email when lab validation is complete"""

        subject = f"Lab Validation Complete - Patient {patient_id}"
        body = f"""
        Lab Validation Results:

        Patient ID: {patient_id}
        Lab Confirmed Disease: {lab_disease}
        AI Prediction: {'✅ CORRECT' if ai_correct else '❌ WRONG'}

        {'The AI model has been updated with this correct outcome.' if not ai_correct else 'AI performed well on this case.'}

        - AI Doctor Assistant
        """

        self._send_email(doctor_email, subject, body)

    def send_emergency_alert(
        self,
        doctor_email: str,
        patient_id: str,
        emergency_info: dict
    ):
        """Send urgent email for emergency symptoms"""

        subject = f"🚨 EMERGENCY ALERT - Patient {patient_id}"
        body = f"""
        EMERGENCY DETECTED!

        Patient: {patient_id}
        Urgency: {emergency_info.get('urgency_level')}
        Condition: {emergency_info.get('alerts', [{}])[0].get('condition', 'Unknown')}
        Action Required: {emergency_info.get('alerts', [{}])[0].get('action', 'Immediate attention')}

        Please attend to patient immediately!
        """

        self._send_email(doctor_email, subject, body)

    def _send_email(self, to_email: str, subject: str, body: str):
        """Send email via SMTP"""
        if not self.email_user or not to_email:
            print(f"   Email skipped (not configured): {subject}")
            return

        try:
            msg = MIMEMultipart()
            msg['From'] = self.email_user
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email_user, self.email_pass)
                server.send_message(msg)

            print(f"   ✅ Email sent to {to_email}")

        except Exception as e:
            print(f"   ❌ Email failed: {e}")