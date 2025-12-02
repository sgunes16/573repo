from django.apps import AppConfig


class RestApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "rest_api"

    def ready(self):
        """Called when Django starts"""
        import os
        # Only run in main process (not in migrations or shell)
        if os.environ.get('RUN_MAIN') == 'true' or os.environ.get('GUNICORN_RUNNING'):
            from rest_api.storage import ensure_minio_bucket
            ensure_minio_bucket()
