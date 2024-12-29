"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef, type MRT_ColumnFiltersState, type MRT_SortingState } from 'material-react-table';
import { Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useInfiniteList } from "@refinedev/core";

const antdFont = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"';

type InteractivityData = {
  userId: number;
  userName: string | null;
  messageCount: number;
  reactionCount: number;
  fileCount: number;
  totalCount: number;
  timespan: "1d" | "7d" | "14d" | "30d" | "all";
};

const columns: MRT_ColumnDef<InteractivityData>[] = [
  {
    accessorKey: 'userName',
    header: 'User Name',
    filterVariant: 'autocomplete',
  },
  {
    accessorKey: 'messageCount',
    header: 'Messages',
    enableColumnFilter: false,
  },
  {
    accessorKey: 'reactionCount', 
    header: 'Reactions',
    enableColumnFilter: false,
  },
  {
    accessorKey: 'fileCount',
    header: 'Files',
    enableColumnFilter: false,
  },
  {
    accessorKey: 'totalCount',
    header: 'Total Activity',
    enableColumnFilter: false,
  }
];

const fetchSize = 50;

export default function ListInteractivity() {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>();
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [timespan, setTimespan] = useState<"1d" | "7d" | "14d" | "30d" | "all">("7d");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: fetchSize,
  });

  const { data, fetchNextPage, isError, isFetching, isLoading } = useInfiniteList<InteractivityData>({
    resource: "interactivity",
    pagination: {
      pageSize: pagination.pageSize,
      current: (pagination.pageIndex ?? 0) + 1,
    },
    filters: [
      ...(columnFilters.find(f => f.id === 'userName')?.value 
        ? [{
            field: "userName",
            operator: "eq" as const,
            value: columnFilters.find(f => f.id === 'userName')?.value
          }]
        : []),
      {
        field: "timespan",
        operator: "eq" as const,
        value: timespan
      }
    ],
    sorters: sorting.map(sort => ({
      field: sort.id,
      order: sort.desc ? "desc" : "asc"
    })),
    meta: {
      timespan
    }
  });

  const flatData = useMemo(
    () => (data?.pages.flatMap((page) => page.data) ?? []) as InteractivityData[],
    [data]
  );

  const totalFetched = flatData.length;
  const totalRows = data?.pages[0]?.total ?? 0;

  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        console.log('----------------------------------------');
        console.log('📜 Scroll metrics:', { scrollHeight, scrollTop, clientHeight });
        console.log('📜 scrollHeight - scrollTop - clientHeight:', scrollHeight - scrollTop - clientHeight);
        console.log('📜 isFetching:', isFetching);
        console.log('📜 data.pages.length:', data?.pages.length);
        console.log('📜 data.pages[data.pages.length - 1]?.hasNextPage:', data?.pages[data.pages.length - 1]?.hasNextPage);
        console.log('----------------------------------------');
        if (
          scrollHeight - scrollTop - clientHeight < 200 &&
          !isFetching &&
          data?.pages[data.pages.length - 1]?.hasNextPage
        ) {
          void fetchNextPage();
        }
      }
    },
    [fetchNextPage, isFetching, data?.pages]
  );

  useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current);
  }, [fetchMoreOnBottomReached]);

  const table = useMaterialReactTable({
    columns,
    data: flatData,
    enablePagination: false,
    enableRowVirtualization: true,
    manualFiltering: true,
    manualSorting: true,
    manualPagination: true,
    enableFacetedValues: true,
    initialState: { showColumnFilters: true },
    muiTableContainerProps: {
      ref: tableContainerRef,
      sx: { maxHeight: '600px' },
      onScroll: (event) => fetchMoreOnBottomReached(event.target as HTMLDivElement),
    },
    muiToolbarAlertBannerProps: isError
      ? {
          color: 'error',
          children: 'Error loading data',
        }
      : undefined,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    renderTopToolbarCustomActions: () => (
      <FormControl sx={{ minWidth: 120, mr: 2 }}>
        <InputLabel>Time Period</InputLabel>
        <Select
          value={timespan}
          label="Time Period"
          onChange={(e) => setTimespan(e.target.value as typeof timespan)}
          sx={{ fontFamily: antdFont }}
        >
          <MenuItem value="1d" sx={{ fontFamily: antdFont }}>Last 24 Hours</MenuItem>
          <MenuItem value="7d" sx={{ fontFamily: antdFont }}>Last 7 Days</MenuItem>
          <MenuItem value="14d" sx={{ fontFamily: antdFont }}>Last 14 Days</MenuItem>
          <MenuItem value="30d" sx={{ fontFamily: antdFont }}>Last 30 Days</MenuItem>
          <MenuItem value="all" sx={{ fontFamily: antdFont }}>All Time</MenuItem>
        </Select>
      </FormControl>
    ),
    renderBottomToolbarCustomActions: () => (
      <Typography sx={{ fontFamily: antdFont }}>
        Fetched {totalFetched} of {totalRows} rows
      </Typography>
    ),
    state: {
      columnFilters,
      globalFilter,
      isLoading,
      showAlertBanner: isError,
      showProgressBars: isFetching,
      sorting,
      pagination,
    },
    rowCount: totalRows,
    pageCount: Math.ceil(totalRows / fetchSize),
    muiTablePaperProps: {
      sx: {
        fontFamily: antdFont
      }
    }
  });

  return <MaterialReactTable table={table} />;
}
