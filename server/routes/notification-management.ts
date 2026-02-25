import { RequestHandler } from 'express';
import * as dbQueries from '../db/queries';
import { query } from '../db/connection';
import { emitAdminNotification } from '../socket';
import { NotificationService } from '../services/notification-service';

// ===== TEMPLATES =====

export const handleGetNotificationTemplates: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, message_type, subject, message_template, priority, tags
       FROM notification_templates
       WHERE enabled = TRUE
       ORDER BY name ASC`
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        messageType: row.message_type,
        subject: row.subject,
        messageTemplate: row.message_template,
        priority: row.priority,
        tags: row.tags || []
      }))
    });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  }
};

export const handleCreateNotificationTemplate: RequestHandler = async (req, res) => {
  try {
    const { name, messageType, subject, messageTemplate, priority, tags } = req.body;

    if (!name || !messageType || !subject || !messageTemplate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await query(
      `INSERT INTO notification_templates (name, message_type, subject, message_template, priority, tags, enabled)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING id, name, message_type, subject, message_template, priority, tags`,
      [name, messageType, subject, messageTemplate, priority || 'medium', tags || []]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating template:', error);
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
};

export const handleUpdateNotificationTemplate: RequestHandler = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { name, messageType, subject, messageTemplate, priority, tags } = req.body;

    const result = await query(
      `UPDATE notification_templates
       SET name = COALESCE($1, name),
           message_type = COALESCE($2, message_type),
           subject = COALESCE($3, subject),
           message_template = COALESCE($4, message_template),
           priority = COALESCE($5, priority),
           tags = COALESCE($6, tags),
           updated_at = NOW()
       WHERE id = $7
       RETURNING id, name, message_type, subject, message_template, priority, tags`,
      [name, messageType, subject, messageTemplate, priority, tags, templateId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating template:', error);
    res.status(500).json({ success: false, error: 'Failed to update template' });
  }
};

export const handleDeleteNotificationTemplate: RequestHandler = async (req, res) => {
  try {
    const { templateId } = req.params;

    const result = await query(
      'UPDATE notification_templates SET enabled = FALSE WHERE id = $1 RETURNING id',
      [templateId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    res.status(500).json({ success: false, error: 'Failed to delete template' });
  }
};

// ===== BULK ACTIONS =====

export const handleBulkNotificationAction: RequestHandler = async (req, res) => {
  try {
    const { notification_ids, action_type } = req.body;
    const adminId = req.user?.id;

    if (!notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0) {
      return res.status(400).json({ error: 'Invalid notification_ids' });
    }

    if (!action_type) {
      return res.status(400).json({ error: 'action_type is required' });
    }

    const validActions = ['approve', 'deny', 'archive', 'mark_read', 'mark_unread'];
    if (!validActions.includes(action_type)) {
      return res.status(400).json({ error: 'Invalid action_type' });
    }

    let updateQuery = '';
    let updateParams: any[] = [];

    switch (action_type) {
      case 'approve':
        updateQuery = `UPDATE admin_notifications
                       SET status = 'approved', updated_at = NOW()
                       WHERE id = ANY($1)
                       RETURNING id`;
        updateParams = [notification_ids];
        break;

      case 'deny':
        updateQuery = `UPDATE admin_notifications
                       SET status = 'denied', updated_at = NOW()
                       WHERE id = ANY($1)
                       RETURNING id`;
        updateParams = [notification_ids];
        break;

      case 'archive':
        updateQuery = `UPDATE admin_notifications
                       SET status = 'completed', updated_at = NOW()
                       WHERE id = ANY($1)
                       RETURNING id`;
        updateParams = [notification_ids];
        break;

      case 'mark_read':
        updateQuery = `UPDATE admin_notifications
                       SET read_at = NOW(), updated_at = NOW()
                       WHERE id = ANY($1)
                       RETURNING id`;
        updateParams = [notification_ids];
        break;

      case 'mark_unread':
        updateQuery = `UPDATE admin_notifications
                       SET read_at = NULL, updated_at = NOW()
                       WHERE id = ANY($1)
                       RETURNING id`;
        updateParams = [notification_ids];
        break;
    }

    const result = await query(updateQuery, updateParams);

    // Record bulk action
    if (adminId) {
      for (const notifId of notification_ids) {
        await query(
          `INSERT INTO notification_actions (notification_id, action_type, taken_by_admin_id)
           VALUES ($1, $2, $3)`,
          [notifId, `bulk_${action_type}`, adminId]
        );
      }
    }

    res.json({
      success: true,
      message: `Performed ${action_type} on ${result.rows.length} notifications`,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({ success: false, error: 'Failed to perform bulk action' });
  }
};

// ===== NOTIFICATION PREFERENCES =====

export const handleGetNotificationPreferences: RequestHandler = async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await query(
      `SELECT id, admin_id, email_on_critical, email_on_high, email_on_medium,
              slack_on_critical, slack_on_high, notify_ai_agents,
              digest_frequency, timezone, created_at, updated_at
       FROM notification_preferences
       WHERE admin_id = $1`,
      [adminId]
    );

    if (result.rows.length === 0) {
      // Return defaults if no preferences exist
      return res.json({
        success: true,
        data: {
          email_on_critical: true,
          email_on_high: true,
          email_on_medium: false,
          slack_on_critical: true,
          slack_on_high: true,
          notify_ai_agents: true,
          digest_frequency: 'daily',
          timezone: 'UTC'
        }
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch preferences' });
  }
};

export const handleUpdateNotificationPreferences: RequestHandler = async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      email_on_critical,
      email_on_high,
      email_on_medium,
      slack_on_critical,
      slack_on_high,
      notify_ai_agents,
      digest_frequency,
      timezone
    } = req.body;

    // Check if preferences exist
    const checkResult = await query(
      'SELECT id FROM notification_preferences WHERE admin_id = $1',
      [adminId]
    );

    let result;

    if (checkResult.rows.length > 0) {
      // Update existing
      result = await query(
        `UPDATE notification_preferences
         SET email_on_critical = COALESCE($1, email_on_critical),
             email_on_high = COALESCE($2, email_on_high),
             email_on_medium = COALESCE($3, email_on_medium),
             slack_on_critical = COALESCE($4, slack_on_critical),
             slack_on_high = COALESCE($5, slack_on_high),
             notify_ai_agents = COALESCE($6, notify_ai_agents),
             digest_frequency = COALESCE($7, digest_frequency),
             timezone = COALESCE($8, timezone),
             updated_at = NOW()
         WHERE admin_id = $9
         RETURNING *`,
        [
          email_on_critical,
          email_on_high,
          email_on_medium,
          slack_on_critical,
          slack_on_high,
          notify_ai_agents,
          digest_frequency,
          timezone,
          adminId
        ]
      );
    } else {
      // Insert new
      result = await query(
        `INSERT INTO notification_preferences
         (admin_id, email_on_critical, email_on_high, email_on_medium,
          slack_on_critical, slack_on_high, notify_ai_agents, digest_frequency, timezone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          adminId,
          email_on_critical !== undefined ? email_on_critical : true,
          email_on_high !== undefined ? email_on_high : true,
          email_on_medium !== undefined ? email_on_medium : false,
          slack_on_critical !== undefined ? slack_on_critical : true,
          slack_on_high !== undefined ? slack_on_high : true,
          notify_ai_agents !== undefined ? notify_ai_agents : true,
          digest_frequency || 'daily',
          timezone || 'UTC'
        ]
      );
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ success: false, error: 'Failed to update preferences' });
  }
};

// ===== NOTIFICATION ARCHIVE =====

export const handleGetArchivedNotifications: RequestHandler = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await query(
      `SELECT id, admin_id, ai_employee_id, message_type, subject, message,
              related_player_id, related_game_id, priority, status,
              created_at, read_at, updated_at
       FROM admin_notifications
       WHERE admin_id = $1 AND status IN ('completed', 'archived')
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [adminId, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as count FROM admin_notifications
       WHERE admin_id = $1 AND status IN ('completed', 'archived')`,
      [adminId]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit,
        offset,
        total: parseInt(countResult.rows[0].count)
      }
    });
  } catch (error: any) {
    console.error('Error fetching archived notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch archived notifications' });
  }
};

// ===== NOTIFICATION STATISTICS =====

export const handleGetNotificationStats: RequestHandler = async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'denied' THEN 1 END) as denied,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN read_at IS NULL THEN 1 END) as unread,
        COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h
       FROM admin_notifications
       WHERE admin_id = $1`,
      [adminId]
    );

    res.json({
      success: true,
      stats: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
};

// ===== EMAIL NOTIFICATION TRIGGER =====

export const handleSendEmailNotification: RequestHandler = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const { notificationId } = req.params;

    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get notification
    const notifResult = await query(
      `SELECT * FROM admin_notifications WHERE id = $1 AND admin_id = $2`,
      [notificationId, adminId]
    );

    if (notifResult.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notification = notifResult.rows[0];

    // Get admin email
    const adminResult = await query(
      `SELECT email FROM admin_users WHERE id = $1`,
      [adminId]
    );

    if (adminResult.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const adminEmail = adminResult.rows[0].email;

    // Send email
    try {
      await NotificationService.sendEmail(
        adminEmail,
        notification.subject,
        notification.message
      );

      res.json({ success: true, message: 'Email sent successfully' });
    } catch (emailError: any) {
      console.error('Email send error:', emailError);
      res.status(500).json({ success: false, error: 'Failed to send email' });
    }
  } catch (error: any) {
    console.error('Error sending email notification:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
};
