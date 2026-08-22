export type EntityType = 'User' | 'Service' | 'DataAsset' | 'Policy' | 'Event' | 'Identity';

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  description: string;
  // attributes shown in the inspector
  attrs: Array<[string, string]>;
  // highlighted as part of a "hot path"
  hot?: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
  hot?: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Integration {
  name: string;
  category: 'Cloud' | 'Identity' | 'SIEM' | 'ITSM' | 'Data' | 'Productivity' | 'Endpoint' | 'DevTools' | 'CRM' | 'Support';
}

export interface UseCase {
  title: string;
  illustration: 'graph' | 'shield' | 'clock';
  bullets: [string, string, string];
}

export interface ChatMessage {
  role: 'user' | 'agent';
  text: string;
  // optional embedded artifact id ('graph-mini' | 'timeline' | 'graph-blast')
  artifact?: 'graph-mini' | 'timeline' | 'graph-blast';
}

export interface ChatTranscript {
  id: string;
  question: string;
  exchange: [ChatMessage, ChatMessage];
}
