-- ============================================================================
-- MIGRATION: Enhanced Notification System Tables
-- ============================================================================
-- Adds support for notification templates, preferences, and better tracking

-- 1. Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  message_type VARCHAR(100) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message_template TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_enabled ON notification_templates(enabled);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(message_type);

-- 2. Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE UNIQUE,
  email_on_critical BOOLEAN DEFAULT TRUE,
  email_on_high BOOLEAN DEFAULT TRUE,
  email_on_medium BOOLEAN DEFAULT FALSE,
  slack_on_critical BOOLEAN DEFAULT TRUE,
  slack_on_high BOOLEAN DEFAULT TRUE,
  notify_ai_agents BOOLEAN DEFAULT TRUE,
  digest_frequency VARCHAR(50) DEFAULT 'daily',
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_admin ON notification_preferences(admin_id);

-- 3. Alter admin_notifications table to add missing columns (if needed)
ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;
ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS related_player_id INTEGER;
ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS related_game_id INTEGER;

-- 4. Create notification_archive table for historical data
CREATE TABLE IF NOT EXISTS notification_archive (
  id SERIAL PRIMARY KEY,
  original_id INTEGER NOT NULL,
  admin_id INTEGER,
  ai_employee_id VARCHAR(50),
  message_type VARCHAR(100),
  subject VARCHAR(255),
  message TEXT,
  priority VARCHAR(20),
  status VARCHAR(50),
  created_at TIMESTAMP,
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_archive_admin ON notification_archive(admin_id);
CREATE INDEX IF NOT EXISTS idx_notification_archive_original ON notification_archive(original_id);

-- 5. Insert default notification templates
INSERT INTO notification_templates (name, message_type, subject, message_template, priority, tags, enabled)
VALUES 
  (
    'Player Account Alert',
    'security',
    '[SECURITY] Account Activity Alert for {player_name}',
    'Unusual account activity detected for player {player_name}. IP: {ip_address}. Location: {location}. Time: {timestamp}',
    'high',
    ARRAY['player', 'security', 'account']::TEXT[],
    TRUE
  ),
  (
    'Large Transaction Alert',
    'security',
    '[ALERT] Large Transaction Detected',
    'Player {player_name} has completed a large transaction. Amount: {amount}. Type: {type}. Details: {details}',
    'high',
    ARRAY['finance', 'transaction', 'alert']::TEXT[],
    TRUE
  ),
  (
    'Game Issue Report',
    'alert',
    '[GAME] Technical Issue: {game_name}',
    'Game {game_name} has reported a technical issue. Error: {error_message}. Players affected: {affected_count}. Action required: {required_action}',
    'high',
    ARRAY['game', 'technical', 'issue']::TEXT[],
    TRUE
  ),
  (
    'Daily Digest',
    'message',
    'Daily Admin Summary',
    'Here is your daily summary:\n\nNew Players: {new_players}\nTotal Revenue: {total_revenue}\nCritical Issues: {critical_issues}\nTop Game: {top_game}\n\nFor more details, visit the admin dashboard.',
    'low',
    ARRAY['daily', 'summary', 'digest']::TEXT[],
    TRUE
  ),
  (
    'AI Agent Task',
    'task',
    'AI Agent Task: {task_name}',
    'AI Agent {agent_name} has been assigned the following task:\n\n{task_description}\n\nDeadline: {deadline}\nPriority: {priority}',
    'medium',
    ARRAY['ai', 'task', 'assignment']::TEXT[],
    TRUE
  ),
  (
    'System Maintenance',
    'system',
    '[SYSTEM] Maintenance Scheduled',
    'System maintenance is scheduled for {datetime}. Expected downtime: {duration} minutes. Services affected: {services}',
    'medium',
    ARRAY['system', 'maintenance', 'schedule']::TEXT[],
    TRUE
  ),
  (
    'Fraud Detection Alert',
    'security',
    '[CRITICAL] Potential Fraud Detected',
    'CRITICAL: Potential fraudulent activity detected.\n\nPlayer: {player_name}\nAmount: {amount}\nRisk Score: {risk_score}%\nIndicators: {indicators}\n\nImmediate action may be required.',
    'critical',
    ARRAY['fraud', 'security', 'critical']::TEXT[],
    TRUE
  ),
  (
    'API Error Alert',
    'alert',
    '[API] Integration Error: {service_name}',
    'API integration with {service_name} has encountered errors.\n\nError: {error_message}\nStatus Code: {status_code}\nRetries: {retry_count}\nLast Successful: {last_success}',
    'high',
    ARRAY['api', 'integration', 'error']::TEXT[],
    TRUE
  );

-- 6. Create function to automatically archive old notifications (optional)
CREATE OR REPLACE FUNCTION archive_old_notifications()
RETURNS void AS $$
BEGIN
  INSERT INTO notification_archive (original_id, admin_id, ai_employee_id, message_type, subject, message, priority, status, created_at)
  SELECT id, admin_id, ai_employee_id, message_type, subject, message, priority, status, created_at
  FROM admin_notifications
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND status IN ('completed', 'archived')
  ON CONFLICT DO NOTHING;

  DELETE FROM admin_notifications
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND status IN ('completed', 'archived');
END;
$$ LANGUAGE plpgsql;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON admin_notifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority ON admin_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notification_actions_notification ON notification_actions(notification_id);

-- Verify tables were created
SELECT 'notification_templates'::text as table_name FROM pg_tables WHERE tablename = 'notification_templates'
UNION ALL
SELECT 'notification_preferences'::text as table_name FROM pg_tables WHERE tablename = 'notification_preferences'
UNION ALL
SELECT 'notification_archive'::text as table_name FROM pg_tables WHERE tablename = 'notification_archive';
