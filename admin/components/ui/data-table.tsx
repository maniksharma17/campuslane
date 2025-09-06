'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';

interface Column<T = any> {
  key: string;
  title: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'select' | 'text';
  filterOptions?: { label: string; value: string }[];
}

interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onSearch?: (query: string) => void;
  onFilter?: (filters: Record<string, string>) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  selectable?: boolean;
  selectedItems?: string[];
  onSelectionChange?: (items: string[]) => void;
  actions?: React.ReactNode;
  emptyMessage?: string;
}

export function DataTable<T extends { _id: string }>({
  data,
  columns,
  loading = false,
  pagination,
  onPageChange,
  onLimitChange,
  onSearch,
  onFilter,
  onSort,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  actions,
  emptyMessage = 'No data found.',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleFilter = (column: string, value: string) => {
    const newFilters = { ...filters, [column]: value };
    if (!value) {
      delete newFilters[column];
    }
    setFilters(newFilters);
    onFilter?.(newFilters);
  };

  const handleSort = (column: string) => {
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);
    onSort?.(column, newDirection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange?.(data.map(item => item._id));
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    let newSelection;
    if (checked) {
      newSelection = [...selectedItems, itemId];
    } else {
      newSelection = selectedItems.filter(id => id !== itemId);
    }
    onSelectionChange?.(newSelection);
  };

  const isAllSelected = data.length > 0 && selectedItems.length === data.length;
  const isSomeSelected = selectedItems.length > 0 && selectedItems.length < data.length;

  return (
    <Card>
      <CardContent className="p-6">
        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {actions}
          </div>

          {/* Filterable columns */}
          <div className="flex items-center gap-4 flex-wrap">
            {columns
              .filter(col => col.filterable)
              .map(column => (
                <Select
                  key={column.key}
                  value={filters[column.key] || ''}
                  onValueChange={(value) => handleFilter(column.key, value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={`Filter by ${column.title}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All {column.title}</SelectItem>
                    {column.filterOptions?.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border max-h-[50vh] overflow-y-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                      className={isSomeSelected ? 'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground' : ''}
                    />
                  </TableHead>
                )}
                {columns.map(column => (
                  <TableHead
                    key={column.key}
                    className={column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''}
                    onClick={column.sortable ? () => handleSort(column.key) : undefined}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column.title}</span>
                      {column.sortable && sortColumn === column.key && (
                        <span className="text-xs">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell 
                    colSpan={columns.length + (selectable ? 1 : 0)} 
                    className="h-24 text-center"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={columns.length + (selectable ? 1 : 0)} 
                    className="h-24 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                data.map(item => (
                  <TableRow key={item._id}>
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(item._id)}
                          onCheckedChange={(checked) => handleSelectItem(item._id, checked as boolean)}
                          aria-label={`Select item ${item._id}`}
                        />
                      </TableCell>
                    )}
                    {columns.map(column => (
                      <TableCell key={column.key}>
                        {column.render 
                          ? column.render(item[column.key as keyof T], item)
                          : String(item[column.key as keyof T] || '')
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={pagination.limit.toString()}
                onValueChange={(value) => onLimitChange?.(parseInt(value))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map(limit => (
                    <SelectItem key={limit} value={limit.toString()}>
                      {limit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => onPageChange?.(1)}
                  disabled={pagination.page === 1}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronLeft className="h-4 w-4" />
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => onPageChange?.(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => onPageChange?.(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => onPageChange?.(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronRight className="h-4 w-4" />
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}