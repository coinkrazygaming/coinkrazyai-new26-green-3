import { RequestHandler } from "express";
import * as dbQueries from "../db/queries";
import { query } from "../db/connection";
import { StripeService } from "../services/stripe-service";
import { storeService } from "../services/store-service";

// Get available coin packs
export const handleGetPacks: RequestHandler = async (req, res) => {
  try {
    console.log('[Store] handleGetPacks called');

    // Get packages from store service (includes admin-created packages)
    const packs = await storeService.getActivePackages();

    console.log('[Store] getActivePackages returned:', {
      count: packs.length,
      packages: packs.map(p => ({ id: p.id, title: p.title, enabled: p.enabled, display_order: p.display_order }))
    });

    res.json({
      success: true,
      data: packs
    });
  } catch (error) {
    console.error('[Store] Get packs error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[Store] Full error details:', errorMessage, errorStack);
    res.status(500).json({
      success: false,
      error: 'Failed to get packs',
      details: errorMessage
    });
  }
};

// Purchase a coin pack
export const handlePurchase: RequestHandler = async (req, res) => {
  try {
    console.log('[Store] handlePurchase called with body:', req.body);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { packId, pack_id, payment_method } = req.body;
    const packageId = packId || pack_id;

    if (!packageId) {
      return res.status(400).json({
        success: false,
        error: 'Pack ID required'
      });
    }

    console.log('[Store] Processing purchase for pack:', packageId, 'player:', req.user.playerId);

    // Get pack details
    const packResult = await query(
      'SELECT * FROM store_packs WHERE id = $1 AND enabled = true',
      [packageId]
    );

    if (packResult.rows.length === 0) {
      console.log('[Store] Pack not found:', packageId);
      return res.status(404).json({
        success: false,
        error: 'Pack not found'
      });
    }

    const pack = packResult.rows[0];
    console.log('[Store] Found pack:', { id: pack.id, title: pack.title, price_usd: pack.price_usd });

    // Get the base URL from the request or environment
    const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
    console.log('[Store] Using base URL:', baseUrl);

    // Create Stripe checkout session
    const checkoutResult = await StripeService.createCheckoutSession(
      req.user.playerId,
      packageId,
      {
        title: pack.title,
        price_usd: pack.price_usd,
        gold_coins: pack.gold_coins,
        sweeps_coins: pack.sweeps_coins || 0
      },
      baseUrl
    );

    console.log('[Store] Stripe checkout result:', { success: checkoutResult.success, hasUrl: !!checkoutResult.checkoutUrl });

    if (!checkoutResult.success) {
      const errorMsg = typeof checkoutResult.error === 'string' ? checkoutResult.error : String(checkoutResult.error);
      console.error('[Store] Checkout failed:', errorMsg);
      return res.status(400).json({
        success: false,
        error: errorMsg
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Checkout session created',
        checkoutUrl: checkoutResult.checkoutUrl,
        sessionId: checkoutResult.sessionId
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Store] Purchase error:', { message: errorMessage, error });
    res.status(500).json({
      success: false,
      error: errorMessage || 'Failed to process purchase'
    });
  }
};

// Get purchase history for player
export const handleGetPurchaseHistory: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const result = await dbQueries.getPurchaseHistory(req.user.playerId, limit);

    const history = result.rows.map(row => ({
      id: row.id,
      pack_title: row.pack_title,
      amount_usd: row.amount_usd,
      gold_coins: row.gold_coins,
      sweeps_coins: row.sweeps_coins,
      status: row.status,
      created_at: row.created_at
    }));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('[Store] Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get purchase history'
    });
  }
};

// ===== ADMIN ROUTES =====

// Update pack (admin)
export const handleUpdatePack: RequestHandler = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { pack_id, title, description, price_usd, gold_coins, sweeps_coins, bonus_percentage, is_popular, is_best_value } = req.body;

    if (!pack_id) {
      return res.status(400).json({
        success: false,
        error: 'Pack ID required'
      });
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (price_usd !== undefined) {
      updates.push(`price_usd = $${paramIndex++}`);
      values.push(price_usd);
    }
    if (gold_coins !== undefined) {
      updates.push(`gold_coins = $${paramIndex++}`);
      values.push(gold_coins);
    }
    if (sweeps_coins !== undefined) {
      updates.push(`sweeps_coins = $${paramIndex++}`);
      values.push(sweeps_coins);
    }
    if (bonus_percentage !== undefined) {
      updates.push(`bonus_percentage = $${paramIndex++}`);
      values.push(bonus_percentage);
    }
    if (is_popular !== undefined) {
      updates.push(`is_popular = $${paramIndex++}`);
      values.push(is_popular);
    }
    if (is_best_value !== undefined) {
      updates.push(`is_best_value = $${paramIndex++}`);
      values.push(is_best_value);
    }

    updates.push(`updated_at = NOW()`);
    values.push(pack_id);

    if (updates.length <= 1) {
      return res.status(400).json({
        success: false,
        error: 'No updates provided'
      });
    }

    const result = await query(
      `UPDATE store_packs SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pack not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[Store] Update pack error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update pack'
    });
  }
};

// Add new pack (admin)
export const handleAddPack: RequestHandler = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { title, description, price_usd, gold_coins, sweeps_coins, bonus_percentage, is_popular, is_best_value, position } = req.body;

    if (!title || price_usd === undefined || gold_coins === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, price_usd, gold_coins'
      });
    }

    const result = await query(
      `INSERT INTO store_packs (title, description, price_usd, gold_coins, sweeps_coins, bonus_percentage, is_popular, is_best_value, enabled, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
       RETURNING *`,
      [title, description || null, price_usd, gold_coins, sweeps_coins || 0, bonus_percentage || 0, is_popular || false, is_best_value || false, position || 0]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[Store] Add pack error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add pack'
    });
  }
};

// Delete pack (admin)
export const handleDeletePack: RequestHandler = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { pack_id } = req.body;

    if (!pack_id) {
      return res.status(400).json({
        success: false,
        error: 'Pack ID required'
      });
    }

    const result = await query(
      'UPDATE store_packs SET enabled = false WHERE id = $1 RETURNING *',
      [pack_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pack not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[Store] Delete pack error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete pack'
    });
  }
};

// Stripe webhook handler
export const handleStripeWebhook: RequestHandler = async (req, res) => {
  try {
    // Get the Stripe signature from headers
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing stripe-signature header'
      });
    }

    // Verify webhook signature
    const event = await StripeService.verifyWebhookSignature(
      JSON.stringify(req.body),
      signature
    );

    if (!event) {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    console.log('[Store] Stripe webhook received:', event.type);

    // Handle different Stripe event types
    switch (event.type) {
      case 'checkout.session.completed':
        {
          const session = event.data.object as any;
          await StripeService.handlePaymentSuccess(session.id);
          console.log('[Store] Payment successful for session:', session.id);
          break;
        }

      case 'checkout.session.expired':
        {
          const session = event.data.object as any;
          await StripeService.handlePaymentFailure(session.id);
          console.log('[Store] Payment expired for session:', session.id);
          break;
        }

      case 'charge.failed':
        {
          const charge = event.data.object as any;
          if (charge.metadata?.playerId) {
            console.log('[Store] Charge failed for player:', charge.metadata.playerId);
          }
          break;
        }

      default:
        console.log('[Store] Unhandled Stripe event type:', event.type);
    }

    // Return 200 OK to acknowledge receipt
    res.status(200).json({
      success: true,
      received: true
    });
  } catch (error) {
    console.error('[Store] Webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
};

// Square webhook handler
export const handleSquareWebhook: RequestHandler = async (req, res) => {
  try {
    console.log('[Store] Square webhook received:', req.body);

    // Verify Square webhook signature
    const signature = req.headers['x-square-hmac-sha256'] as string;
    const squareWebhookUrl = process.env.SQUARE_WEBHOOK_URL || `${req.protocol}://${req.get('host')}/api/store/webhook/square`;

    if (!signature) {
      console.warn('[Store] Square webhook: Missing x-square-hmac-sha256 header');
      return res.status(400).json({
        success: false,
        error: 'Missing webhook signature'
      });
    }

    const squareSigningKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    if (!squareSigningKey) {
      console.warn('[Store] Square webhook: Missing SQUARE_WEBHOOK_SIGNATURE_KEY environment variable');
      // In development, accept anyway
      if (process.env.NODE_ENV !== 'development') {
        return res.status(400).json({
          success: false,
          error: 'Webhook signature verification not configured'
        });
      }
    }

    // Verify signature if key is configured
    if (squareSigningKey) {
      const crypto = require('crypto');
      const webhookBody = JSON.stringify(req.body);
      const payload = squareWebhookUrl + webhookBody;
      const hash = crypto
        .createHmac('sha256', squareSigningKey)
        .update(payload)
        .digest('base64');

      if (hash !== signature) {
        console.error('[Store] Square webhook signature verification failed');
        return res.status(403).json({
          success: false,
          error: 'Invalid webhook signature'
        });
      }
    }

    const event = req.body;
    console.log('[Store] Square webhook event type:', event.type);

    // Handle different Square event types
    switch (event.type) {
      case 'payment.created':
      case 'payment.updated':
        {
          const payment = event.data?.object?.payment;
          if (payment?.status === 'COMPLETED') {
            // Process successful payment
            const orderId = payment.metadata?.order_id || payment.id;
            console.log('[Store] Square payment completed:', orderId);
            // TODO: Update player balance based on payment metadata
          }
          break;
        }

      case 'refund.created':
        {
          const refund = event.data?.object?.refund;
          console.log('[Store] Square refund processed:', refund?.id);
          // TODO: Handle refund processing
          break;
        }

      default:
        console.log('[Store] Unhandled Square event type:', event.type);
    }

    // Return 200 OK to acknowledge receipt
    res.status(200).json({ success: true, received: true });
  } catch (error) {
    console.error('[Store] Square webhook error:', error);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
};
