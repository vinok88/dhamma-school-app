// Supabase Edge Function: send-notification
// Triggered by Supabase database webhooks on INSERT. Handles two source tables,
// branching on the webhook payload's `table` field:
//   - announcements → notifies the school / class audience
//   - messages      → notifies the single recipient of a new direct message
// Uses FCM HTTP v1 API with OAuth2 service account authentication (no legacy server key).
//
// Setup:
//   1. Add secret: supabase secrets set FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
//   2. In Supabase Dashboard → Database → Webhooks, create TWO webhooks that both
//      POST to {SUPABASE_URL}/functions/v1/send-notification with header
//      `Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}`:
//      - Table: announcements, Event: INSERT
//      - Table: messages,      Event: INSERT

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ServiceAccount {
  type: string
  project_id: string
  private_key_id: string
  private_key: string
  client_email: string
  token_uri: string
}

interface AnnouncementRecord {
  id: string
  school_id: string
  author_id: string
  title: string
  body: string
  type: 'school' | 'class' | 'emergency' | 'event_reminder'
  target_class_id?: string
  published_at: string
}

interface MessageRecord {
  id: string
  school_id: string
  sender_id: string
  recipient_id: string
  body: string
  created_at: string
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: AnnouncementRecord | MessageRecord
}

// ─── JWT / OAuth2 helpers ─────────────────────────────────────────────────────

/** Convert a PEM private key string to an ArrayBuffer for Web Crypto */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '')
  const binary = atob(b64)
  const buffer = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i)
  }
  return buffer.buffer
}

/** Base64url-encode an ArrayBuffer or a plain string */
function base64url(input: ArrayBuffer | string): string {
  let bytes: Uint8Array
  if (typeof input === 'string') {
    bytes = new TextEncoder().encode(input)
  } else {
    bytes = new Uint8Array(input)
  }
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Generate a short-lived OAuth2 access token from a Firebase service account.
 * Signs a JWT locally using Web Crypto (RS256), then exchanges it with Google.
 */
async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: sa.token_uri ?? 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))

  const signingInput = `${header}.${claim}`

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput),
  )

  const jwt = `${signingInput}.${base64url(signatureBuffer)}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const data = await res.json()
  if (!data.access_token) {
    throw new Error(`OAuth2 token exchange failed: ${JSON.stringify(data)}`)
  }
  return data.access_token as string
}

// ─── FCM v1 helpers ───────────────────────────────────────────────────────────

interface FcmMessage {
  title: string
  body: string
  data?: Record<string, string>
}

/**
 * Send one FCM v1 message to a single device token.
 * Returns true on success, false on invalid/unregistered token (caller should clean up).
 */
async function sendFcmToToken(
  projectId: string,
  accessToken: string,
  token: string,
  msg: FcmMessage,
): Promise<{ token: string; success: boolean; shouldRemove: boolean }> {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token,
        notification: {
          title: msg.title,
          body: msg.body,
        },
        data: msg.data ?? {},
        android: {
          priority: 'high',
          notification: { sound: 'default', channel_id: 'dhamma_school_default' },
        },
        apns: {
          payload: { aps: { sound: 'default', badge: 1 } },
        },
      },
    }),
  })

  if (res.ok) return { token, success: true, shouldRemove: false }

  const err = await res.json().catch(() => ({}))
  const errorCode = err?.error?.details?.[0]?.errorCode ?? err?.error?.status ?? ''

  // These codes mean the token is stale — remove it from user_profiles
  const staleTokenCodes = [
    'UNREGISTERED',
    'INVALID_ARGUMENT',
    'NOT_FOUND',
  ]
  const shouldRemove = staleTokenCodes.some(c => errorCode.includes(c))

  console.warn(`FCM send failed for token (${errorCode}):`, token.slice(0, 20))
  return { token, success: false, shouldRemove }
}

/**
 * Send FCM messages to a list of tokens in parallel batches.
 * Cleans up stale tokens from Supabase automatically.
 */
async function sendFcmBatch(
  projectId: string,
  accessToken: string,
  tokens: string[],
  msg: FcmMessage,
  supabase: ReturnType<typeof createClient>,
  CONCURRENCY = 50,
): Promise<{ sent: number; failed: number; removed: number }> {
  let sent = 0
  let failed = 0
  const staleTokens: string[] = []

  // Process in parallel chunks to avoid overwhelming the Edge Function
  for (let i = 0; i < tokens.length; i += CONCURRENCY) {
    const chunk = tokens.slice(i, i + CONCURRENCY)
    const results = await Promise.all(
      chunk.map(t => sendFcmToToken(projectId, accessToken, t, msg)),
    )
    for (const r of results) {
      if (r.success) sent++
      else {
        failed++
        if (r.shouldRemove) staleTokens.push(r.token)
      }
    }
  }

  // Clean up stale tokens so we don't keep sending to dead registrations
  if (staleTokens.length > 0) {
    await supabase
      .from('user_profiles')
      .update({ fcm_token: null })
      .in('fcm_token', staleTokens)
    console.log(`Removed ${staleTokens.length} stale FCM tokens`)
  }

  return { sent, failed, removed: staleTokens.length }
}

// ─── Shared dispatch ──────────────────────────────────────────────────────────

const JSON_HEADERS = { 'Content-Type': 'application/json' }

/** Obtain an access token and fan out to the given tokens. No-op for an empty list. */
async function sendPush(
  serviceAccount: ServiceAccount,
  supabase: ReturnType<typeof createClient>,
  fcmTokens: string[],
  fcmMessage: FcmMessage,
): Promise<{ sent: number; failed: number; removed: number }> {
  if (fcmTokens.length === 0) return { sent: 0, failed: 0, removed: 0 }
  const accessToken = await getAccessToken(serviceAccount)
  return await sendFcmBatch(serviceAccount.project_id, accessToken, fcmTokens, fcmMessage, supabase)
}

/** Short personal name: preferred, else first word of full name, else fallback. */
function shortName(full?: string | null, preferred?: string | null): string {
  if (preferred && preferred.trim()) return preferred.trim()
  if (full && full.trim()) return full.trim().split(/\s+/)[0]
  return 'Someone'
}

// ─── Message handler ──────────────────────────────────────────────────────────

/** Notify the single recipient of a new direct message. */
async function handleMessage(
  message: MessageRecord,
  supabase: ReturnType<typeof createClient>,
  serviceAccount: ServiceAccount,
): Promise<Response> {
  const [{ data: recipient }, { data: sender }] = await Promise.all([
    supabase.from('user_profiles').select('id, fcm_token').eq('id', message.recipient_id).single(),
    supabase
      .from('user_profiles')
      .select('full_name, preferred_name')
      .eq('id', message.sender_id)
      .single(),
  ])

  const senderName = shortName(sender?.full_name as string, sender?.preferred_name as string)
  const title = `New message from ${senderName}`

  // In-app notification row. reference_id is the *sender* so tapping opens the
  // thread with them (/messages/<sender_id>).
  await supabase.from('notifications').insert({
    user_id: message.recipient_id,
    title,
    body: message.body.substring(0, 200),
    type: 'message',
    reference_id: message.sender_id,
    is_read: false,
  })

  const fcmTokens = recipient?.fcm_token ? [recipient.fcm_token as string] : []
  const { sent, failed, removed } = await sendPush(serviceAccount, supabase, fcmTokens, {
    title,
    body: message.body.substring(0, 100),
    data: { type: 'message', reference_id: message.sender_id },
  })

  console.log(`Message push — sent: ${sent}, failed: ${failed}, stale removed: ${removed}`)
  return new Response(
    JSON.stringify({ success: true, sent, failed, staleTokensRemoved: removed, notificationsCreated: 1 }),
    { headers: JSON_HEADERS },
  )
}

// ─── Announcement handler ─────────────────────────────────────────────────────

/** Notify the school / class audience of a new announcement. */
async function handleAnnouncement(
  announcement: AnnouncementRecord,
  supabase: ReturnType<typeof createClient>,
  serviceAccount: ServiceAccount,
): Promise<Response> {
    // ── Resolve target FCM tokens ───────────────────────────────────────────

    let fcmTokens: string[] = []
    let targetUserIds: string[] = []

    if (
      announcement.type === 'school' ||
      announcement.type === 'emergency' ||
      announcement.type === 'event_reminder'
    ) {
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('id, fcm_token, role')
        .eq('school_id', announcement.school_id)
        .neq('role', 'guest')

      if (error) throw error
      const eligible = (profiles ?? []).filter((p: any) => p.id !== announcement.author_id)
      fcmTokens = eligible.map((p: any) => p.fcm_token).filter(Boolean)
      targetUserIds = eligible.map((p: any) => p.id)
    } else if (announcement.type === 'class' && announcement.target_class_id) {
      // Get student IDs in the target class, then resolve parent users via student_parents.
      const { data: classStudents, error: studentsError } = await supabase
        .from('students')
        .select('id')
        .eq('class_id', announcement.target_class_id)
        .eq('status', 'active')

      if (studentsError) throw studentsError

      const studentIds: string[] = (classStudents ?? []).map((s: any) => s.id as string)

      let parentIds: string[] = []
      if (studentIds.length > 0) {
        const { data: links, error: linksError } = await supabase
          .from('student_parents')
          .select('parent_user_id')
          .in('student_id', studentIds)
          .not('parent_user_id', 'is', null)

        if (linksError) throw linksError
        const ids = (links ?? []).map((l: any) => l.parent_user_id as string)
        parentIds = Array.from(new Set(ids))
      }

      const { data: ctRows, error: ctError } = await supabase
        .from('class_teachers')
        .select('teacher_id')
        .eq('class_id', announcement.target_class_id)

      if (ctError) throw ctError

      const teacherIds = (ctRows ?? []).map((r: any) => r.teacher_id as string)
      const allUserIds = Array.from(new Set([...parentIds, ...teacherIds]))
      targetUserIds = allUserIds

      if (allUserIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, fcm_token')
          .in('id', allUserIds)
          .not('fcm_token', 'is', null)

        if (profilesError) throw profilesError
        fcmTokens = profiles?.map((p) => p.fcm_token).filter(Boolean) ?? []
      }
    }

    // ── Insert in-app notification records ─────────────────────────────────

    if (targetUserIds.length > 0) {
      await supabase.from('notifications').insert(
        targetUserIds.map((userId) => ({
          user_id: userId,
          title: announcement.title,
          body: announcement.body.substring(0, 200),
          type: 'announcement',
          reference_id: announcement.id,
          is_read: false,
        })),
      )
    }

    // ── Send FCM messages ──────────────────────────────────────────────────

    const { sent, failed, removed } = await sendPush(serviceAccount, supabase, fcmTokens, {
      title: announcement.title,
      body: announcement.body.substring(0, 100),
      data: {
        type: 'announcement',
        reference_id: announcement.id,
        announcement_type: announcement.type,
      },
    })

    console.log(`Announcement FCM — sent: ${sent}, failed: ${failed}, stale removed: ${removed}`)

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        failed,
        staleTokensRemoved: removed,
        notificationsCreated: targetUserIds.length,
      }),
      { headers: JSON_HEADERS },
    )
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  try {
    const payload: WebhookPayload = await req.json()

    if (!payload?.record) {
      return new Response(JSON.stringify({ error: 'No record in payload' }), {
        status: 400,
        headers: JSON_HEADERS,
      })
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')

    if (!serviceAccountJson) {
      console.error('FIREBASE_SERVICE_ACCOUNT_JSON secret is not set')
      return new Response(JSON.stringify({ error: 'FCM not configured' }), {
        status: 500,
        headers: JSON_HEADERS,
      })
    }

    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountJson)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    if (payload.table === 'messages') {
      return await handleMessage(payload.record as MessageRecord, supabase, serviceAccount)
    }
    return await handleAnnouncement(payload.record as AnnouncementRecord, supabase, serviceAccount)
  } catch (error) {
    console.error('send-notification error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: JSON_HEADERS },
    )
  }
})
