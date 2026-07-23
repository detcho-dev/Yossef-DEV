// supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

serve(async (req: Request) => {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature') || ''

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // ===== معالجة الأحداث =====
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const user_id = session.metadata?.user_id
      const plan = session.metadata?.plan

      console.log(`✅ Payment completed for user: ${user_id}, plan: ${plan}`)

      if (user_id && plan) {
        // تحديث خطة المستخدم
        const { error } = await supabase
          .from('profiles')
          .update({
            plan: plan,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user_id)

        if (error) {
          console.error('❌ Error updating profile:', error)
          return new Response(JSON.stringify({ error: error.message }), { status: 500 })
        }

        console.log(`✅ User ${user_id} upgraded to ${plan}`)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      const user_id = subscription.metadata?.user_id

      if (user_id) {
        await supabase
          .from('profiles')
          .update({
            plan: 'free',
            updated_at: new Date().toISOString(),
          })
          .eq('id', user_id)

        console.log(`⬇️ User ${user_id} downgraded to free`)
      }
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
