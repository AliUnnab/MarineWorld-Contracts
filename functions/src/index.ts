import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/v2/params';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import * as express from 'express';

admin.initializeApp();

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");

const app = express();

app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event: Stripe.Event;

  try {
    const stripeInstance = new Stripe(STRIPE_SECRET_KEY.value(), {
      apiVersion: '2023-10-16',
    });

    if (!STRIPE_WEBHOOK_SECRET.value()) {
      throw new Error('Stripe webhook secret is not configured.');
    }

    event = stripeInstance.webhooks.constructEvent(req.rawBody, sig!, STRIPE_WEBHOOK_SECRET.value());
  } catch (err: any) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Checkout session completed:', session.id);
      try {
        await admin.firestore().collection('pending_stripe_checkout_sessions').doc(session.id || 'unknown_session').set({
          status: 'completed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          customerId: session.customer || null,
          customerEmail: session.customer_details?.email || null,
          metadata: session.metadata || null
        }, { merge: true });
        console.log('Checkout session document written successfully for:', session.id);
      } catch (err: any) {
        console.error('Error writing checkout session to firestore:', err.message);
      }
      break;
    case 'customer.subscription.created':
      const subscriptionCreated = event.data.object as Stripe.Subscription;
      console.log('Subscription created:', subscriptionCreated.id);
      break;
    case 'customer.subscription.deleted':
      const subscriptionDeleted = event.data.object as Stripe.Subscription;
      console.log('Subscription deleted:', subscriptionDeleted.id);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export const stripeWebhook = onRequest({
  secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET]
}, app);
