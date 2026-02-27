import { RequestHandler } from 'express';
import * as dbQueries from '../db/queries';
import { emailService } from '../services/email-service';

export const handleSendMessage: RequestHandler = async (req, res) => {
  try {
    const senderId = req.user?.id;
    const { recipientId, adminId, subject, message, messageType } = req.body;

    if (!senderId) return res.status(401).json({ error: 'Unauthorized' });
    if (!message) return res.status(400).json({ error: 'Message is required' });

    if (!recipientId && !adminId) {
      return res.status(400).json({ error: 'Recipient (player or admin) is required' });
    }

    const result = await dbQueries.sendUserMessage(
      senderId,
      recipientId || null,
      adminId || null,
      subject || 'No Subject',
      message,
      messageType || 'general'
    );

    const sentMessage = result.rows[0];

    // If sent to a player (from an admin), send email notification
    if (recipientId) {
      try {
        const playerResult = await dbQueries.getPlayerById(recipientId);
        if (playerResult.rows.length > 0) {
          const player = playerResult.rows[0];
          await emailService.sendSupportMessageNotification(
            player.email,
            player.name || player.username,
            message.substring(0, 100)
          );
        }
      } catch (emailError) {
        console.error('Failed to send message notification email:', emailError);
      }
    }

    res.json(sentMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const handleGetMessages: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await dbQueries.getUserMessages(userId, limit);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const handleGetUnreadMessages: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) return res.json([]);

    const result = await dbQueries.getUnreadMessages(userId);
    res.json(result.rows || []);
  } catch (error) {
    // Non-critical feature, return empty array on error
    console.debug('Error fetching unread messages (non-critical):', error instanceof Error ? error.message : 'Unknown error');
    res.json([]);
  }
};

export const handleMarkMessageAsRead: RequestHandler = async (req, res) => {
  try {
    const { messageId } = req.body;

    if (!messageId) return res.status(400).json({ error: 'Message ID required' });

    const result = await dbQueries.markMessageAsRead(messageId);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};

export const handleGetConversation: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { otherUserId } = req.query;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!otherUserId) return res.status(400).json({ error: 'Other user ID required' });

    const result = await dbQueries.query(
      `SELECT * FROM user_messages 
       WHERE (sender_id = $1 AND recipient_id = $2) 
          OR (sender_id = $2 AND recipient_id = $1)
       ORDER BY created_at ASC`,
      [userId, otherUserId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
};

export const handleGetMessageThreads: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Get unique conversations
    const result = await dbQueries.query(
      `SELECT DISTINCT
        CASE 
          WHEN sender_id = $1 THEN recipient_id
          ELSE sender_id
        END as user_id,
        MAX(created_at) as last_message_at
       FROM user_messages
       WHERE sender_id = $1 OR recipient_id = $1
       GROUP BY user_id
       ORDER BY last_message_at DESC`,
      [userId]
    );

    // Get user details for each conversation
    const threads = [];
    for (const row of result.rows) {
      const userResult = await dbQueries.getPlayerById(row.user_id);
      if (userResult.rows.length > 0) {
        threads.push({
          userId: row.user_id,
          username: userResult.rows[0].username,
          name: userResult.rows[0].name,
          lastMessageAt: row.last_message_at
        });
      }
    }

    res.json(threads);
  } catch (error) {
    console.error('Error fetching message threads:', error);
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
};

export const handleDeleteMessage: RequestHandler = async (req, res) => {
  try {
    const { messageId } = req.body;

    if (!messageId) return res.status(400).json({ error: 'Message ID required' });

    const result = await dbQueries.query(
      `DELETE FROM user_messages WHERE id = $1 RETURNING *`,
      [messageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

export const handleGetMessageStats: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await dbQueries.query(
      `SELECT
        COUNT(*) as total_messages,
        COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread_messages,
        COUNT(DISTINCT CASE WHEN sender_id = $1 THEN recipient_id WHEN recipient_id = $1 THEN sender_id END) as total_conversations
       FROM user_messages
       WHERE sender_id = $1 OR recipient_id = $1`,
      [userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching message stats:', error);
    res.status(500).json({ error: 'Failed to fetch message stats' });
  }
};
