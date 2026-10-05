import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/server-auth'
import { DEFAULT_TEMPLATES } from '@/lib/templates/template-registry'
import { Template } from '@/types/domain'

let customTemplates: Template[] = []

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.response) return auth.response

  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')?.toLowerCase() || ''
    const category = searchParams.get('category') || 'all'

    let list = [...DEFAULT_TEMPLATES, ...customTemplates]

    if (category !== 'all') {
      list = list.filter((t) => t.metadata.category.toLowerCase() === category.toLowerCase())
    }

    if (search.trim()) {
      list = list.filter(
        (t) =>
          t.metadata.title.toLowerCase().includes(search) ||
          t.metadata.description?.toLowerCase().includes(search) ||
          t.metadata.category.toLowerCase().includes(search)
      )
    }

    return NextResponse.json({
      templates: list,
      total: list.length,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.response) return auth.response

  try {
    const body = await request.json()
    const { title, category, sizeLabel, badgeLabel, colorTheme, width, height, icon } = body

    if (!title || !category) {
      return NextResponse.json({ error: 'Title and category are required' }, { status: 400 })
    }

    const newTemplate: Template = {
      metadata: {
        id: `tpl-${Date.now()}`,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: title.trim(),
        description: `Professional ${category} design ready for press printing.`,
        category: category.trim(),
        sizeLabel: sizeLabel || 'A4',
        badgeLabel: badgeLabel || 'NEW',
        colorTheme: colorTheme || 'terracotta',
        icon: icon || '✦',
        isPremium: false,
        isFeatured: true,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      design: {
        schemaVersion: 1,
        canvas: {
          width: width ? parseInt(width, 10) : 1050,
          height: height ? parseInt(height, 10) : 600,
          unit: 'px',
          orientation: width > height ? 'landscape' : 'portrait',
          bleedMm: 3,
          safeMarginMm: 5,
        },
        background: {
          color: colorTheme === 'sunset' ? '#ef826c' : colorTheme === 'sage' ? '#a8b59d' : '#e6aa8f',
        },
        fontsUsed: ['Georgia', 'Inter'],
        elements: [
          {
            id: 'brand-headline',
            type: 'text',
            name: 'Template Title',
            x: 50,
            y: 50,
            width: 500,
            height: 60,
            text: title,
            fontFamily: 'Georgia',
            fontSize: 32,
            fontWeight: 700,
            fill: '#1b1a18',
            opacity: 1,
            zIndex: 1,
            permissions: {
              editable: true,
              movable: true,
              resizable: true,
              rotatable: true,
              deletable: false,
              locked: false,
              required: true,
              visible: true,
            },
          },
        ],
      },
    }

    customTemplates.unshift(newTemplate)

    return NextResponse.json({
      success: true,
      template: newTemplate,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create template' }, { status: 500 })
  }
}
