'use client';

// Next 16 forbids `dynamic(..., { ssr: false })` inside Server Components.
// `app/page.tsx` is a Server Component, so the client-only Knowledge Graph
// (canvas/force-graph) is loaded through this thin client wrapper instead.
import dynamic from 'next/dynamic';

const KnowledgeGraph = dynamic(
  () => import('@/components/KnowledgeGraph').then((m) => m.KnowledgeGraph),
  { ssr: false }
);

export default function KnowledgeGraphLazy() {
  return <KnowledgeGraph />;
}