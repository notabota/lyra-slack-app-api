"use client";

import { Authenticated } from "@refinedev/core";
import { NavigateToResource } from "@refinedev/nextjs-router";
import Register from "./register";
import { Suspense } from "react";
export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Authenticated key="auth-pages" fallback={<Register />}>
        <NavigateToResource resource="protected-products" />
      </Authenticated>
    </Suspense>
  );
}
