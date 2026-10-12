# Add to requirements.txt:
# celery==5.3.6
# redis==5.0.1

# tasks/retrain_task.py
"""
Run retraining in background so API doesn't slow down
"""

# Install Redis: https://redis.io/download
# Run: celery -A tasks worker --loglevel=info

try:
    from celery import Celery

    celery_app = Celery('ai_doctor', broker='redis://localhost:6379/0')

    @celery_app.task
    def async_retrain(symptoms, correct_disease):
        """Background retraining task"""
        from modules.retrainer import get_retrainer
        retrainer = get_retrainer()
        return retrainer.retrain_with_feedback(symptoms, correct_disease)

    @celery_app.task
    def async_batch_retrain():
        """Scheduled weekly batch retraining"""
        from modules.retrainer import get_retrainer
        retrainer = get_retrainer()
        return retrainer.batch_retrain()

except ImportError:
    print("Celery not installed — using synchronous processing")