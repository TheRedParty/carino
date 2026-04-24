const express = require('express');
const router = express.Router();
const db = require('../db');

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// NOTE: this route must be mounted with express.raw({ type: 'application/json' })
// BEFORE express.json() — Stripe signature verification needs the untouched raw body.

router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).send('Webhook secret not configured');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orgId = session.metadata && session.metadata.org_id
        ? parseInt(session.metadata.org_id, 10)
        : null;

      if (!orgId) {
        console.warn('checkout.session.completed received without org_id in metadata');
        return res.json({ received: true });
      }

      // Only flip to active if still pending payment (idempotent — webhooks can retry)
      const result = await db.query(
        `UPDATE orgs
           SET status = 'active',
               stripe_payment_intent_id = $1,
               paid_at = NOW()
         WHERE id = $2
           AND status = 'pending_payment'
         RETURNING id, slug, name`,
        [session.payment_intent || null, orgId]
      );

      if (result.rows.length > 0) {
        console.log(`✓ Org #${orgId} (${result.rows[0].slug}) activated via Stripe webhook`);
      } else {
        console.log(`- Org #${orgId} already active or not in pending_payment — no change`);
      }
    } else {
      // Other event types — log but don't act
      console.log(`Received Stripe event type '${event.type}' — no handler`);
    }

    res.json({ received: true });

  } catch (err) {
    console.error('Error handling Stripe webhook:', err);
    // 500 tells Stripe to retry — that's what we want if the DB was briefly down
    res.status(500).send('Internal error processing webhook');
  }
});

module.exports = router;