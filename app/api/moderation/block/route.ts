import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { postId, actorId, reason, ageRestrict } = await request.json()

    if (!postId || !actorId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Update the post to mark it as blocked or age restricted
    const updateData = {
      safety_checked: true,
      is_safety_approved: ageRestrict ? true : false, // Age restricted posts are "approved" but flagged
      moderation_notes: reason,
      moderated_by: actorId,
      moderated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)

    if (error) {
      console.error('Error blocking post:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in block API:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}