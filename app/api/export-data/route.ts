import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all user data
    const [
      profileData,
      postsData,
      listingsData,
      messagesData,
      savedData,
      notificationsData,
      hubData
    ] = await Promise.all([
      // Profile
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single(),
      
      // Posts
      supabase
        .from('content')
        .select('*')
        .eq('user_id', user.id)
        .eq('content_type', 'post'),
      
      // Listings
      supabase
        .from('content')
        .select('*')
        .eq('user_id', user.id)
        .in('content_type', ['listing', 'event', 'rental']),
      
      // Messages (sent)
      supabase
        .from('messages')
        .select('*')
        .eq('sender_id', user.id),
      
      // Saved items
      supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', user.id),
      
      // Notifications
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id),
      
      // Hub boxes
      supabase
        .from('hub_boxes')
        .select('*')
        .eq('user_id', user.id)
    ])

    // Compile all data
    const exportData = {
      exportDate: new Date().toISOString(),
      userId: user.id,
      profile: profileData.data || null,
      posts: postsData.data || [],
      listings: listingsData.data || [],
      messages: messagesData.data || [],
      savedItems: savedData.data || [],
      notifications: notificationsData.data || [],
      hubBoxes: hubData.data || [],
    }

    // Return as JSON download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="pan-data-export-${user.id}-${Date.now()}.json"`,
      },
    })
  } catch (error: any) {
    console.error('Data export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

