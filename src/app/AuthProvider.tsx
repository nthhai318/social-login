"use client";
import React, { createContext, useEffect, useState } from "react";
import { AuthUser, getCurrentUser } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";

type AuthContextType = {
  user: AuthUser | null;
  customState: string | null;
  authError: unknown;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  customState: null,
  authError: undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState<unknown>(null);
  const [customState, setCustomState] = useState<string | null>(null);

  const getUser = async (): Promise<void> => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error(error);
      console.log("Not signed in");
    }
  };

  useEffect(() => {
    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      switch (payload.event) {
        case "signInWithRedirect":
          getUser();
          break;
        case "signInWithRedirect_failure":
          setAuthError("An error has occurred during the OAuth flow.");
          break;
        case "customOAuthState":
          setCustomState(payload.data);
          break;
      }
    });

    getUser();

    return unsubscribe;
  }, []);

  console.log("user: ", user);
  console.log("customState: ", customState);

  return (
    <AuthContext.Provider
      value={{
        authError,
        customState,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}