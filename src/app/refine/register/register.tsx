import React from "react";
import { AuthPage } from "@refinedev/antd";
import Link from "next/link";

export default function Register() {
  return (
      <AuthPage
      type="register"
      formProps={{
        initialValues: {
          email: "demo@demo.com",
          password: "demodemo",
        },
      }}
      loginLink={
        <div
          style={{
            marginTop: 5,
            padding: 5,
          }}
        >
          <Link href="/refine/login">Sign In</Link>
        </div>
      }
    />
  );
};