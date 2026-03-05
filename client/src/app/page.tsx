"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { tokenStore } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const access = tokenStore.getAccessToken();
    router.replace(access ? "/home" : "/sign-in");
  }, [router]);

  return null; // or a loading spinner
}