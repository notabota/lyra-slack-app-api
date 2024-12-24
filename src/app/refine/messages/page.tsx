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

import { Table, Space, Input, Select } from "antd";

export default function ListMessages() {
  const { tableProps, filters, sorters } = useTable({
    sorters: { initial: [{ field: "id", order: "asc" }] },
    syncWithLocation: true,
  });

  console.log("---------------- TABLE PROPS ----------------");
  console.log(tableProps?.dataSource);
  console.log("--------------------------------");

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="id"
          title="ID"
          sorter
          defaultSortOrder={getDefaultSortOrder("id", sorters)}
        />
        <Table.Column
          dataIndex="text"
          title="Text"
          sorter
          defaultSortOrder={getDefaultSortOrder("text", sorters)}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="timestamp"
          title="Timestamp"
          sorter
          defaultSortOrder={getDefaultSortOrder("timestamp", sorters)}
          render={(value) => (
            <DateField value={value * 1000} format="DD/MM/YYYY HH:mm:ss" />
          )}
        />
        <Table.Column
          title="Actions"
          render={(_, record) => (
            <Space>
              <ShowButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};