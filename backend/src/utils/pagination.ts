import { PaginationQuery, PaginationResult } from '../types';

export const getPaginationParams = (query: PaginationQuery) => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const createPaginationResult = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> => {
  const pages = Math.ceil(total / limit);
  const hasNext = page < pages;
  const hasPrev = page > 1;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasNext,
      hasPrev,
    },
  };
};