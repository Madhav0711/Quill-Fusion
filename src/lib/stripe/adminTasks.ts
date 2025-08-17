import Stripe from 'stripe';
import { Price, Product, Subscription } from '../supabase/supabase.types';
import db from '../supabase/db';
import {
  customers,
  prices,
  products,
  subscriptions,
  users,
} from '../supabase/schema';
import { stripe } from './index';
import { eq } from 'drizzle-orm';

const toDateTime = (secs: number) => {
  const t = new Date('1970-01-01T00:00:00Z'); 
  t.setSeconds(secs);
  return t;
};

export const upsertProductRecord = async (product: Stripe.Product) => {
  const productData: Product = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
  };
  try {
    await db
      .insert(products)
      .values(productData)
      .onConflictDoUpdate({ target: products.id, set: productData });
  } catch (error) {
    console.error('🔴 DATABASE ERROR upserting product:', error);
    throw new Error(`Could not insert/update product: ${product.id}`);
  }
  console.log('Product inserted/updated:', product.id);
};

export const upsertPriceRecord = async (price: Stripe.Price) => {
  const priceData: Price = {
    id: price.id,
    productId: typeof price.product === 'string' ? price.product : null,
    active: price.active,
    currency: price.currency,
    description: price.nickname ?? null,
    type: price.type,
    unitAmount: price.unit_amount ?? null,
    interval: price.recurring?.interval ?? null,
    intervalCount: price.recurring?.interval_count ?? null,
    trialPeriodDays: price.recurring?.trial_period_days ?? null,
    metadata: price.metadata,
  };
  try {
    await db
      .insert(prices)
      .values(priceData)
      .onConflictDoUpdate({ target: prices.id, set: priceData });
  } catch (error) {
    throw new Error(`Could not insert/update price: ${price.id}`);
  }
  console.log(`Price inserted/updated: ${price.id}`);
};

export const createOrRetrieveCustomer = async ({
  email,
  uuid,
}: {
  email: string;
  uuid: string;
}) => {
  // Check if the customer already exists in your database
  const existingCustomer = await db.query.customers.findFirst({
    where: (c, { eq }) => eq(c.id, uuid),
  });
  if (existingCustomer?.stripeCustomerId) return existingCustomer.stripeCustomerId;

  // If not, create a new customer in Stripe
  const customerData: { metadata: { supabaseUUID: string }; email?: string } = {
    metadata: {
      supabaseUUID: uuid,
    },
  };
  if (email) customerData.email = email;

  const customer = await stripe.customers.create(customerData);
  
  // Insert the new customer mapping into your database
  await db
    .insert(customers)
    .values({ id: uuid, stripeCustomerId: customer.id });
  
  console.log(`New customer created and inserted for ${uuid}.`);
  return customer.id;
};

export const copyBillingDetailsToCustomer = async (
  uuid: string,
  payment_method: Stripe.PaymentMethod
) => {
  const customer = payment_method.customer as string;
  const { name, phone, address } = payment_method.billing_details;
  if (!name || !phone || !address) return;
  
  await stripe.customers.update(customer, { name, phone, address });
  
  await db
    .update(users)
    .set({
      billingAddress: { ...address },
      paymentMethod: { ...payment_method[payment_method.type] },
    })
    .where(eq(users.id, uuid));
};

export const manageSubscriptionStatusChange = async (
  subscriptionId: string,
  customerId: string,
  createAction = false
) => {
  const customerData = await db.query.customers.findFirst({
    where: (c, { eq }) => eq(c.stripeCustomerId, customerId),
  });
  
  if (!customerData) throw new Error(`Cannot find customer with stripeCustomerId: ${customerId}`);
  const { id: uuid } = customerData;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method'],
  });

  const subscriptionData: Subscription = {
    id: subscription.id,
    userId: uuid,
    metadata: subscription.metadata,
    status: subscription.status,
    priceId: subscription.items.data[0].price.id,
    quantity: subscription.items.data[0].quantity,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    cancelAt: subscription.cancel_at ? toDateTime(subscription.cancel_at).toISOString() : null,
    canceledAt: subscription.canceled_at ? toDateTime(subscription.canceled_at).toISOString() : null,
    currentPeriodStart: toDateTime(subscription.current_period_start).toISOString(),
    currentPeriodEnd: toDateTime(subscription.current_period_end).toISOString(),
    endedAt: subscription.ended_at ? toDateTime(subscription.ended_at).toISOString() : null,
    trialStart: subscription.trial_start ? toDateTime(subscription.trial_start).toISOString() : null,
    trialEnd: subscription.trial_end ? toDateTime(subscription.trial_end).toISOString() : null,
  };

  await db
    .insert(subscriptions)
    .values(subscriptionData)
    .onConflictDoUpdate({ target: subscriptions.id, set: subscriptionData });
  
  console.log(`Inserted/updated subscription [${subscription.id}] for user [${uuid}]`);

  if (createAction && subscription.default_payment_method && uuid) {
    await copyBillingDetailsToCustomer(
      uuid,
      subscription.default_payment_method as Stripe.PaymentMethod
    );
  }
};