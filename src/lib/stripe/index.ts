import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: undefined,
  appInfo: { name: 'Quill-Fusion', version: '0.1.0' },
});
