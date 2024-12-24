import React from "react";
import { useLogout, useGetIdentity } from "@refinedev/core";

interface Identity {
  name?: string;
}

export const Header = () => {
  const { mutate, isLoading } = useLogout();
  const { data: identity } = useGetIdentity<Identity>();

  return (
    <>
      <h2>
        <span>Welcome, </span>
        <span>{identity?.name ?? ""}</span>
      </h2>
      <button type="button" disabled={isLoading} onClick={() => mutate()}>
        Logout
      </button>
    </>
  );
};