// supabase/functions/create-checkout-session/index.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
const stripeApi = 'https://api.stripe.com/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { plan, user_id, email } = await req.json();

    const priceIds = {
      pro: Deno.env.get('STRIPE_PRICE_PRO') || '',
      business: Deno.env.get('STRIPE_PRICE_BUSINESS') || '',
    };

    const priceId = priceIds[plan];
    if (!priceId) throw new Error('Invalid plan');

    // ===== Call Stripe API =====
    const body = new URLSearchParams({
      'payment_method_types[]': 'card',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'mode': 'subscription',
      'success_url': `${Deno.env.get('SITE_URL')}plans.html?success=true`,
      'cancel_url': `${Deno.env.get('SITE_URL')}plans.html?canceled=true`,
      'client_reference_id': user_id,
      'metadata[user_id]': user_id,
      'metadata[plan]': plan,
      'customer_email': email,
    });

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
