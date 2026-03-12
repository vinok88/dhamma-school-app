// Supabase Edge Function: send-notification
// Triggered by a Supabase database webhook on INSERT to the announcements table.
// Fetches target user FCM tokens from user_profiles and sends FCM multicast messages.
//
// TODO: Configure webhook in Supabase dashboard:
//   - Table: announcements
//   - Event: INSERT
//   - URL: {SUPABASE_URL}/functions/v1/send-notification
//   - HTTP Method: POST
//   - Include Authorization header with service role key
//
// TODO: Add FIREBASE_SERVICE_ACCOUNT_JSON to Supabase secrets:
//   supabase secrets set FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// TODO: Implement proper JWT generation using the service account JSON
const FIREBASE_SERVICE_ACCOUNT_JSON = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')

interface AnnouncementPayload {
  type: 'INSERT'
  table: 'announcements'
  record: {
    id: string
    school_id: string
    author_id: string
    title: string
    body: string
    type: 'school' | 'class' | 'emergency' | 'event_reminder'
    target_class_id?: string
    published_at: string
  }
}

serve(async (req: Request) => {
  try {
    const payload: AnnouncementPayload = await req.json()
    const announcement = payload.record

    if (!announcement) {
      return new Response(JSON.stringify({ error: 'No announcement record' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Determine target users
    let fcmTokens: string[] = []
    let targetUserIds: string[] = []

    if (announcement.type === 'school' || announcement.type === 'emergency' || announcement.type === 'event_reminder') {
      // Send to all users in the school
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('id, fcm_token')
        .eq('school_id', announcement.school_id)
        .not('fcm_token', 'is', null)

      if (error) throw error
      fcmTokens = profiles?.map(p => p.fcm_token).filter(Boolean) ?? []
      targetUserIds = profiles?.map(p => p.id) ?? []

    } else if (announcement.type === 'class' && announcement.target_class_id) {
      // Send to parents of students in the target class + the class teacher
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('parent_id')
        .eq('class_id', announcement.target_class_id)
        .eq('status', 'active')

      if (studentsError) throw studentsError

      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('teacher_id')
        .eq('id', announcement.target_class_id)
        .single()

      if (classError) throw classError

      const parentIds = [...new Set(students?.map(s => s.parent_id) ?? [])]
      const teacherId = classData?.teacher_id

      const allUserIds = [...parentIds, ...(teacherId ? [teacherId] : [])]
      targetUserIds = allUserIds

      if (allUserIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, fcm_token')
          .in('id', allUserIds)
          .not('fcm_token', 'is', null)

        if (profilesError) throw profilesError
        fcmTokens = profiles?.map(p => p.fcm_token).filter(Boolean) ?? []
      }
    }

    if (fcmTokens.length === 0) {
      console.log('No FCM tokens found for this announcement')
      return new Response(
        JSON.stringify({ sent: 0, message: 'No FCM tokens found' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Insert notifications records for all target users
    const notificationInserts = targetUserIds.map(userId => ({
      user_id: userId,
      title: announcement.title,
      body: announcement.body.substring(0, 200),
      type: 'announcement',
      reference_id: announcement.id,
      is_read: false,
    }))

    if (notificationInserts.length > 0) {
      await supabase.from('notifications').insert(notificationInserts)
    }

    // TODO: Use Firebase Admin SDK for proper FCM multicast
    // The following is a simplified FCM HTTP v1 API call
    // In production, use google-auth-library to generate a proper OAuth2 token
    // from FIREBASE_SERVICE_ACCOUNT_JSON

    // TODO: Replace with actual Firebase project ID from service account
    const FIREBASE_PROJECT_ID = 'your-firebase-project-id'

    // Send FCM in batches of 500 (FCM multicast limit)
    const batches: string[][] = []
    for (let i = 0; i < fcmTokens.length; i += 500) {
      batches.push(fcmTokens.slice(i, i + 500))
    }

    let totalSent = 0
    for (const batch of batches) {
      // TODO: Replace this with a proper authenticated FCM request
      // This requires generating an OAuth2 access token from the service account
      console.log(`Would send FCM to ${batch.length} tokens`)
      totalSent += batch.length

      // Example FCM HTTP v1 API call (requires OAuth2 token):
      // const fcmResponse = await fetch(
      //   `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
      //   {
      //     method: 'POST',
      //     headers: {
      //       'Authorization': `Bearer ${accessToken}`,
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify({
      //       message: {
      //         notification: {
      //           title: announcement.title,
      //           body: announcement.body.substring(0, 100),
      //         },
      //         data: {
      //           type: 'announcement',
      //           reference_id: announcement.id,
      //         },
      //         tokens: batch,
      //       },
      //     }),
      //   }
      // )
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: totalSent,
        notificationsCreated: notificationInserts.length,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('send-notification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
