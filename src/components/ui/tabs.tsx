"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  children: (activeTab: string) => ReactNode;
  className?: string;
}

export function Tabs({ tabs, defaultTab, onChange, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || "");

  function handleChange(tabId: string) {
    setActiveTab(tabId);
    onChange?.(tabId);
  }

  return (
    <div className={className}>
      <div className="flex gap-1 border-b border-stone-200 dark:border-stone-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleChange(tab.id)}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "text-brand-600 dark:text-brand-400"
                : "text-stone-500 hover:text-anthracite-700 dark:text-stone-400 dark:hover:text-stone-200"
            )}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    activeTab === tab.id
                      ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                      : "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 dark:bg-brand-400" />
            )}
          </button>
        ))}
      </div>
      <div className="pt-4">{children(activeTab)}</div>
    </div>
  );
}
