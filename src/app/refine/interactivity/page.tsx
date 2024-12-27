"use client";

import { getDefaultFilter } from "@refinedev/core";
import {
  useTable,
  getDefaultSortOrder,
  FilterDropdown,
  useSelect,
  List,
} from "@refinedev/antd";

import { Table, Space, Input, Select, Spin } from "antd";
import { BaseRecord } from "@refinedev/core";

interface Interactivity extends BaseRecord {
  userId: string;
  userName: string;
  messageCount: number;
  reactionCount: number;
  fileCount: number;
  totalCount: number;
  timespan: string;
}

export default function ListInteractivity() {
  const { tableProps, filters, sorters } = useTable({
    resource: "interactivity",
    sorters: { initial: [{ field: "totalCount", order: "desc" }] },
    syncWithLocation: true,
    filters: {
      initial: [{ field: "timespan", operator: "eq", value: "7d" }],
    },
  });

  const { selectProps: userSelectProps } = useSelect({
    resource: "interactivity",
    optionLabel: "userName",
    optionValue: "userName",
    defaultValue: getDefaultFilter("userName", filters),
  });

  return (
    <>
    <List>
      <Table {...tableProps} rowKey="userId">
        <Table.Column
          dataIndex="userId"
          title="User ID"
        />
        <Table.Column
          dataIndex="userName"
          title="User Name"
          sorter
          defaultSortOrder={getDefaultSortOrder("userName", sorters)}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                style={{ width: "200px" }}
                placeholder="Search user name"
                {...userSelectProps}
                showSearch
                filterOption={(input, option) =>
                  (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </FilterDropdown>
          )}
          defaultFilteredValue={getDefaultFilter("userName", filters)}
        />
        <Table.Column
          dataIndex="messageCount"
          title="Messages"
          sorter
          defaultSortOrder={getDefaultSortOrder("messageCount", sorters)}
        />
        <Table.Column
          dataIndex="reactionCount"
          title="Reactions"
          sorter
          defaultSortOrder={getDefaultSortOrder("reactionCount", sorters)}
        />
        <Table.Column
          dataIndex="fileCount"
          title="Files"
          sorter
          defaultSortOrder={getDefaultSortOrder("fileCount", sorters)}
        />
        <Table.Column
          dataIndex="totalCount"
          title="Total Activity"
          sorter
          defaultSortOrder={getDefaultSortOrder("totalCount", sorters)}
        />
        <Table.Column
          dataIndex="timespan"
          title="Time Span"
          render={(value) => {
            const options: Record<string, string> = {
              "1d": "Last 24 hours",
              "7d": "Last 7 days",
              "14d": "Last 14 days", 
              "30d": "Last 30 days",
              "all": "All time"
            };
            return options[value] || value;
          }}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                style={{ width: "200px" }}
                defaultValue="7d"
                options={[
                  { label: "Last 24 hours", value: "1d" },
                  { label: "Last 7 days", value: "7d" },
                  { label: "Last 14 days", value: "14d" },
                  { label: "Last 30 days", value: "30d" },
                  { label: "All time", value: "all" }
                ]}
              />
            </FilterDropdown>
          )}
          defaultFilteredValue={getDefaultFilter("timespan", filters)}
        />
      </Table>
    </List>
    </>
  );
};
