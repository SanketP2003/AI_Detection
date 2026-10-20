-- Baseline schema for AI Verify
-- Tables: users, detection_history, chat_history

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    roles VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- 2. Detection History Table
CREATE TABLE IF NOT EXISTS detection_history (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255),
    content_preview VARCHAR(255),
    result TEXT,
    confidence INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE
);

-- 3. Chat History Table
CREATE TABLE IF NOT EXISTS chat_history (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    response VARCHAR(2000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_history_username_created ON chat_history (username, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_history_created ON chat_history (created_at);
