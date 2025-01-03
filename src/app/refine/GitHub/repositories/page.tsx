"use client";

import { useCallback, useEffect, useMemo, useRef, useState, createRef } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_SortingState,
} from "material-react-table";
import { Stack } from "@mui/material";
import { useInfiniteList } from "@refinedev/core";
import { ShowButton } from "@refinedev/antd";
import Link from "next/link";
import Draggable from "react-draggable";
import { ArrowDown, ArrowUp } from "lucide-react";

type RepositoryData = {
  name: string;
  owner: string;
  url: string;
  contributors: Contributor[];
  numberOfContributors: number;
  numberOfLinesAdded: number;
  numberOfLinesRemoved: number;
};

const fetchSize = 50;

type Contributor = {
  name: string;
  linesAdded: number;
  linesRemoved: number;
};
type Popup = {
  id: string;
  position: {
    x: number;
    y: number;
  };
  isClosing?: boolean;
  isHighlighted?: boolean;
  contributors: Contributor[];
};

export default function Repositories() {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = useState<string>();
  const [sorting, setSorting] = useState<MRT_SortingState>([
    { id: "name", desc: false },
  ]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: fetchSize,
  });
  const [openPopups, setOpenPopups] = useState<Popup[]>([]);

  const { data, fetchNextPage, isError, isFetching, isLoading } =
    useInfiniteList<RepositoryData>({
      resource: "repositories",
      pagination: {
        pageSize: pagination.pageSize,
        current: (pagination.pageIndex ?? 0) + 1,
      },
      filters: [
        ...columnFilters.map((filter) => {
            console.log("--------------------------------")
          console.log(filter)
          console.log("--------------------------------")
          return {
            field: filter.id,
            operator: "eq" as const,
            value:  filter.value,
          }
        }),
      ],
      sorters: sorting.map((sort) => ({
        field: sort.id,
        order: sort.desc ? "desc" : "asc",
      })),
    });

  const flatData = useMemo(
    () => (data?.pages.flatMap((page) => page.data) ?? []) as RepositoryData[],
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
  const handleShowButtonClick = (repoName: string) => {
    const existingPopupIndex = openPopups.findIndex(popup => popup.id === repoName);
    
    if (existingPopupIndex !== -1) {
      // If exists, update its position to center and highlight it
      setOpenPopups(prev => prev.map(popup => 
        popup.id === repoName 
          ? { ...popup, position: { x: 0, y: 0 }, isHighlighted: true }
          : popup
      ));
    } else {
      // If doesn't exist, create new popup with highlight
      setOpenPopups(prev => [
        ...prev,
        {
          id: repoName,
          position: { x: 0, y: 0 },
          isHighlighted: true,
          contributors: flatData.find(repo => repo.name === repoName)?.contributors ?? [],
        },
      ]);
    }
    
    // Remove highlight after 1 second in both cases
    setTimeout(() => {
      setOpenPopups(prev => prev.map(popup => 
        popup.id === repoName 
          ? { ...popup, isHighlighted: false }
          : popup
      ));
    }, 1000);
  };
  const columns: MRT_ColumnDef<RepositoryData>[] = [
    {
      accessorKey: "name",
      header: "Name",
      filterVariant: "autocomplete",
    },
    {
      accessorKey: "numberOfContributors",
      header: "# Contributors",
      filterVariant: "range",
    },
    {
      accessorKey: "url",
      header: "URL",
      filterVariant: "text",
      Cell: ({ row }) => (
        <Link
          className="truncate text-blue-500 hover:underline"
          href={row.original.url}
          target="_blank"
        >
          {row.original.url}
        </Link>
      ),
      minSize: 250,
    },
    {
      accessorKey: "owner",
      header: "Owner",
      filterVariant: "autocomplete",
    },
    {
      accessorKey: "numberOfLinesAdded",
      header: "Total Lines Added",
      filterVariant: "range",
      Cell: ({ row }) => (
        <span className="flex items-center justify-between gap-1 truncate font-semibold text-green-600">
          <span>{row.original.numberOfLinesAdded}</span>
        </span>
      ),
    },
    {
      accessorKey: "numberOfLinesRemoved",
      header: "Total Lines Removed",
      filterVariant: "range",
      Cell: ({ row }) => (
        <span className="flex items-center gap-1 truncate font-semibold text-red-600">
          <span>{row.original.numberOfLinesRemoved}</span>
        </span>
      ),
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
            recordItemId={row.original.name}
            onClick={() => handleShowButtonClick(row.original.name)}
          />
        </Stack>
      ),
    },
  ];
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
      sorting: [],
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

  const handleClosePopup = (popupId: string) => {
    setOpenPopups(prev => prev.map(popup => 
      popup.id === popupId ? { ...popup, isClosing: true } : popup
    ));
    
    // Remove popup after animation completes
    setTimeout(() => {
      setOpenPopups(prev => prev.filter(popup => popup.id !== popupId));
    }, 200); // Match this with animation duration
  };

  const handleDragStop = (
    popupId: string,
    e: any,
    data: { x: number; y: number },
  ) => {
    setOpenPopups((prev) =>
      prev.map((popup) =>
        popup.id === popupId
          ? { ...popup, position: { x: data.x, y: data.y } }
          : popup,
      ),
    );
  };

  const dragRefs = useRef<Map<string, React.RefObject<HTMLDivElement>>>(new Map()).current;

  return (
    <div>
      <button
        className="mb-4 rounded-md bg-blue-500 p-2 text-white"
        onClick={() => {
          window.open(
            "https://github.com/apps/Prod-Lyra-GitHub-Dashboard-App/installations/new",
            "_blank",
            "width=600,height=800",
          );
        }}
      >
        Connect/Configure your GitHub account
      </button>

      {openPopups.map((popup) => {
        if (!dragRefs.has(popup.id)) {
          dragRefs.set(popup.id, createRef<HTMLDivElement>());
        }
        const nodeRef = dragRefs.get(popup.id)!;

        return (
          <Draggable
            key={popup.id}
            handle=".handle"
            position={popup.position}
            onStop={(e, data) => handleDragStop(popup.id, e, data)}
            nodeRef={nodeRef}
            
          >
            <div 
              ref={nodeRef}
              className={`fixed top-1/2 left-1/2 bg-white shadow-lg border z-50 min-w-[300px] duration-200
               
                ${popup.isClosing 
                  ? 'animate-out fade-out zoom-out' 
                  : 'animate-in fade-in zoom-in'
                }
                ${popup.isHighlighted
                  ? 'border-blue-500 border-2' 
                  : 'border-gray-200'
                }
                transition-colors`}
            >
              <div className="handle mb-2 flex cursor-move bg-gray-100 justify-between items-center border-b">
                <span className="pl-2 font-medium">Repository: {popup.id}</span>
                <button
                  onClick={() => handleClosePopup(popup.id)}
                  className=" hover:bg-[#f86464]  bg-[#ef4444] text-[#450a0a] px-5 py-2 transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
              <div className="p-2 ">
                <span className="font-medium">Contributors:</span>
                <ul className="list-disc pl-6">
                    {popup.contributors.map((contributor) => (
                        <li key={contributor.name} className="flex gap-2 before:content-['•'] " >
                            {contributor.name}
                            <span className="text-green-600 flex gap-1 items-center">
                                {contributor.linesAdded}
                                <ArrowUp className="w-4 h-4" />
                            </span>
                            <span className="text-red-600 flex gap-1 items-center">
                                {contributor.linesRemoved}
                                <ArrowDown className="w-4 h-4" />
                            </span>
                        </li>
                    ))}
                </ul>
              </div>
            </div>
          </Draggable>
        );
      })}

      <MaterialReactTable table={table} />
    </div>
  );
}
