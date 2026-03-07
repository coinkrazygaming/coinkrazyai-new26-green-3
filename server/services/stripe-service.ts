import Stripe from 'stripe';

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripe = new Stripe(apiKey);
  }
  return stripe;
}

export class StripeService {
  static async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    playerId: number,
    metadata: Record<string, string> = {}
  ) {
    try {
      const stripeClient = getStripe();
      const intent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        metadata: {
          playerId: String(playerId),
          ...metadata,
        },
      });
      return { success: true, clientSecret: intent.client_secret, intentId: intent.id };
    } catch (error) {
      console.error('Stripe payment intent error:', error);
      return { success: false, error: String(error) };
    }
  }

  static async retrievePaymentIntent(intentId: string) {
    try {
      const stripeClient = getStripe();
      const intent = await stripeClient.paymentIntents.retrieve(intentId);
      return intent;
    } catch (error) {
      console.error('Stripe retrieve intent error:', error);
      throw error;
    }
  }

  static async createRefund(paymentIntentId: string, amount?: number) {
    try {
      const stripeClient = getStripe();
      const refund = await stripeClient.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });
      return { success: true, refundId: refund.id };
    } catch (error) {
      console.error('Stripe refund error:', error);
      return { success: false, error: String(error) };
    }
  }

  static async createCustomer(email: string, name: string, playerId: number) {
    try {
      const stripeClient = getStripe();
      const customer = await stripeClient.customers.create({
        email,
        name,
        metadata: { playerId: String(playerId) },
      });
      return { success: true, customerId: customer.id };
    } catch (error) {
      console.error('Stripe customer creation error:', error);
      return { success: false, error: String(error) };
    }
  }

  static async createCharge(
    customerId: string,
    amount: number,
    currency: string = 'usd'
  ) {
    try {
      const stripeClient = getStripe();
      const charge = await stripeClient.charges.create({
        amount: Math.round(amount * 100),
        currency,
        customer: customerId,
      });
      return { success: true, chargeId: charge.id };
    } catch (error) {
      console.error('Stripe charge error:', error);
      return { success: false, error: String(error) };
    }
  }

  static async getBalance() {
    try {
      const stripeClient = getStripe();
      const balance = await stripeClient.balance.retrieve();
      return balance;
    } catch (error) {
      console.error('Stripe balance error:', error);
      throw error;
    }
  }

  static async verifyWebhookSignature(body: string, signature: string) {
    try {
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!secret) {
        throw new Error('STRIPE_WEBHOOK_SECRET not set');
      }
      const stripeClient = getStripe();
      return stripeClient.webhooks.constructEvent(body, signature, secret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw error;
    }
  }

  static async createCheckoutSession(
    playerId: number,
    packId: number,
    pack: { title: string; price_usd: number; gold_coins: number; sweeps_coins: number },
    baseUrl: string
  ) {
    try {
      console.log('[Stripe] Creating checkout session for:', { playerId, packId, title: pack.title, price: pack.price_usd });
      const stripeClient = getStripe();

      const session = await stripeClient.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: pack.title,
                description: `${pack.gold_coins.toLocaleString()} Gold Coins + ${pack.sweeps_coins.toFixed(2)} Sweeps Coins`,
              },
              unit_amount: Math.round(pack.price_usd * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/wallet?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/store?canceled=true`,
        metadata: {
          playerId: String(playerId),
          packId: String(packId),
          goldCoins: String(pack.gold_coins),
          sweepsCoins: String(pack.sweeps_coins),
        },
      });

      console.log('[Stripe] Checkout session created:', { sessionId: session.id, url: session.url ? 'generated' : 'missing' });
      return { success: true, checkoutUrl: session.url, sessionId: session.id };
    } catch (error: any) {
      const errorMessage = error?.message || error?.error?.message || String(error);
      console.error('[Stripe] Checkout session error:', { message: errorMessage, error });
      return { success: false, error: errorMessage };
    }
  }

  static async handlePaymentSuccess(sessionId: string) {
    try {
      const stripeClient = getStripe();
      const session = await stripeClient.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === 'paid') {
        const playerId = parseInt(session.metadata?.playerId || '0');
        const packId = parseInt(session.metadata?.packId || '0');
        const gcAmount = parseFloat(session.metadata?.goldCoins || '0');
        const scAmount = parseFloat(session.metadata?.sweepsCoins || '0');
        const amountUsd = (session.amount_total || 0) / 100;

        if (playerId && packId) {
          const { recordPurchase, recordWalletTransaction } = await import('../db/queries');
          const { WalletService } = await import('./wallet-service');
          const { NotificationService } = await import('./notification-service');

          // Record purchase
          await recordPurchase(playerId, packId, amountUsd, gcAmount, scAmount, session.id);

          // Check for pending referral and complete it
          try {
            const { query: dbQuery } = await import('../db/connection');
            const pendingReferral = await dbQuery(
              'SELECT id FROM referral_claims WHERE referred_player_id = $1 AND status = \'pending\'',
              [playerId]
            );

            if (pendingReferral.rows.length > 0) {
              const { handleCompleteReferralClaim } = await import('../routes/referral-system');
              // We need a mock req/res or just extract the logic
              const claimId = pendingReferral.rows[0].id;

              // Direct DB call to complete instead of route handler for service context
              const { completeReferralClaim, recordWalletTransaction: recordTx } = await import('../db/queries');
              const { emailService } = await import('./email-service');

              const completedResult = await completeReferralClaim(claimId);
              const claim = completedResult.rows[0];

              if (claim && claim.status === 'completed') {
                await recordTx(
                  claim.referrer_id,
                  'ReferralBonus',
                  claim.referral_bonus_gc,
                  claim.referral_bonus_sc,
                  `Referral bonus for inviting player ${playerId}`
                );

                // Notify referrer
                const referrerRes = await dbQuery('SELECT email, name, username FROM players WHERE id = $1', [claim.referrer_id]);
                if (referrerRes.rows.length > 0) {
                  await emailService.sendReferralCompletedNotification(
                    referrerRes.rows[0].email,
                    referrerRes.rows[0].name || referrerRes.rows[0].username,
                    claim.referral_bonus_sc,
                    claim.referral_bonus_gc
                  );
                }
                console.log(`[Referral] Completed referral claim ${claimId} for player ${playerId}`);
              }
            }
          } catch (refError) {
            console.warn('[Referral] Failed to complete referral during purchase:', refError);
          }

          // Update wallet
          const result = await recordWalletTransaction(
            playerId,
            'Store Purchase',
            gcAmount,
            scAmount,
            `Purchased ${session.metadata?.goldCoins} GC + ${session.metadata?.sweepsCoins} SC`
          );

          // Notify wallet update
          WalletService.notifyWalletUpdate(playerId, {
            goldCoins: result.rows[0].gc_balance_after,
            sweepsCoins: result.rows[0].sc_balance_after
          } as any);

          // Send notification
          const { query } = await import('../db/connection');
          const playerEmailResult = await query('SELECT email FROM players WHERE id = $1', [playerId]);
          if (playerEmailResult.rows.length > 0) {
            NotificationService.notifyPurchase(
              playerId,
              playerEmailResult.rows[0].email,
              amountUsd,
              'USD',
              `Coin Pack: ${gcAmount} GC + ${scAmount} SC`
            );
          }
        }
      }
      return { success: true };
    } catch (error) {
      console.error('Stripe handle success error:', error);
      return { success: false, error: String(error) };
    }
  }

  static async handlePaymentFailure(sessionId: string) {
    console.log(`Payment failed or expired for session: ${sessionId}`);
    return { success: true };
  }
}
