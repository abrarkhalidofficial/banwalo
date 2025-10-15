"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to sign-in page by default
    router.push("/sign-in");
  }, [router]);
  
  return null; // No UI needed as we're redirecting
}
