const Stripe = require('stripe');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK once
if (!admin.apps.length) {
  const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (keyJson) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(keyJson)),
    });
  } else {
    // Fallback: application default credentials (works on GCP/Cloud Run)
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
}

const db = admin.firestore();

// Read raw body before Vercel's body parser runs
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ error: 'Stripe env vars not configured' });
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];

  let rawBody;
  try {
    rawBody = await getRawBody(req);
  } catch (err) {
    return res.status(400).send('Could not read request body');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (userId) {
          await db.collection('users').doc(userId).update({
            plan: 'pro',
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        // Re-activate pro if subscription becomes active again
        if (subscription.status === 'active') {
          const snapshot = await db
            .collection('users')
            .where('stripeCustomerId', '==', subscription.customer)
            .get();
          await Promise.all(
            snapshot.docs.map((d) => d.ref.update({ plan: 'pro', stripeSubscriptionId: subscription.id }))
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const snapshot = await db
          .collection('users')
          .where('stripeCustomerId', '==', subscription.customer)
          .get();
        await Promise.all(
          snapshot.docs.map((d) => d.ref.update({ plan: 'free', stripeSubscriptionId: null }))
        );
        break;
      }

      case 'invoice.payment_failed': {
        // Optional: notify or flag the user — no plan change needed here
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: 'Internal handler error' });
  }

  return res.status(200).json({ received: true });
}

// Disable Vercel's automatic body parser so we can read the raw body
handler.config = { api: { bodyParser: false } };

module.exports = handler;
