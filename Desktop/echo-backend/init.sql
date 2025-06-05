-- Mental Health Platform Database Initialization
-- This script creates the database with proper encoding for HIPAA compliance

-- Ensure proper encoding and collation
ALTER DATABASE mental_health_platform SET timezone TO 'UTC';

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set proper logging for audit purposes
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 0;
SELECT pg_reload_conf();

-- Create database user for the application (optional - for production)
-- CREATE USER mental_health_app WITH PASSWORD 'secure_app_password';
-- GRANT CONNECT ON DATABASE mental_health_platform TO mental_health_app;
-- GRANT USAGE ON SCHEMA public TO mental_health_app;
-- GRANT CREATE ON SCHEMA public TO mental_health_app;

COMMIT;

