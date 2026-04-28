#!/bin/sh

set -e

echo "Initializing database..."
python create_all.py

echo "Starting the application..."
exec "$@"