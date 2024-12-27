import React from "react";
import { AuthPage } from "@refinedev/antd";
import Link from "next/link";

export default function Login() {
  return (
    <AuthPage
      type="login"
      registerLink={false}
      forgotPasswordLink={false}
      rememberMe={false}
      hideForm={true}
      providers={[
        {
          name: "slack",
          label: "with Slack",
        },
      ]}
    />
  );
}
