#!/bin/sh
set -e

echo "Starting backend bootstrap..."

echo "Running database migrations..."
until python manage.py migrate --noinput; do
    echo "Migrations failed - retrying in 3 seconds..."
    sleep 3
done

echo "Collecting static files..."
python manage.py collectstatic --noinput

# Ensure MinIO bucket exists
echo "Ensuring MinIO bucket exists..."
python << 'EOF'
import os
import boto3
from botocore.exceptions import ClientError

endpoint = os.getenv('MINIO_ENDPOINT', 'localhost:9000')
access_key = os.getenv('MINIO_ACCESS_KEY', 'minioadmin')
secret_key = os.getenv('MINIO_SECRET_KEY', 'minioadmin123')
bucket_name = os.getenv('MINIO_BUCKET_NAME', 'hive-media')
use_ssl = os.getenv('MINIO_USE_SSL', 'false').lower() == 'true'

endpoint_url = f"{'https' if use_ssl else 'http'}://{endpoint}"

try:
    s3 = boto3.client(
        's3',
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name='us-east-1'
    )
    
    # Check if bucket exists
    try:
        s3.head_bucket(Bucket=bucket_name)
        print(f"✅ Bucket '{bucket_name}' already exists")
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            # Create bucket
            s3.create_bucket(Bucket=bucket_name)
            print(f"✅ Created bucket '{bucket_name}'")
            
            # Set bucket policy for public read
            policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{bucket_name}/*"]
                }]
            }
            import json
            s3.put_bucket_policy(Bucket=bucket_name, Policy=json.dumps(policy))
            print(f"✅ Set public-read policy on '{bucket_name}'")
        else:
            print(f"⚠️  Error checking bucket: {e}")
except Exception as e:
    print(f"⚠️  MinIO setup warning (will retry on first upload): {e}")
EOF

RUN_SEED_VALUE="${RUN_SEED_OFFERS:-true}"
if [ -z "${RUN_SEED_VALUE}" ]; then
    RUN_SEED_VALUE="true"
fi

if [ "${RUN_SEED_VALUE}" = "true" ]; then
    echo "Seeding database with default data (can be disabled with RUN_SEED_OFFERS=false)..."
    python manage.py seed_offers || echo "Seed command failed (probably already seeded); continuing..."
fi

if [ -n "${DJANGO_SUPERUSER_USERNAME:-}" ] && \
   [ -n "${DJANGO_SUPERUSER_EMAIL:-}" ] && \
   [ -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]; then
    echo "Ensuring Django superuser ${DJANGO_SUPERUSER_USERNAME} exists..."
    python manage.py createsuperuser \
        --noinput \
        --username "${DJANGO_SUPERUSER_USERNAME}" \
        --email "${DJANGO_SUPERUSER_EMAIL}" \
        || echo "Superuser already exists or creation failed; continuing..."
else
    echo "DJANGO_SUPERUSER_* variables not fully set. Skipping superuser creation."
fi

echo "Backend bootstrap complete. Launching application..."
exec "$@"
