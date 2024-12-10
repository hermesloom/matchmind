"use client";

import React from "react";
import { NextUIProvider } from "@nextui-org/system";
import { useRouter } from "next/navigation";
import { PromptProvider } from "./_components/PromptContext";

export interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const router = useRouter();

  return (
    <NextUIProvider navigate={router.push}>
      <PromptProvider>{children}</PromptProvider>
    </NextUIProvider>
  );
}
