"use client";

import { Authenticated } from "@refinedev/core";
import { NavigateToResource } from "@refinedev/nextjs-router";
import Login from "./login";

export default function LoginPage() {
  return (
    <Authenticated key="auth-pages" fallback={<Login />}>
      <NavigateToResource resource="protected-products" />
    </Authenticated>
  );
}
