// Supabase Edge Function: Send SpinON Notifications
// Deploy with: supabase functions deploy send-notifications

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationToken {
  user_id: string
  fid: number
  notification_url: string
  notification_token: string
  is_active: boolean
}

interface NotificationPayload {
  notificationId: string
  title: string
  body: string
  targetUrl: string
  tokens: string[]
}

// Notification messages
const NOTIFICATION_MESSAGES = [
  {
    title: '🎰 Çark Çevirme Zamanı!',
    body: 'Bugün şansını denedin mi? Hemen spin yap ve kazan!'
  },
  {
    title: '🎯 Şansını Dene!',
    body: 'SpinON çarkı seni bekliyor. Hemen gir ve kazan!'
  },
  {
    title: '💰 Günlük Şans!',
    body: 'Bugünkü şans çarkını çevirmeyi unutma!'
  },
  {
    title: '🔥 Spin Zamanı!',
    body: 'Base üzerinde çark çevir, USDC kazan!'
  },
  {
    title: '🎲 Hazır mısın?',
    body: 'SpinON seni bekliyor! Çarkı çevir, kazanmaya başla!'
  }
]

function getRandomMessage() {
  return NOTIFICATION_MESSAGES[Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)]
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all active notification tokens
    const { data: tokens, error: fetchError } = await supabase
      .from('notification_tokens')
      .select('*')
      .eq('is_active', true)

    if (fetchError) {
      throw new Error(`Failed to fetch tokens: ${fetchError.message}`)
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active tokens found', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${tokens.length} active notification tokens`)

    // Group tokens by notification URL (usually same for all Farcaster users)
    const tokensByUrl: Record<string, NotificationToken[]> = {}
    for (const token of tokens as NotificationToken[]) {
      if (!tokensByUrl[token.notification_url]) {
        tokensByUrl[token.notification_url] = []
      }
      tokensByUrl[token.notification_url].push(token)
    }

    let totalSent = 0
    let totalFailed = 0
    const results: any[] = []

    // Send notifications to each URL endpoint
    for (const [url, userTokens] of Object.entries(tokensByUrl)) {
      const message = getRandomMessage()
      
      // Farcaster allows sending to multiple tokens in one request
      const payload: NotificationPayload = {
        notificationId: generateUUID(),
        title: message.title,
        body: message.body,
        targetUrl: 'https://www.spinon.xyz',
        tokens: userTokens.map(t => t.notification_token)
      }

      try {
        console.log(`Sending notification to ${userTokens.length} users via ${url}`)
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        const responseData = await response.json().catch(() => ({}))
        
        if (response.ok) {
          totalSent += userTokens.length
          results.push({
            url,
            success: true,
            count: userTokens.length,
            response: responseData
          })
          console.log(`Successfully sent to ${userTokens.length} users`)
        } else {
          totalFailed += userTokens.length
          results.push({
            url,
            success: false,
            count: userTokens.length,
            error: responseData
          })
          console.error(`Failed to send: ${JSON.stringify(responseData)}`)
          
          // Deactivate invalid tokens if specified in response
          if (responseData.invalidTokens && Array.isArray(responseData.invalidTokens)) {
            for (const invalidToken of responseData.invalidTokens) {
              await supabase
                .from('notification_tokens')
                .update({ is_active: false })
                .eq('notification_token', invalidToken)
            }
            console.log(`Deactivated ${responseData.invalidTokens.length} invalid tokens`)
          }
        }
      } catch (sendError) {
        totalFailed += userTokens.length
        results.push({
          url,
          success: false,
          count: userTokens.length,
          error: sendError.message
        })
        console.error(`Error sending to ${url}: ${sendError.message}`)
      }
    }

    // Log notification history
    await supabase
      .from('notification_history')
      .insert({
        total_sent: totalSent,
        total_failed: totalFailed,
        message: getRandomMessage().title,
        results: results
      })
      .catch(e => console.log('Could not log history:', e))

    return new Response(
      JSON.stringify({
        success: true,
        sent: totalSent,
        failed: totalFailed,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

