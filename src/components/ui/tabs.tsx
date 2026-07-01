"use client";

import { type ReactNode, useState } from "react";

import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
}: {
  tabs: Array<{ label: string; content: ReactNode }>;
}) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2 rounded-lg bg-muted p-1">
        {tabs.map((tab, index) => (
          <button
            className={cn(
              "rounded-md px-3 py-2 text-sm font-bold transition-[transform,background-color,color,box-shadow] duration-300 active:scale-[0.97]",
              active === index ? "bg-card shadow-[0_5px_16px_rgb(16_23_19_/_0.09)]" : "text-muted-foreground hover:text-foreground",
            )}
            key={tab.label}
            onClick={() => setActive(index)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="taxiro-tab-panel" key={active}>{tabs[active]?.content}</div>
    </div>
  );
}
