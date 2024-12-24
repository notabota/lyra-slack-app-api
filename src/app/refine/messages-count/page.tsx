"use client";

import { useMany, getDefaultFilter } from "@refinedev/core";
import {
  useTable,
  EditButton,
  ShowButton,
  getDefaultSortOrder,
  FilterDropdown,
  useSelect,
  List,
  DateField,
} from "@refinedev/antd";

import { Table, Space, Input, Select, Spin } from "antd";
import { MessagePieChart } from "~/components/ui/messages-count/pie";
import { BaseRecord } from "@refinedev/core";

interface MessageCount extends BaseRecord {
  userId: string;
  userName: string;
  count: number;
  timespan: string;
}

export default function ListMessagesCount() {
  const { tableProps, filters, sorters } = useTable({
    resource: "messages-count",
    sorters: { initial: [{ field: "count", order: "desc" }] },
    syncWithLocation: true,
    filters: {
      initial: [{ field: "timespan", operator: "eq", value: "7d" }],
    },
  });

  console.log("---------------- TABLE PROPS ----------------");
  console.log(tableProps?.dataSource);
  console.log("--------------------------------");

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
        />
        <Table.Column
          dataIndex="count"
          title="Message Count"
          sorter
          defaultSortOrder={getDefaultSortOrder("count", sorters)}
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
    <Spin spinning={!!tableProps?.loading} tip="Loading chart...">
      <MessagePieChart 
        data={tableProps?.dataSource?.map(item => ({
          userId: String(item.userId),
          userName: item.userName || 'Unknown',
          count: item.count
        }))} 
      />
    </Spin>
    </>
  );
};
