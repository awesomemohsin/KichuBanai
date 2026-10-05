'use client'

import { use, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { StandaloneEditor } from '@/components/editor/standalone-editor'

function EditorPageContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = use(paramsPromise)
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template')

  return <StandaloneEditor designId={id} initialTemplateId={templateId} />
}

export default function DesignPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen flex items-center justify-center bg-[#f9f8f6] text-xs text-[#817e79]">
          <div className="flex items-center gap-2">
            <span className="text-[#e26f5b] text-base animate-spin">✦</span>
            <span>Opening KichuBanai Studio...</span>
          </div>
        </div>
      }
    >
      <EditorPageContent paramsPromise={params} />
    </Suspense>
  )
}
