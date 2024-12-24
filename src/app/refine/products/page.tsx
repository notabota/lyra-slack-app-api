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
} from "@refinedev/antd";

import { Table, Space, Input, Select } from "antd";

export default function ListProducts() {
    const { tableProps, filters, sorters } = useTable({
        sorters: { initial: [{ field: "id", order: "asc" }] },
        filters: {
          initial: [{ field: "category.id", operator: "eq", value: 2 }],
        },
        syncWithLocation: true,
      });
    
      const { data: categories, isLoading } = useMany({
        resource: "categories",
        ids: tableProps?.dataSource?.map((product) => product.category?.id) ?? [],
      });

      console.log(tableProps?.dataSource);
    
      const { selectProps } = useSelect({
        resource: "categories",
        defaultValue: getDefaultFilter("category.id", filters, "eq"),
      });
    
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
              dataIndex="name"
              title="Name"
              sorter
              defaultSortOrder={getDefaultSortOrder("name", sorters)}
              filterDropdown={(props) => (
                <FilterDropdown {...props}>
                  <Input />
                </FilterDropdown>
              )}
            />
            <Table.Column
              dataIndex={["category", "id"]}
              title="Category"
              render={(value) => {
                if (isLoading) {
                  return "Loading...";
                }
    
                return categories?.data?.find((category) => category.id == value)
                  ?.title;
              }}
              filterDropdown={(props) => (
                <FilterDropdown
                  {...props}
                  mapValue={(selectedKey) => Number(selectedKey)}
                >
                  <Select style={{ minWidth: 200 }} {...selectProps} />
                </FilterDropdown>
              )}
              defaultFilteredValue={getDefaultFilter("category.id", filters, "eq")}
            />
            <Table.Column dataIndex="material" title="Material" />
            <Table.Column dataIndex="price" title="Price" />
            <Table.Column
              title="Actions"
              render={(_, record) => (
                <Space>
                  <ShowButton hideText size="small" recordItemId={record.id} />
                  <EditButton hideText size="small" recordItemId={record.id} />
                </Space>
              )}
            />
          </Table>
        </List> 
  );
};