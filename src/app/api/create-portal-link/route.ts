import { stripe } from '@/lib/stripe';
import { createOrRetrieveCustomer } from '@/lib/stripe/adminTasks';
import { getURL } from '@/lib/utils';
import { createClient } from '@/util/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
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

    if (!customer) {
      throw new Error('Could not retrieve customer');
    }

    const { url } = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${getURL()}/dashboard`,
    });

    return NextResponse.json({ url });
  } catch (error: any) {
    console.log('Stripe Portal Error:', error.message);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}