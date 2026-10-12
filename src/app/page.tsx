"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { readSession } from "@/features/auth";
import { routes } from "@/shared/constants/routes";

/**
 * Root boot: a stored session goes straight to the dashboard — the app's
 * refresh flow re-validates it there — and everything else hands off to the
 * login page. A stored session is NOT proof of validity (the destination
 * owns that), so this page only ever routes, never gates.
 */
export default function RootPage() {
  const router = useRouter();
  const routedRef = useRef(false);

  useEffect(() => {
    if (routedRef.current) {
      return;
    }
    routedRef.current = true;
    router.replace(readSession() ? routes.dashboard : routes.login);
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#004e77] p-6">
      <Skeleton className="h-64 w-full max-w-sm rounded-md bg-white/10" />
    </main>
  );
}
