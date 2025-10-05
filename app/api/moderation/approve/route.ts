import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { postId, reason, actorId } = await req.json()
    if (!postId || !actorId) return NextResponse.json({ success: false, error: 'postId and actorId required' }, { status: 400 })

    // Update post with comprehensive safety state
    const { error: upErr } = await supabase
      .from('posts')
      .update({ 
        is_safety_approved: true, 
        safety_checked: true,
        moderation_status: 'approved',
        moderated_by: actorId,
        moderated_at: new Date().toISOString(),
        moderation_notes: reason || null
      })
      .eq('id', postId)

    if (upErr) return NextResponse.json({ success: false, error: upErr.message }, { status: 400 })

    // Audit log
    const { error: logErr } = await supabase
      .from('moderation_actions')
      .insert({ post_id: postId, actor_id: actorId, action: 'approve', reason: reason || null })

    if (logErr) return NextResponse.json({ success: false, error: logErr.message }, { status: 400 })

    return NextResponse.json({ success: true, message: 'Post approved successfully' })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Approve failed' }, { status: 400 })
  }
}


