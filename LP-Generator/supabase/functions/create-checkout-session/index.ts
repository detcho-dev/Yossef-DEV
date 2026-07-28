// supabase/functions/create-checkout-session/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
const stripeApi = 'https://api.stripe.com/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { plan, user_id, email, subscription_id } = await req.json();

    const priceIds = {
      pro: Deno.env.get('STRIPE_PRICE_PRO') || '',
      business: Deno.env.get('STRIPE_PRICE_BUSINESS') || '',
    };

    const priceId = priceIds[plan];
    if (!priceId) throw new Error('Invalid plan');

    // ===== بناء الـ Session =====
    let sessionData: any = {
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${Deno.env.get('SITE_URL')}plans?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('SITE_URL')}plans?canceled=true`,
      metadata: {
        user_id: user_id,
        plan: plan,
      },
      customer_email: email,
    };

    // ===== لو عنده اشتراك قديم، نلغي الاشتراك القديم ونضيف الجديد =====
    if (subscription_id) {
      // نلغي الاشتراك القديم في Stripe
      await fetch(`${stripeApi}/subscriptions/${subscription_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        },
      });
    }

    // ===== إنشاء الـ Session =====
    const body = new URLSearchParams();
    body.append('payment_method_types[]', 'card');
    body.append('line_items[0][price]', priceId);
    body.append('line_items[0][quantity]', '1');
    body.append('mode', 'subscription');
    body.append('success_url', `${Deno.env.get('SITE_URL')}plans?success=true&session_id={CHECKOUT_SESSION_ID}`);
    body.append('cancel_url', `${Deno.env.get('SITE_URL')}plans?canceled=true`);
    body.append('metadata[user_id]', user_id);
    body.append('metadata[plan]', plan);
    body.append('customer_email', email);

    const response = await fetch(`${stripeApi}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
      body: body.toString(),
    });

    const session = await response.json();

    if (session.url) {
      return new Response(
        JSON.stringify({ url: session.url }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(session.error?.message || 'Stripe error');
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
