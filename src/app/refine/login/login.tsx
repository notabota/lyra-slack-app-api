import React from "react";
import { AuthPage } from "@refinedev/antd";

export default function Login() {
  return (
    <AuthPage
      type="login"
      formProps={{
        initialValues: {
          email: "demo@demo.com",
          password: "demodemo",
        },
      }}
    />
  );
};