'use client'

import dynamic from 'next/dynamic'

const PlasmidViewer = dynamic(
  () => import('./PlasmidViewer'),
  { ssr: false }
)

export default function PlasmidViewerWrapper() {
  return <PlasmidViewer />
} 