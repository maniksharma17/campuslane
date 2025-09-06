'use client';

import { useState } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
}

export function usePagination(options: UsePaginationOptions = {}) {
  const { initialPage = 1, initialLimit = 10 } = options;
  
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const goToPage = (newPage: number) => {
    setPage(newPage);
  };

  const nextPage = () => {
    setPage((prev) => prev + 1);
  };

  const prevPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const changeLimit = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  };

  const reset = () => {
    setPage(initialPage);
    setLimit(initialLimit);
  };

  return {
    page,
    limit,
    goToPage,
    nextPage,
    prevPage,
    changeLimit,
    reset,
  };
}