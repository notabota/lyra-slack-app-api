"use client";

import { Authenticated } from "@refinedev/core";
import { NavigateToResource } from "@refinedev/nextjs-router";
import Login from "./login";
import { Suspense } from "react";
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Authenticated key="auth-pages" fallback={<Login />}>
        <NavigateToResource resource="protected-products" />
      </Authenticated>
    </Suspense>
  );
}
