"use client";
import React, { Suspense } from "react";
import { Authenticated, Refine } from "@refinedev/core";
import { dataProvider } from "~/providers/data-provider";
import routerProvider from "@refinedev/nextjs-router";
import { RefineThemes, ThemedLayoutV2, ThemedTitleV2, useNotificationProvider } from "@refinedev/antd";

import { App as AntdApp, ConfigProvider } from "antd";

import "@refinedev/antd/dist/reset.css";
import { authProvider } from "~/providers/auth-provider";

export default function RefineLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfigProvider theme={RefineThemes.Blue}>
        <AntdApp>
          <Refine
            dataProvider={dataProvider}
            routerProvider={routerProvider}
            // authProvider={authProvider}
            notificationProvider={useNotificationProvider}
            resources={[
              // {
              //   name: "protected-products",
              //   list: "/refine/products",
              //   show: "/refine/products/:id",
              //   edit: "/refine/products/:id/edit",
              //   create: "/refine/products/create",
              //   meta: { label: "Products" },
              // },
              {
                name: "trivia",
                list: "/refine/trivia",
                meta: { label: "Trivia" },
              },
              {
                name: "dashboard",
                list: "/refine/dashboard",
                meta: { label: "Dashboard" },
              },
              {
                name: "interactivity",
                list: "/refine/interactivity",
                meta: { label: "Interactivity" },
              },
              {
                name: "messages",
                list: "/refine/messages",
                show: "/refine/messages/:id",
                meta: { label: "Messages" },
              },
            ]}
            options={{ syncWithLocation: true }}
          >
            {children}
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </Suspense>
  );
}
