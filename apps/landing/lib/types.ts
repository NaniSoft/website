// Shared data shapes for the landing's copy constants. The retired
// Sentinel-demo graph/chat types (GraphNode, GraphEdge, ChatTranscript, …)
// were removed with their components in ticket 18 — git history keeps them.

export interface Integration {
  name: string;
  category: 'Cloud' | 'Identity' | 'SIEM' | 'ITSM' | 'Data' | 'Productivity' | 'Endpoint' | 'DevTools' | 'CRM' | 'Support';
}

export interface UseCase {
  title: string;
  illustration: 'graph' | 'shield' | 'clock';
  bullets: [string, string, string];
}
