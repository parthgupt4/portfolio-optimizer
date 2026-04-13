const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe secret key not configured' });
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const { userId, email } = req.body || {};

  if (!userId || !email) {
    return res.status(400).json({ error: 'Missing userId or email' });
  }

  try {
    const origin =
      req.headers.origin ||
      (req.headers.referer ? req.headers.referer.replace(/\/[^/]*$/, '') : null) ||
      'https://atlas-allocation.vercel.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID || 'price_1TLTcJCcJefZex9D37C4pjfh',
          quantity: 1,
        },
      ],
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
      metadata: { userId },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout session error:', err);
    return res.status(500).json({ error: err.message });
  }
};
