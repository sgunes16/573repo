"""
MinIO Storage utilities for Hive project
"""
import os
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def ensure_minio_bucket():
    """
    Ensure MinIO bucket exists. Creates it if it doesn't.
    Should be called on application startup.
    """
    # Only run if MinIO is enabled
    use_minio = os.getenv('USE_MINIO', 'true').lower() == 'true'
    if not use_minio:
        logger.info("MinIO disabled, using local storage")
        return False
    
    minio_endpoint = os.getenv('MINIO_ENDPOINT', 'localhost:9000')
    
    try:
        import boto3
        from botocore.exceptions import ClientError
        
        # Create S3 client
        s3_client = boto3.client(
            's3',
            endpoint_url=f"http://{minio_endpoint}",
            aws_access_key_id=os.getenv('MINIO_ACCESS_KEY', 'minioadmin'),
            aws_secret_access_key=os.getenv('MINIO_SECRET_KEY', 'minioadmin123'),
            region_name='us-east-1',
        )
        
        bucket_name = os.getenv('MINIO_BUCKET_NAME', 'hive-media')
        
        # Check if bucket exists
        try:
            s3_client.head_bucket(Bucket=bucket_name)
            logger.info(f"MinIO bucket '{bucket_name}' already exists")
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code')
            if error_code == '404':
                # Bucket doesn't exist, create it
                s3_client.create_bucket(Bucket=bucket_name)
                logger.info(f"Created MinIO bucket '{bucket_name}'")
                
                # Set bucket policy for public read
                bucket_policy = {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"AWS": "*"},
                            "Action": ["s3:GetBucketLocation", "s3:ListBucket"],
                            "Resource": f"arn:aws:s3:::{bucket_name}"
                        },
                        {
                            "Effect": "Allow",
                            "Principal": {"AWS": "*"},
                            "Action": "s3:GetObject",
                            "Resource": f"arn:aws:s3:::{bucket_name}/*"
                        }
                    ]
                }
                import json
                s3_client.put_bucket_policy(
                    Bucket=bucket_name,
                    Policy=json.dumps(bucket_policy)
                )
                logger.info(f"Set public read policy on bucket '{bucket_name}'")
            else:
                logger.error(f"Error checking bucket: {e}")
                return False
        
        return True
        
    except ImportError:
        logger.warning("boto3 not installed, skipping MinIO setup")
        return False
    except Exception as e:
        logger.error(f"Error setting up MinIO: {e}")
        return False

