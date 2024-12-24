"use client";

import { useForm, useSelect, SaveButton, Create } from "@refinedev/antd";

import { Form, Input, Select, InputNumber } from "antd";

export default function CreateProduct() {
  const { formProps, saveButtonProps } = useForm({
    redirect: "edit",
  });

  const { selectProps } = useSelect({
    resource: "categories",
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="Name" name="name">
          <Input />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <Input.TextArea />
        </Form.Item>
        <Form.Item label="Material" name="material">
          <Input />
        </Form.Item>
        <Form.Item label="Category" name={["category", "id"]}>
          <Select {...selectProps} />
        </Form.Item>
        <Form.Item label="Price" name="price">
          <InputNumber step="0.01" stringMode />
        </Form.Item>
      </Form>
    </Create>
  );
};