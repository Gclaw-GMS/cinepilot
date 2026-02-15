#!/bin/bash
# CinePilot Database Setup

echo "Setting up CinePilot Database..."

# Create database
psql -U postgres -c "CREATE DATABASE cinepilot;" 2>/dev/null || echo "Database may already exist"

# Run schema
psql -U postgres -d cinepilot -f schema.sql

echo "Database setup complete!"
echo "Run: cd backend && uvicorn main:app --reload"
