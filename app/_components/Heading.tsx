import React from "react";

export default function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-2xl mb-3" style={{ fontWeight: 300 }}>
      {children}
    </h1>
  );
}
