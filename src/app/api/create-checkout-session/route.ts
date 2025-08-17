import { stripe } from '@/lib/stripe';
import { createOrRetrieveCustomer } from '@/lib/stripe/adminTasks';
import { getURL } from '@/lib/utils';
import { createClient } from '@/util/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { price, quantity = 1, metadata = {} } = await request.json();
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const customer = await createOrRetrieveCustomer({
      email: user.email || '',
      uuid: user.id,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      customer,
      line_items: [
        {
          price: price.id,
          quantity,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      subscription_data: { metadata },
      success_url: `${getURL()}/dashboard`,
      cancel_url: `${getURL()}/dashboard`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.log("Stripe Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}