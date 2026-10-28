/**
 * Estimates the minimum pixel height required for multi-line wrapped text
 * based on font size, container width, and line height.
 */
export function estimateTextHeight(
  text: string,
  fontSize: number,
  width: number,
  lineHeightRatio: number = 1.3
): number {
  if (!text) return Math.max(20, Math.round(fontSize * lineHeightRatio))
  if (width <= 0) width = 300

  // Strip formatting markers (**word** or <b>) for accurate measurement
  const clean = stripFormattingTags(text)
  const avgCharWidth = fontSize * 0.58
  const charsPerLine = Math.max(1, Math.floor(width / avgCharWidth))
  const paragraphs = clean.split('\n')
  let totalLines = 0

  for (const para of paragraphs) {
    if (!para) {
      totalLines += 1
      continue
    }
    const words = para.split(' ')
    let currentLineLen = 0
    let paraLines = 1

    for (const word of words) {
      if (currentLineLen + word.length > charsPerLine && currentLineLen > 0) {
        paraLines += 1
        currentLineLen = word.length
      } else {
        currentLineLen += word.length + 1
      }
    }
    totalLines += paraLines
  }

  const singleLineHeight = Math.round(fontSize * lineHeightRatio)
  return Math.max(singleLineHeight, totalLines * singleLineHeight)
}

/**
 * Strips markdown and HTML formatting tags for print rasterizers and outliners
 */
export function stripFormattingTags(text: string): string {
  if (!text) return ''
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/<\/?(b|strong|i|em)>/gi, '')
}

import React from 'react'
import { TextElement } from '@/types/domain'

/**
 * Parses multi-line text with **bold**, *italic*, <b>bold</b> and renders standard React elements
 */
export function renderFormattedRichText(
  text: string,
  baseFontWeight: number | string = 400,
  baseFontStyle: string = 'normal'
): React.ReactNode {
  if (!text) return null

  const lines = text.split('\n')

  return lines.map((line, lineIdx) => {
    const tokens: React.ReactNode[] = []
    let keyCounter = 0

    // Match bold: **text** or <b>text</b> or <strong>text</strong>
    // Match italic: *text* or <i>text</i> or <em>text</em>
    const pattern = /(\*\*(.+?)\*\*)|(<b>(.+?)<\/b>)|(<strong>(.+?)<\/strong>)|(\*(.+?)\*)|(<i>(.+?)<\/i>)|(<em>(.+?)<\/em>)/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = pattern.exec(line)) !== null) {
      if (match.index > lastIndex) {
        tokens.push(
          <span key={`plain-${lineIdx}-${keyCounter++}`}>
            {line.substring(lastIndex, match.index)}
          </span>
        )
      }

      const boldText = match[2] || match[4] || match[6]
      const italicText = match[8] || match[10] || match[12]

      if (boldText !== undefined) {
        tokens.push(
          <strong
            key={`bold-${lineIdx}-${keyCounter++}`}
            style={{ fontWeight: 700 }}
          >
            {boldText}
          </strong>
        )
      } else if (italicText !== undefined) {
        tokens.push(
          <em
            key={`italic-${lineIdx}-${keyCounter++}`}
            style={{ fontStyle: 'italic' }}
          >
            {italicText}
          </em>
        )
      }

      lastIndex = pattern.lastIndex
    }

    if (lastIndex < line.length) {
      tokens.push(
        <span key={`plain-${lineIdx}-${keyCounter++}`}>
          {line.substring(lastIndex)}
        </span>
      )
    }

    return (
      <React.Fragment key={`line-${lineIdx}`}>
        {tokens.length > 0 ? tokens : <span>&nbsp;</span>}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    )
  })
}

/**
 * Toggles bold on marked/highlighted text or toggles base element weight if no text is marked
 */
export function toggleTextBold(
  selectedElement: TextElement,
  onUpdateElement: (id: string, updates: Partial<TextElement>) => void,
  textareaRef?: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>,
  customSelection?: { start: number; end: number } | null
) {
  // 1. If explicit customSelection was provided (e.g. from tracked input selection)
  if (customSelection && customSelection.start !== customSelection.end) {
    const { start, end } = customSelection
    const fullText = selectedElement.text
    if (start >= 0 && end <= fullText.length) {
      const selectedPart = fullText.substring(start, end)
      const isWrapped =
        (start >= 2 && end <= fullText.length - 2 && fullText.substring(start - 2, start) === '**' && fullText.substring(end, end + 2) === '**') ||
        (selectedPart.startsWith('**') && selectedPart.endsWith('**') && selectedPart.length >= 4)

      let newText: string
      if (isWrapped) {
        if (selectedPart.startsWith('**') && selectedPart.endsWith('**')) {
          newText = fullText.substring(0, start) + selectedPart.slice(2, -2) + fullText.substring(end)
        } else {
          newText = fullText.substring(0, start - 2) + selectedPart + fullText.substring(end + 2)
        }
      } else {
        newText = fullText.substring(0, start) + `**${selectedPart}**` + fullText.substring(end)
      }

      onUpdateElement(selectedElement.id, { text: newText })
      return
    }
  }

  // 2. Check if text is currently highlighted inside an active input/textarea
  const activeEl = typeof document !== 'undefined' ? (document.activeElement as HTMLTextAreaElement | HTMLInputElement | null) : null
  const targetTextarea =
    activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')
      ? activeEl
      : textareaRef?.current

  if (targetTextarea && targetTextarea.selectionStart !== null && targetTextarea.selectionEnd !== null) {
    const start = targetTextarea.selectionStart
    const end = targetTextarea.selectionEnd
    if (start !== end) {
      const fullText = targetTextarea.value
      const selectedPart = fullText.substring(start, end)

      const isWrapped =
        (start >= 2 && end <= fullText.length - 2 && fullText.substring(start - 2, start) === '**' && fullText.substring(end, end + 2) === '**') ||
        (selectedPart.startsWith('**') && selectedPart.endsWith('**') && selectedPart.length >= 4)

      let newText: string
      let newStart: number
      let newEnd: number

      if (isWrapped) {
        if (selectedPart.startsWith('**') && selectedPart.endsWith('**')) {
          const unwrapped = selectedPart.slice(2, -2)
          newText = fullText.substring(0, start) + unwrapped + fullText.substring(end)
          newStart = start
          newEnd = start + unwrapped.length
        } else {
          newText = fullText.substring(0, start - 2) + selectedPart + fullText.substring(end + 2)
          newStart = start - 2
          newEnd = end - 2
        }
      } else {
        newText = fullText.substring(0, start) + `**${selectedPart}**` + fullText.substring(end)
        newStart = start
        newEnd = end + 4
      }

      onUpdateElement(selectedElement.id, { text: newText })
      setTimeout(() => {
        targetTextarea.focus()
        targetTextarea.setSelectionRange(newStart, newEnd)
      }, 10)
      return
    }
  }

  // 3. Check window.getSelection() for marked text directly on canvas
  const windowSelection = typeof window !== 'undefined' ? window.getSelection() : null
  if (windowSelection && windowSelection.rangeCount > 0 && !windowSelection.isCollapsed) {
    const selectedString = windowSelection.toString().trim()
    if (selectedString && selectedElement.text.includes(selectedString)) {
      const fullText = selectedElement.text
      const isAlreadyBold = fullText.includes(`**${selectedString}**`)
      let newText: string
      if (isAlreadyBold) {
        newText = fullText.replace(`**${selectedString}**`, selectedString)
      } else {
        newText = fullText.replace(selectedString, `**${selectedString}**`)
      }
      onUpdateElement(selectedElement.id, { text: newText })
      return
    }
  }

  // 4. Fallback: If no text is marked, toggle the element's base font weight
  const currentWeight = selectedElement.fontWeight
  const isBold = currentWeight === 700 || currentWeight === 'bold' || currentWeight === 800
  onUpdateElement(selectedElement.id, { fontWeight: isBold ? 400 : 700 })
}

/**
 * Toggles italic on marked/highlighted text or toggles base element style if no text is marked
 */
export function toggleTextItalic(
  selectedElement: TextElement,
  onUpdateElement: (id: string, updates: Partial<TextElement>) => void,
  textareaRef?: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>,
  customSelection?: { start: number; end: number } | null
) {
  // 1. If explicit customSelection was provided
  if (customSelection && customSelection.start !== customSelection.end) {
    const { start, end } = customSelection
    const fullText = selectedElement.text
    if (start >= 0 && end <= fullText.length) {
      const selectedPart = fullText.substring(start, end)
      const isWrapped =
        (start >= 1 && end <= fullText.length - 1 && fullText[start - 1] === '*' && fullText[end] === '*') ||
        (selectedPart.startsWith('*') && selectedPart.endsWith('*') && selectedPart.length >= 2)

      let newText: string
      if (isWrapped) {
        if (selectedPart.startsWith('*') && selectedPart.endsWith('*')) {
          newText = fullText.substring(0, start) + selectedPart.slice(1, -1) + fullText.substring(end)
        } else {
          newText = fullText.substring(0, start - 1) + selectedPart + fullText.substring(end + 1)
        }
      } else {
        newText = fullText.substring(0, start) + `*${selectedPart}*` + fullText.substring(end)
      }

      onUpdateElement(selectedElement.id, { text: newText })
      return
    }
  }

  // 2. Check if text is currently highlighted inside an input/textarea
  const activeEl = typeof document !== 'undefined' ? (document.activeElement as HTMLTextAreaElement | HTMLInputElement | null) : null
  const targetTextarea =
    activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')
      ? activeEl
      : textareaRef?.current

  if (targetTextarea && targetTextarea.selectionStart !== null && targetTextarea.selectionEnd !== null) {
    const start = targetTextarea.selectionStart
    const end = targetTextarea.selectionEnd
    if (start !== end) {
      const fullText = targetTextarea.value
      const selectedPart = fullText.substring(start, end)

      const isWrapped =
        (start >= 1 && end <= fullText.length - 1 && fullText[start - 1] === '*' && fullText[end] === '*') ||
        (selectedPart.startsWith('*') && selectedPart.endsWith('*') && selectedPart.length >= 2)

      let newText: string
      let newStart: number
      let newEnd: number

      if (isWrapped) {
        if (selectedPart.startsWith('*') && selectedPart.endsWith('*')) {
          const unwrapped = selectedPart.slice(1, -1)
          newText = fullText.substring(0, start) + unwrapped + fullText.substring(end)
          newStart = start
          newEnd = start + unwrapped.length
        } else {
          newText = fullText.substring(0, start - 1) + selectedPart + fullText.substring(end + 1)
          newStart = start - 1
          newEnd = end - 1
        }
      } else {
        newText = fullText.substring(0, start) + `*${selectedPart}*` + fullText.substring(end)
        newStart = start
        newEnd = end + 2
      }

      onUpdateElement(selectedElement.id, { text: newText })
      setTimeout(() => {
        targetTextarea.focus()
        targetTextarea.setSelectionRange(newStart, newEnd)
      }, 10)
      return
    }
  }

  // 3. Check window.getSelection() for marked text directly on canvas
  const windowSelection = typeof window !== 'undefined' ? window.getSelection() : null
  if (windowSelection && windowSelection.rangeCount > 0 && !windowSelection.isCollapsed) {
    const selectedString = windowSelection.toString().trim()
    if (selectedString && selectedElement.text.includes(selectedString)) {
      const fullText = selectedElement.text
      const isAlreadyItalic = fullText.includes(`*${selectedString}*`)
      let newText: string
      if (isAlreadyItalic) {
        newText = fullText.replace(`*${selectedString}*`, selectedString)
      } else {
        newText = fullText.replace(selectedString, `*${selectedString}*`)
      }
      onUpdateElement(selectedElement.id, { text: newText })
      return
    }
  }

  // 4. Fallback: If no text is marked, toggle base style
  const currentStyle = selectedElement.fontStyle
  onUpdateElement(selectedElement.id, { fontStyle: currentStyle === 'italic' ? 'normal' : 'italic' })
}
