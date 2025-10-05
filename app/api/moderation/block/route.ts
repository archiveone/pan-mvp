import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { postId, reason, actorId, ageRestrict } = await req.json()
    if (!postId || !actorId) return NextResponse.json({ success: false, error: 'postId and actorId required' }, { status: 400 })

    const updates: any = { 
      safety_checked: true, 
      is_safety_approved: false, 
      is_flagged: true,
      moderated_by: actorId,
      moderated_at: new Date().toISOString(),
      moderation_notes: reason || null
    }
    
    if (ageRestrict) {
      updates.moderation_status = 'age_restricted'
    } else {
      updates.moderation_status = 'rejected'
    }

    const { error: upErr } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', postId)

    if (upErr) return NextResponse.json({ success: false, error: upErr.message }, { status: 400 })

    const { error: logErr } = await supabase
      .from('moderation_actions')
      .insert({ post_id: postId, actor_id: actorId, action: ageRestrict ? 'age_restrict' : 'block', reason: reason || null })

    if (logErr) return NextResponse.json({ success: false, error: logErr.message }, { status: 400 })

    return NextResponse.json({ 
      success: true, 
      message: ageRestrict ? 'Post age-restricted successfully' : 'Post blocked successfully' 
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Block failed' }, { status: 400 })
  }
}


