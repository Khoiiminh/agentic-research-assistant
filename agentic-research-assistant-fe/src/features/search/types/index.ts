/**
 * Search Feature Types
 */

export interface SearchQuery {
  q: string;
  filters?: SearchFilters;
  page?: number;
  limit?: number;
}

export interface SearchFilters {
  dateRange?: {
    from: Date;
    to: Date;
  };
  source?: string[];
  type?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: Date;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  totalPages: number;
}
