"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef, type MRT_ColumnFiltersState, type MRT_SortingState } from 'material-react-table';
import { Typography, Select as AntSelect, Space } from 'antd';
import { useInfiniteList } from "@refinedev/core";
import { ShowButton } from "@refinedev/antd";

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
  },
  {
    id: 'actions',
    header: 'Actions',
    enableColumnFilter: false,
    Cell: ({ row }) => (
      <ShowButton hideText size="small" recordItemId={row.original.userId} />
    ),
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
      <Space>
        <AntSelect
          value={timespan}
          style={{ width: 150 }}
          onChange={(value) => setTimespan(value)}
        >
          <AntSelect.Option value="1d">Last 24 Hours</AntSelect.Option>
          <AntSelect.Option value="7d">Last 7 Days</AntSelect.Option>
          <AntSelect.Option value="14d">Last 14 Days</AntSelect.Option>
          <AntSelect.Option value="30d">Last 30 Days</AntSelect.Option>
          <AntSelect.Option value="all">All Time</AntSelect.Option>
        </AntSelect>
      </Space>
    ),
    renderBottomToolbarCustomActions: () => (
      <Typography.Text>
        Fetched {totalFetched} of {totalRows} rows
      </Typography.Text>
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
  });

  return <MaterialReactTable table={table} />;
}
