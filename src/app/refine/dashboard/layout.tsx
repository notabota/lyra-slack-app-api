"use client";
import React from "react";
import { Authenticated } from "@refinedev/core";
import { ThemedLayoutV2, ThemedTitleV2 } from "@refinedev/antd";

import "@refinedev/antd/dist/reset.css";

export default function RefineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Authenticated key="authenticated-routes" redirectOnFail="/refine/login">
      <ThemedLayoutV2
        Title={(props) => <ThemedTitleV2 {...props} text="Lyratatouille" />}
      >
        {children}
      </ThemedLayoutV2>
    </Authenticated>
  );
}
