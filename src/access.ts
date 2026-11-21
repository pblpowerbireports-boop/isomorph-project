import { useEffect, useState } from "react";
import type { IsomorphUser } from "@isomorph.ai/app-sdk";
import { isomorph } from "./isomorph.client";

// The signed-in person. `role` is "builder" for whoever built or shares the app — the
// app's own setup, never a business role; a runtime that sends no role means a member.
export type AppUser = IsomorphUser & { role?: "builder" | "member" };

export type Access = { state: "loading" } | { state: "signed-out" } | { state: "ready"; user: AppUser };

/** The access state for what identity.current() answered: undefined while in flight, null when nobody is signed in. */
export function accessFor(user: AppUser | null | undefined): Access {
  if (user === undefined) return { state: "loading" };
  if (user === null) return { state: "signed-out" };
  return { state: "ready", user };
}

export const isBuilder = (user: AppUser): boolean => user.role === "builder";

// `isomorph dev` serves the app on a loopback origin with a test user; a preview or production host is a real sign-in.
export const isLocalRun = (hostname: string): boolean => hostname === "127.0.0.1" || hostname === "localhost" || hostname === "[::1]";

// Resolved once before any data is read, then follows sign-in changes. Rules: core.md in the isomorph skill (identity).
export function useAccess(): Access {
  const [user, setUser] = useState<AppUser | null | undefined>(undefined);
  useEffect(() => {
    isomorph.identity.current().then(setUser, error => { console.error(error); setUser(null); });
    return isomorph.identity.onChange(setUser);
  }, []);
  return accessFor(user);
}
