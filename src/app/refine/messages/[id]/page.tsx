"use client";

import { useShow, useOne } from "@refinedev/core";
import { TextField, NumberField, MarkdownField, DateField, Show } from "@refinedev/antd";

import { Typography } from "antd";

export default function ShowProduct() {
    const {
        query: { data, isLoading },
      } = useShow();
    
      return (
        <Show isLoading={isLoading}>
          <Typography.Title level={5}>Id</Typography.Title>
          <TextField value={data?.data?.id} />
    
          <Typography.Title level={5}>Text</Typography.Title>
          <TextField value={data?.data?.text} />

          <Typography.Title level={5}>Timestamp</Typography.Title>
          <DateField value={data?.data?.timestamp * 1000} format="DD/MM/YYYY HH:mm:ss" />
        </Show>
      );
};