case 'checkout.session.completed': {
  const session = event.data.object;
  const user_id = session.metadata?.user_id;
  const plan = session.metadata?.plan;

  if (user_id && plan) {
    // ===== جيب الـ Subscription ID من الـ Session =====
    const subscription_id = session.subscription; // Stripe Subscription ID

    await supabase
      .from('profiles')
      .update({
        plan: plan,
        stripe_subscription_id: subscription_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id);

    console.log(`✅ User ${user_id} upgraded to ${plan} (Subscription: ${subscription_id})`);
  }
  break;
}

case 'customer.subscription.deleted': {
  const subscription = event.data.object;
  const user_id = subscription.metadata?.user_id;

  if (user_id) {
    await supabase
      .from('profiles')
      .update({
        plan: 'free',
        stripe_subscription_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id);

    console.log(`⬇️ User ${user_id} downgraded to free`);
  }
  break;
}
