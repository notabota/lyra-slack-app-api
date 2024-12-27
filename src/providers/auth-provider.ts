import { AuthProvider } from "@refinedev/core";
import { signIn, signOut, getSession } from "next-auth/react";

export const authProvider: AuthProvider = {
  onError: async (error) => {
    if (error?.status === 401) {
      return {
        logout: true,
        error: new Error("Unauthorized"),
      };
    }
    return {};
  },
  getIdentity: async () => {
    const session = await getSession();
    if (!session?.user) return null;
    
    return {
      id: 1,
      name: session.user.name,
      email: session.user.email,
      avatar: session.user.image,
    };
  },
  logout: async () => {
    await signOut({ redirect: false });
    return { success: true, redirectTo: "/refine/login" };
  },
  login: async ({ providerName }) => {
    const result = await signIn(providerName, {
      redirect: false,
      callbackUrl: "/refine"
    });

    if (result?.ok) {
      return { success: true, redirectTo: "/refine" };
    }

    return { success: false };
  },
  check: async () => {
    const session = await getSession();
    return { authenticated: !!session };
  },
  getPermissions: async () => null,
};