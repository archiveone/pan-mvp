import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Test if tables exist
    const tests = {
      conversations: false,
      conversation_participants: false,
      messages: false,
      rpc_function: false,
    }

    // Test conversations table
    try {
      const { error } = await supabase
        .from('conversations')
        .select('id')
        .limit(1)
      
      tests.conversations = !error || error.code !== '42P01'
    } catch (e) {
      tests.conversations = false
    }

    // Test conversation_participants table
    try {
      const { error } = await supabase
        .from('conversation_participants')
        .select('id')
        .limit(1)
      
      tests.conversation_participants = !error || error.code !== '42P01'
    } catch (e) {
      tests.conversation_participants = false
    }

    // Test messages table
    try {
      const { error } = await supabase
        .from('messages')
        .select('id')
        .limit(1)
      
      tests.messages = !error || error.code !== '42P01'
    } catch (e) {
      tests.messages = false
    }

    // Test RPC function
    try {
      const { error } = await supabase
        .rpc('get_or_create_conversation', {
          p_user1_id: '00000000-0000-0000-0000-000000000000',
          p_user2_id: '00000000-0000-0000-0000-000000000001',
        })
      
      tests.rpc_function = !error || error.code !== '42883' // 42883 = function does not exist
    } catch (e) {
      tests.rpc_function = false
    }

    const allPass = Object.values(tests).every(t => t)

    return NextResponse.json({
      status: allPass ? 'ready' : 'not_ready',
      tests,
      message: allPass 
        ? '✅ All messaging tables and functions exist!' 
        : '⚠️ Some messaging components are missing. Run the migration: supabase/migrations/add_messaging_system.sql',
      migration_file: 'supabase/migrations/add_messaging_system.sql'
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      message: 'Failed to test messaging system'
    }, { status: 500 })
  }
}

