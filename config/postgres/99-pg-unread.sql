\connect jabber;

-- The additional table for unread messages, per user, per conversation
CREATE TABLE IF NOT EXISTS unread_messages (
  user_jid TEXT NOT NULL,
  conversation_jid TEXT NOT NULL,
  message_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (user_jid, conversation_jid, message_id)
);
