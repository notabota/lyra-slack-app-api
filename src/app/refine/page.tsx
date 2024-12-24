"use client";

import { Authenticated, Refine } from "@refinedev/core";

import { dataProvider } from "~/providers/data-provider";
import { authProvider } from "~/providers/auth-provider";

import { Header } from "~/components/header";
import { NavigateToResource } from "@refinedev/nextjs-router";
import { ThemedTitleV2 } from "@refinedev/antd";
import { ThemedLayoutV2 } from "@refinedev/antd";

export default function App(): JSX.Element {
    return (
        <Authenticated
            key="authenticated-routes"
            redirectOnFail="/refine/login"
        >
            <ThemedLayoutV2 Title={(props) => (
                <ThemedTitleV2 {...props} text="Lyratatouille" />
            )}>
                <NavigateToResource resource="protected-products" />
            </ThemedLayoutV2>
            </Authenticated>
    );
}
