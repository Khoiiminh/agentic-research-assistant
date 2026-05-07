/**
 * Common Types
 */

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListResponse<T> {
  data: T[];
  pagination: PaginationParams;
}
