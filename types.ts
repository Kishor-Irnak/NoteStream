export interface Source {
  title: string;
  description: string;
  relevance: number; // 0-100
}

export interface RoadmapStep {
  step: string;
  description: string;
  estimatedTime: string;
}

export interface MemoryMapNode {
  label: string;
  children?: MemoryMapNode[];
}

export interface TopicStat {
  topic: string;
  complexity: number; // 0-100
  importance: number; // 0-100
}

export interface AnalysisResult {
  sources: Source[];
  roadmap: RoadmapStep[];
  memoryMap: MemoryMapNode;
  stats: TopicStat[];
  summary: string;
  suggestedQuestions: string[];
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  ANALYZED = 'ANALYZED',
  ERROR = 'ERROR'
}

export interface FileData {
  name: string;
  size: number;
  type: string;
  base64: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface NoteItem {
  id: string;
  type: 'Study Guide' | 'Briefing Doc' | 'FAQ' | 'Timeline' | 'Custom';
  title: string;
  content: string;
  date: Date;
}