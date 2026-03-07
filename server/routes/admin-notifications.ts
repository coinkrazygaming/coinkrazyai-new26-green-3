import { RequestHandler } from 'express';
import * as dbQueries from '../db/queries';
import { emitAdminNotification } from '../socket';
import { emailService } from '../services/email-service';
import { query } from '../db/connection';

export const handleCreateNotification: RequestHandler = async (req, res) => {
  try {
    const { aiEmployeeId, messageType, subject, message, relatedPlayerId, relatedGameId, priority, adminId } = req.body;
    const requestingAdminId = req.user?.id;

    if (!aiEmployeeId || !messageType || !subject || !message) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Only allow admins to create notifications (for now we assume all notified admins or system)
    const notifiedAdminId = adminId || requestingAdminId || null;

    const result = await dbQueries.createAdminNotification(
      notifiedAdminId,
      aiEmployeeId,
      messageType,
      subject,
      message,
      relatedPlayerId || null,
      relatedGameId || null,
      priority || 'medium'
    );

    const notification = result.rows[0];
    emitAdminNotification(notification);

    // Send email to admin if applicable
    try {
      let adminEmail = process.env.ADMIN_NOTIFICATIONS_EMAIL;

      if (notifiedAdminId) {
        const adminResult = await query('SELECT email FROM admin_users WHERE id = $1', [notifiedAdminId]);
        if (adminResult.rows.length > 0) {
          adminEmail = adminResult.rows[0].email;
        }
      }

      if (adminEmail) {
        await emailService.sendAdminNotification(adminEmail, notification);
      }
    } catch (e) {
      console.warn('[Admin Notifications] Failed to send email alert:', e);
    }

    res.json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
};

export const handleGetNotifications: RequestHandler = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string || null;

    if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

    let result = await dbQueries.getAdminNotifications(adminId, limit);
    
    if (status) {
      const notifications = result.rows.filter((n: any) => n.status === status);
      return res.json(notifications);
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const handleGetAllNotifications: RequestHandler = async (req, res) => {
  try {
    // Admin only - get all notifications regardless of assigned admin
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await dbQueries.getAdminNotifications(null, limit);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const handleMarkAsRead: RequestHandler = async (req, res) => {
  try {
    const { notificationId } = req.body;

    if (!notificationId) return res.status(400).json({ error: 'Notification ID required' });

    const result = await dbQueries.markAdminNotificationAsRead(notificationId);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

export const handleUpdateNotificationStatus: RequestHandler = async (req, res) => {
  try {
    const { notificationId, status, action } = req.body;
    const adminId = req.user?.id;

    if (!notificationId || !status) {
      return res.status(400).json({ error: 'Notification ID and status required' });
    }

    if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

    // Update status
    const result = await dbQueries.updateAdminNotificationStatus(notificationId, status);
    const notification = result.rows[0];

    // Record action taken
    if (action) {
      await dbQueries.recordNotificationAction(
        notificationId,
        action.type,
        action.data || {},
        adminId
      );
    }

    emitAdminNotification(notification);

    res.json({
      success: true,
      notification,
      action: action || null
    });
  } catch (error) {
    console.error('Error updating notification status:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

export const handleApproveNotification: RequestHandler = async (req, res) => {
  try {
    const { notificationId, reason } = req.body;
    const adminId = req.user?.id;

    if (!notificationId) return res.status(400).json({ error: 'Notification ID required' });
    if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await dbQueries.updateAdminNotificationStatus(notificationId, 'approved');

    await dbQueries.recordNotificationAction(
      notificationId,
      'approve',
      { approvedBy: adminId, reason },
      adminId
    );

    res.json({
      success: true,
      notification: result.rows[0],
      message: 'Notification approved'
    });
  } catch (error) {
    console.error('Error approving notification:', error);
    res.status(500).json({ error: 'Failed to approve notification' });
  }
};

export const handleDenyNotification: RequestHandler = async (req, res) => {
  try {
    const { notificationId, reason } = req.body;
    const adminId = req.user?.id;

    if (!notificationId) return res.status(400).json({ error: 'Notification ID required' });
    if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await dbQueries.updateAdminNotificationStatus(notificationId, 'denied');

    await dbQueries.recordNotificationAction(
      notificationId,
      'deny',
      { deniedBy: adminId, reason },
      adminId
    );

    res.json({
      success: true,
      notification: result.rows[0],
      message: 'Notification denied'
    });
  } catch (error) {
    console.error('Error denying notification:', error);
    res.status(500).json({ error: 'Failed to deny notification' });
  }
};

export const handleAssignNotification: RequestHandler = async (req, res) => {
  try {
    const { notificationId, assignedAiEmployee } = req.body;
    const adminId = req.user?.id;

    if (!notificationId || !assignedAiEmployee) {
      return res.status(400).json({ error: 'Notification ID and assigned AI employee required' });
    }
    if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await dbQueries.updateAdminNotificationStatus(notificationId, 'in_progress');

    await dbQueries.recordNotificationAction(
      notificationId,
      'assign',
      { assignedTo: assignedAiEmployee, assignedBy: adminId },
      adminId
    );

    res.json({
      success: true,
      notification: result.rows[0],
      message: `Notification assigned to ${assignedAiEmployee}`
    });
  } catch (error) {
    console.error('Error assigning notification:', error);
    res.status(500).json({ error: 'Failed to assign notification' });
  }
};

export const handleResolveNotification: RequestHandler = async (req, res) => {
  try {
    const { notificationId, resolution } = req.body;
    const adminId = req.user?.id;

    if (!notificationId) return res.status(400).json({ error: 'Notification ID required' });
    if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await dbQueries.updateAdminNotificationStatus(notificationId, 'completed');

    await dbQueries.recordNotificationAction(
      notificationId,
      'resolve',
      { resolvedBy: adminId, resolution },
      adminId
    );

    res.json({
      success: true,
      notification: result.rows[0],
      message: 'Notification resolved'
    });
  } catch (error) {
    console.error('Error resolving notification:', error);
    res.status(500).json({ error: 'Failed to resolve notification' });
  }
};
