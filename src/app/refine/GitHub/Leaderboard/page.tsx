"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_SortingState,
} from "material-react-table";
import { Typography, Stack } from "@mui/material";
import { useInfiniteList } from "@refinedev/core";
import { ShowButton, ThemedLayoutV2 } from "@refinedev/antd";

type LeaderboardData = {
  commiter: number;
  numberOfCommits: number;
};

const columns: MRT_ColumnDef<LeaderboardData>[] = [
  {
    accessorKey: "committer",
    header: "Committer",
    filterVariant: "text",
  },
  {
    accessorKey: "count",
    header: "Number of Commits",
    filterVariant: "range",
  },
  {
    id: "actions",
    header: "Actions",
    enableColumnFilter: false,
    enableSorting: false,
    Cell: ({ row }) => (
      <Stack direction="row" spacing={1}>
        <ShowButton
          hideText
          size="small"
          recordItemId={row.original.commiter}
        />
      </Stack>
    ),
  },
];

const fetchSize = 50;

export default function Leaderboard() {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = useState<string>();
  const [sorting, setSorting] = useState<MRT_SortingState>([
    { id: "count", desc: false },
  ]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: fetchSize,
  });

  const { data, fetchNextPage, isError, isFetching, isLoading } =
    useInfiniteList<LeaderboardData>({
      resource: "commits-count-of-users",
      pagination: {
        pageSize: pagination.pageSize,
        current: (pagination.pageIndex ?? 0) + 1,
      },
      filters: columnFilters.map((filter: any) => ({
        field: filter.id,
        operator: filter.id === "count" ? "between" : "contains" ,
        value: filter.value,
      })),
      sorters: sorting.map((sort) => ({
        field: sort.id,
        order: sort.desc ? "desc" : "asc",
      })),
    });

  const flatData = useMemo(
    () => (data?.pages.flatMap((page) => page.data) ?? []) as LeaderboardData[],
    [data],
  );

  const totalFetched = flatData.length;
  const totalRows = data?.pages[0]?.total ?? 0;

  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        console.log("----------------------------------------");
        console.log("📜 Scroll metrics:", {
          scrollHeight,
          scrollTop,
          clientHeight,
        });
        console.log(
          "📜 scrollHeight - scrollTop - clientHeight:",
          scrollHeight - scrollTop - clientHeight,
        );
        console.log("📜 isFetching:", isFetching);
        console.log("📜 data.pages.length:", data?.pages.length);
        console.log(
          "📜 data.pages[data.pages.length - 1]?.hasNextPage:",
          data?.pages[data.pages.length - 1]?.hasNextPage,
        );
        console.log("----------------------------------------");
        if (
          scrollHeight - scrollTop - clientHeight < 1000 &&
          !isFetching &&
          data?.pages[data.pages.length - 1]?.hasNextPage
        ) {
          console.log("--------------- FETCHING NEXT PAGE -----------------");
          void fetchNextPage();
        }
      }
    },
    [fetchNextPage, isFetching, data?.pages],
  );

  useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current);
  }, [fetchMoreOnBottomReached]);

  const table = useMaterialReactTable({
    columns,
    data: flatData,
    enablePagination: false,
    enableRowNumbers: true,
    enableRowVirtualization: true,
    manualFiltering: true,
    manualSorting: true,
    manualPagination: true,
    enableFacetedValues: true,
    initialState: {
      showColumnFilters: true,
      sorting: [{ id: "count", desc: false }],
    },
    muiTableContainerProps: {
      ref: tableContainerRef,
      sx: { maxHeight: "600px" },
      onScroll: (event) =>
        fetchMoreOnBottomReached(event.target as HTMLDivElement),
    },
    state: {
      columnFilters,
      globalFilter,
      sorting,
      isLoading,
      showProgressBars: isFetching,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    rowCount: totalRows,
    pageCount: Math.ceil(totalRows / fetchSize),
  });

  return (
    <div>
      <MaterialReactTable table={table} />
    </div>
  );
}
