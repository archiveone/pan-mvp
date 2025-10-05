import { NextRequest, NextResponse } from 'next/server'

// Simple heuristic-based moderation. No external APIs required.
// Returns a safety score (0-100), categories, and an action.

type ModerationInput = {
  title?: string
  content?: string
  tags?: string[]
  media_url?: string | null
}

type ModerationResult = {
  score: number
  categories: string[]
  violations: string[]
  action: 'allow' | 'review' | 'block' | 'age_restrict'
}

const LISTS = {
  hate: [
    'nazi','kkk','white power','heil hitler','gas the','lynch','ethnic cleansing','slur','subhuman'
  ],
  terrorism: [
    'isis','isil','al-qaeda','hezbollah','boko haram','taliban','jihad attack','bomb making','pipe bomb','explosive recipe'
  ],
  weapons: [
    'sell ak-47','sell ar-15','ghost gun','unserialized firearm','buy cocaine gun','buy gun no background','silencer kit'
  ],
  drugs: [
    'buy cocaine','sell cocaine','buy heroin','sell heroin','fentanyl for sale','mdma for sale','cartel plug','dark web drugs'
  ],
  sexual: [
    'porn','hardcore porn','child porn','cp','underage sex','incest porn','revenge porn','bestiality','rape porn'
  ],
  piracy: [
    'full album download','movie torrent','cracked software','license keygen','nude leaks pack','mega leaked pack','dmca bypass'
  ]
}

function normalize(text: string): string {
  return text.toLowerCase()
}

function evaluate(input: ModerationInput): ModerationResult {
  const text = normalize(`${input.title || ''} ${input.content || ''} ${(input.tags || []).join(' ')}`)
  const categories: string[] = []
  const violations: string[] = []

  let score = 0

  for (const [cat, words] of Object.entries(LISTS)) {
    for (const w of words) {
      if (text.includes(w)) {
        categories.push(cat)
        violations.push(w)
        // category weights
        if (cat === 'sexual') score += 35
        else if (cat === 'terrorism') score += 50
        else if (cat === 'hate') score += 45
        else if (cat === 'weapons') score += 40
        else if (cat === 'drugs') score += 40
        else if (cat === 'piracy') score += 25
      }
    }
  }

  // Media URL light heuristic (file name hints)
  if (input.media_url) {
    const m = normalize(input.media_url)
    if (m.includes('leak') || m.includes('torrent') || m.includes('crack')) {
      if (!categories.includes('piracy')) categories.push('piracy')
      violations.push('media_url_suspect')
      score += 20
    }
  }

  // Decide action thresholds
  let action: ModerationResult['action'] = 'allow'
  if (categories.includes('terrorism') || categories.includes('hate')) {
    action = score >= 40 ? 'block' : 'review'
  } else if (categories.includes('sexual')) {
    // Underage/illegal sexual content should block
    const illegalSexual = violations.some(v => v.includes('child') || v.includes('underage') || v.includes('rape'))
    action = illegalSexual ? 'block' : (score >= 35 ? 'age_restrict' : 'review')
  } else if (categories.includes('weapons') || categories.includes('drugs')) {
    action = score >= 40 ? 'block' : 'review'
  } else if (categories.includes('piracy')) {
    action = score >= 25 ? 'review' : 'allow'
  }

  // Clamp score 0-100
  score = Math.max(0, Math.min(100, score))

  return { score, categories: Array.from(new Set(categories)), violations: Array.from(new Set(violations)), action }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ModerationInput
    const result = evaluate(body)
    return NextResponse.json({ success: true, result })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Moderation failed' }, { status: 400 })
  }
}


