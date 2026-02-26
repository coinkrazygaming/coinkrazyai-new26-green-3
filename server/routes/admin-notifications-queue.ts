import { RequestHandler } from "express";
import { query } from "../db/connection";
import { emitAIEvent } from "../socket";

// Create a notification in the queue
export const createAdminNotification: RequestHandler = async (req, res) => {
  try {
    const {
      type,
      subject,
      description,
      related_game_id,
      related_player_id,
      related_document_id,
      related_withdrawal_id,
      ai_employee_name,
      data,
      priority,
    } = req.body;

    const created_by = ai_employee_name || "system";

    const result = await query(
      `INSERT INTO admin_notifications_queue 
       (type, subject, description, related_game_id, related_player_id, 
        related_document_id, related_withdrawal_id, ai_employee_name, data, priority, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        type,
        subject,
        description,
        related_game_id || null,
        related_player_id || null,
        related_document_id || null,
        related_withdrawal_id || null,
        ai_employee_name || null,
        data ? JSON.stringify(data) : null,
        priority || "normal",
        created_by,
      ]
    );

    // Emit real-time update
    emitAIEvent("admin_notification_created", {
      notification: result.rows[0],
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all notifications with optional filtering
export const getAdminNotifications: RequestHandler = async (req, res) => {
  try {
    const { type, status, ai_employee, limit = 50, offset = 0 } = req.query;

    let whereClause = "1=1";
    const params: any[] = [];
    let paramIndex = 1;

    if (type) {
      whereClause += ` AND type = $${paramIndex++}`;
      params.push(type);
    }
    if (status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    if (ai_employee) {
      whereClause += ` AND ai_employee_name = $${paramIndex++}`;
      params.push(ai_employee);
    }

    whereClause += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit);
    params.push(offset);

    const result = await query(
      `SELECT * FROM admin_notifications_queue WHERE ${whereClause}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) as count FROM admin_notifications_queue WHERE ${whereClause.replace(
        /LIMIT.*OFFSET.*/,
        ""
      )}`,
      params.slice(0, -2)
    );

    res.json({
      success: true,
      data: result.rows,
      total: countResult.rows[0].count,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get a specific notification
export const getAdminNotification: RequestHandler = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await query(
      `SELECT * FROM admin_notifications_queue WHERE id = $1`,
      [notificationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update notification status (approve, deny, etc.)
export const updateAdminNotification: RequestHandler = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { status, data } = req.body;

    const result = await query(
      `UPDATE admin_notifications_queue
       SET status = COALESCE($1, status),
           data = CASE WHEN $2::jsonb IS NOT NULL THEN $2::jsonb ELSE data END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status || null, data ? JSON.stringify(data) : null, notificationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }

    // Emit real-time update
    emitAIEvent("admin_notification_updated", {
      notificationId,
      newStatus: status,
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Approve a notification (handle game approval, KYC approval, etc.)
export const approveAdminNotification: RequestHandler = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { action_details } = req.body;

    // Get the notification to understand what to approve
    const notification = await query(
      `SELECT * FROM admin_notifications_queue WHERE id = $1`,
      [notificationId]
    );

    if (notification.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }

    const notif = notification.rows[0];

    // Handle different notification types
    if (notif.type === "new_games_ready") {
      // Update games to active/approved
      if (notif.related_game_id) {
        await query(`UPDATE games SET is_active = true WHERE id = $1`, [
          notif.related_game_id,
        ]);
      }
    } else if (notif.type === "kyc_document_submitted") {
      // Approve KYC
      if (notif.related_player_id) {
        await query(
          `UPDATE players SET kyc_verified = true, kyc_verified_date = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [notif.related_player_id]
        );
      }
    } else if (notif.type === "withdrawal_request") {
      // Process withdrawal
      // This would integrate with payment processing
    }

    // Update notification status
    const result = await query(
      `UPDATE admin_notifications_queue
       SET status = 'approved',
           data = jsonb_set(data, '{approval}', $1::jsonb),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify({ approved_at: new Date(), details: action_details }), notificationId]
    );

    emitAIEvent("admin_notification_approved", {
      notificationId,
      type: notif.type,
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Deny a notification
export const denyAdminNotification: RequestHandler = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { reason } = req.body;

    const result = await query(
      `UPDATE admin_notifications_queue
       SET status = 'denied',
           data = jsonb_set(data, '{denial}', $1::jsonb),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify({ denied_at: new Date(), reason }), notificationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }

    emitAIEvent("admin_notification_denied", {
      notificationId,
      reason,
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get notifications by type (for different sections)
export const getNotificationsByType: RequestHandler = async (req, res) => {
  try {
    const { type } = req.params;
    const { status } = req.query;

    let query_str = `SELECT * FROM admin_notifications_queue WHERE type = $1`;
    const params: any[] = [type];

    if (status) {
      query_str += ` AND status = $2`;
      params.push(status);
    }

    query_str += ` ORDER BY priority DESC, created_at DESC`;

    const result = await query(query_str, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Bulk update notifications
export const bulkUpdateAdminNotifications: RequestHandler = async (req, res) => {
  try {
    const { notification_ids, status } = req.body;

    if (!notification_ids || notification_ids.length === 0) {
      return res.status(400).json({ success: false, error: "No notifications to update" });
    }

    const placeholders = notification_ids.map((_, i) => `$${i + 1}`).join(",");

    const result = await query(
      `UPDATE admin_notifications_queue
       SET status = $${notification_ids.length + 1},
           updated_at = CURRENT_TIMESTAMP
       WHERE id IN (${placeholders})
       RETURNING id`,
      [...notification_ids, status]
    );

    res.json({
      success: true,
      updated_count: result.rows.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
