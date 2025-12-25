-- Migration: Add content column to documents table
-- Purpose: Store original document content for context expansion during citation display

ALTER TABLE documents ADD COLUMN content TEXT;
