# Task

Implement a production-style chat messaging system using React, Supabase, and PostgreSQL.

The goal is to handle thousands or millions of messages efficiently without loading all messages into memory.

# Requirements

## Database Structure

Create the following tables:

### chats

- id
- created_at
- updated_at
- last_message
- last_message_at

### messages

- id
- chat_id
- sender_id
- content
- created_at

Create proper foreign key relationships.

## Database Optimization

Create indexes for fast message retrieval.

Example:

```sql
CREATE INDEX idx_messages_chat_created
ON messages(chat_id, created_at DESC);