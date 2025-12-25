-- Migration: Add topics and processed_content columns to documents table
-- Purpose: Store AI-generated topics and cleaned content for better retrieval

ALTER TABLE documents ADD COLUMN topics TEXT;
ALTER TABLE documents ADD COLUMN processed_content TEXT;
