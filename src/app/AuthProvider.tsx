"use client";
import React, { createContext, useEffect, useState } from "react";
import {
  FetchUserAttributesOutput,
  getCurrentUser,
  fetchUserAttributes,
} from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { Amplify } from "aws-amplify";
import config from "./../amplifyconfiguration.json";

type AuthContextType = {
  user: FetchUserAttributesOutput | null;
  customState: string | null;
  authError: unknown;
};

Amplify.configure(config);

export const AuthContext = createContext<AuthContextType>({
  user: null,
  customState: null,
  authError: undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FetchUserAttributesOutput | null>(null);
  const [authError, setAuthError] = useState<unknown>(null);
  const [customState, setCustomState] = useState<string | null>(null);

  const getUser = async (): Promise<void> => {
    try {
      const userInfo = await fetchUserAttributes();
      setUser(userInfo);
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
