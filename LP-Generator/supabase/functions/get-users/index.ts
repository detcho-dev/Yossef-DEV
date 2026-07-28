import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ===== 1. جيب كل المستخدمين من auth.users =====
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email, raw_user_meta_data, created_at, last_sign_in_at, confirmed_at')

    if (usersError) throw usersError

    // ===== 2. جيب الخطط من profiles =====
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, plan')

    if (profilesError) throw profilesError

    // ===== 3. جيب عدد المواقع لكل مستخدم =====
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('user_id')

    if (sitesError) throw sitesError

    // ===== دمج البيانات =====
    const userMap: Record<string, any> = {}

    users.forEach((user: any) => {
      userMap[user.id] = {
        id: user.id,
        email: user.email,
        name: user.raw_user_meta_data?.full_name || user.email?.split('@')[0] || 'Unknown',
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at,
        confirmed: user.confirmed_at ? true : false,
        plan: 'free',
        sites_count: 0
      }
    })

    profiles.forEach((profile: any) => {
      if (userMap[profile.id]) {
        userMap[profile.id].plan = profile.plan || 'free'
      }
    })

    // حساب عدد المواقع لكل مستخدم
    const siteCount: Record<string, number> = {}
    sites.forEach((site: any) => {
      siteCount[site.user_id] = (siteCount[site.user_id] || 0) + 1
    })

    Object.keys(siteCount).forEach(userId => {
      if (userMap[userId]) {
        userMap[userId].sites_count = siteCount[userId]
      }
    })

    const usersList = Object.values(userMap)

    return new Response(
      JSON.stringify({ users: usersList }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
