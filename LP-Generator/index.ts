// supabase/functions/create-checkout-session/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.11.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_ANON_KEY") || "",
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { plan, user_id, email } = await req.json();

    // ===== تحديد السعر حسب الخطة =====
    const priceIds: Record<string, string> = {
      pro: Deno.env.get("STRIPE_PRICE_PRO") || "",
      business: Deno.env.get("STRIPE_PRICE_BUSINESS") || "",
    };

    const priceId = priceIds[plan];
    if (!priceId) {
      throw new Error("Invalid plan selected");
    }

    // ===== إنشاء Session =====
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${Deno.env.get("SITE_URL") || "http://localhost:3000"}/plans.html?success=true`,
      cancel_url: `${Deno.env.get("SITE_URL") || "http://localhost:3000"}/plans.html?canceled=true`,
      customer_email: email,
      metadata: {
        user_id: user_id,
        plan: plan,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
