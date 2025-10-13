import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { postId, actorId, reason } = await request.json()

    if (!postId || !actorId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Update the post to mark it as safety approved
    const { error } = await supabase
      .from('posts')
      .update({
        safety_checked: true,
        is_safety_approved: true,
        moderation_notes: reason,
        moderated_by: actorId,
        moderated_at: new Date().toISOString()
      })
      .eq('id', postId)

    if (error) {
      console.error('Error approving post:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in approve API:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}