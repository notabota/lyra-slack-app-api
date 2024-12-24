"use client";
import React from "react";
import { Authenticated, Refine } from "@refinedev/core";
import { dataProvider } from "~/providers/data-provider";
import routerProvider from "@refinedev/nextjs-router";
import { RefineThemes, ThemedLayoutV2, ThemedTitleV2, useNotificationProvider } from "@refinedev/antd";

import { App as AntdApp, ConfigProvider } from "antd";

import "@refinedev/antd/dist/reset.css";
import { authProvider } from "~/providers/auth-provider";

export default function RefineLayout({ children }: { children: React.ReactNode }) {
    return (
        <ConfigProvider theme={RefineThemes.Blue}>
            <AntdApp>
                <Refine
                    dataProvider={dataProvider}
                    routerProvider={routerProvider}
                    authProvider={authProvider}
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
                          name: "dashboard",
                          list: "/refine/dashboard",
                          meta: { label: "Dashboard" },
                        },
                        {
                          name: "messages",
                          list: "/refine/messages",
                          show: "/refine/messages/:id",
                          meta: { label: "Messages" },
                        },
                        {
                          name: "messages-count",
                          list: "/refine/messages-count",
                          meta: { label: "Messages Count" },
                        },
                        {
                          name: "reactions-count",
                          list: "/refine/reactions-count",
                          meta: { label: "Reactions Count" },
                        },
                        {
                          name: "files-count",
                          list: "/refine/files-count",
                          meta: { label: "Files Count" },
                        },
                      ]}
                    options={{ syncWithLocation: true }}
                >
                    {children}
                </Refine>
            </AntdApp>
        </ConfigProvider>
    );
}