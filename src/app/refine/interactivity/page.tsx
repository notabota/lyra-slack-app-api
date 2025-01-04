"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef, type MRT_ColumnFiltersState, type MRT_SortingState } from 'material-react-table';
import { Typography, AutoComplete, Space, Modal } from 'antd';
import { useInfiniteList, useCustom, useApiUrl } from "@refinedev/core";
import { useNavigation } from "@refinedev/core";
import ShowInteractivityContent from './[id]/ShowInteractivityContent';

type InteractivityData = {
  userId: number;
  userName: string | null;
  messageCount: number;
  reactionCount: number;
  fileCount: number;
  totalCount: number;
  timespan: "1d" | "7d" | "14d" | "30d" | "all";
};

type Channel = {
  id: string;
  name: string;
};

type TeamMember = {
  id: number;
  name: string | null;
};

type AutoCompleteOption = {
  key: string | number;
  value: string;
};

const columns: MRT_ColumnDef<InteractivityData>[] = [
  {
    accessorKey: 'userName',
    header: 'User Name',
    filterVariant: 'autocomplete',
    enableColumnFilter: false,
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
  const [selectedChannel, setSelectedChannel] = useState<number | undefined>(undefined);
  const [selectedMember, setSelectedMember] = useState<number | undefined>(undefined);
  const [channelSearch, setChannelSearch] = useState<string>('');
  const [memberSearch, setMemberSearch] = useState<string>('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: fetchSize,
  });
  const [selectedUser, setSelectedUser] = useState<InteractivityData | null>(null);

  const apiUrl = useApiUrl();

  const {
    data: channelsData,
    isFetching: channelsFetching,
  } = useCustom({
    url: `${apiUrl}/slack`,
    method: "get",
  });

  const {
    data: teamMembersData,
    isFetching: teamMembersFetching,
  } = useCustom({
    url: `${apiUrl}/slack/team/members`,
    method: "get",
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
      },
      ...(selectedChannel
        ? [{
          field: "channelId",
          operator: "eq" as const,
          value: selectedChannel
        }]
        : []),
      ...(selectedMember
        ? [{
          field: "userId",
          operator: "eq" as const,
          value: selectedMember
        }]
        : [])
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

  const { show } = useNavigation();

  const channelOptions = useMemo(() => {
    if (!channelsData?.data) return [];
    return channelsData.data
      .filter((channel: Channel) => {
        if (!channelSearch) return true;
        return channel.name.toLowerCase().includes(channelSearch.toLowerCase());
      })
      .map((channel: Channel) => ({
        key: channel.id,
        value: channel.name
      }))
      .sort((a: AutoCompleteOption, b: AutoCompleteOption) => a.value.localeCompare(b.value));
  }, [channelsData?.data, channelSearch]);

  const memberOptions = useMemo(() => {
    if (!teamMembersData?.data) return [];
    return teamMembersData.data
      .filter((member: TeamMember) => {
        if (!memberSearch) return true;
        return member.name?.toLowerCase().includes(memberSearch.toLowerCase());
      })
      .map((member: TeamMember) => ({
        key: member.id,
        value: member.name || `User ${member.id}`
      }))
      .sort((a: AutoCompleteOption, b: AutoCompleteOption) => a.value.localeCompare(b.value));
  }, [teamMembersData?.data, memberSearch]);

  const table = useMaterialReactTable({
    columns,
    data: flatData,
    enablePagination: false,
    enableRowVirtualization: true,
    manualFiltering: true,
    manualSorting: true,
    manualPagination: true,
    enableFacetedValues: true,
    enableColumnFilters: false,
    enableGlobalFilter: false,
    initialState: { showColumnFilters: true },
    muiTableContainerProps: {
      ref: tableContainerRef,
      sx: { height: 'calc(100vh - 180px)' },
      onScroll: (event) => fetchMoreOnBottomReached(event.target as HTMLDivElement),
    },
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => setSelectedUser(row.original),
      sx: {
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
      },
    }),
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
        <AutoComplete
          value={timespan === '1d' ? 'Last 24 Hours' :
                timespan === '7d' ? 'Last 7 Days' :
                timespan === '14d' ? 'Last 14 Days' :
                timespan === '30d' ? 'Last 30 Days' :
                'All Time'}
          style={{ width: 150 }}
          onChange={(value) => {
            const timespanMap: Record<string, "1d" | "7d" | "14d" | "30d" | "all"> = {
              'Last 24 Hours': '1d',
              'Last 7 Days': '7d',
              'Last 14 Days': '14d',
              'Last 30 Days': '30d',
              'All Time': 'all'
            };
            setTimespan(timespanMap[value] ?? "7d");
          }}
          options={[
            { value: 'Last 24 Hours', label: 'Last 24 Hours' },
            { value: 'Last 7 Days', label: 'Last 7 Days' },
            { value: 'Last 14 Days', label: 'Last 14 Days' },
            { value: 'Last 30 Days', label: 'Last 30 Days' },
            { value: 'All Time', label: 'All Time' }
          ]}
        />

        <AutoComplete
          placeholder="All Channels"
          style={{ width: 200 }}
          value={channelSearch}
          onChange={(value) => setChannelSearch(value)}
          onSelect={(value, option) => setSelectedChannel(option.key)}
          options={channelOptions}
          disabled={channelsFetching || !channelsData?.data}
          allowClear
          onClear={() => {
            setSelectedChannel(undefined);
            setChannelSearch('');
          }}
        />

        <AutoComplete
          placeholder="All Team Members"
          style={{ width: 200 }}
          value={memberSearch}
          onChange={(value) => setMemberSearch(value)}
          onSelect={(value, option) => setSelectedMember(option.key)}
          options={memberOptions}
          disabled={teamMembersFetching || !teamMembersData?.data}
          allowClear
          onClear={() => {
            setSelectedMember(undefined);
            setMemberSearch('');
          }}
        />
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

  return (
    <>
      <MaterialReactTable table={table} />
      <Modal
        open={!!selectedUser}
        onCancel={() => setSelectedUser(null)}
        footer={[
          <Typography.Link key="fullPage" onClick={() => selectedUser?.userId && show("interactivity", selectedUser.userId)}>
            Go to full page
          </Typography.Link>
        ]}
        width="90vw"
        style={{ top: '5vh' }}
        styles={{ body: { height: '85vh', overflow: 'auto' } }}
      >
        {selectedUser && <ShowInteractivityContent id={selectedUser.userId.toString()} />}
      </Modal>
    </>
  );
}
