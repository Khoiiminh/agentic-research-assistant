/**
 * Research Feature Types
 */

export interface ResearchProject {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface ResearchAnalysis {
  id: string;
  projectId: string;
  content: string;
  createdAt: Date;
}
