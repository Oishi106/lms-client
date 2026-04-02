"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  CATEGORIES_STORAGE_KEY,
  DEFAULT_CATEGORIES,
  type CategoryItem,
} from "@/app/lib/categories-data";

const DEFAULT_CATEGORIES_SNAPSHOT = JSON.stringify(DEFAULT_CATEGORIES);

const normalizeCategories = (items: CategoryItem[]): CategoryItem[] => {
  if (!Array.isArray(items) || items.length === 0) return DEFAULT_CATEGORIES;

  const normalizedCategories = items
    .map((item, index) => ({
      id: item.id?.trim() || `category-${index + 1}`,
      label: item.label?.trim() || "",
      icon: item.icon?.trim() || "📚",
      pill: item.pill,
    }))
    .filter((item) => item.label)
    .map((item) => ({
      ...item,
      pill: ["pill-gold", "pill-teal", "pill-violet", "pill-rose"].includes(item.pill)
        ? item.pill
        : "pill-gold",
    }));

  return normalizedCategories.length > 0 ? normalizedCategories : DEFAULT_CATEGORIES;
};

const getClientSnapshot = (): string => {
  const stored = window.localStorage.getItem(CATEGORIES_STORAGE_KEY);
  if (!stored) return DEFAULT_CATEGORIES_SNAPSHOT;

  try {
    return JSON.stringify(normalizeCategories(JSON.parse(stored) as CategoryItem[]));
  } catch {
    return DEFAULT_CATEGORIES_SNAPSHOT;
  }
};

const subscribeCategories = (callback: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === CATEGORIES_STORAGE_KEY) callback();
  };
  const onLocalUpdate = () => callback();

  window.addEventListener("storage", onStorage);
  window.addEventListener("skillforge-categories-updated", onLocalUpdate);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("skillforge-categories-updated", onLocalUpdate);
  };
};

export default function Categories() {
  const categoriesSnapshot = useSyncExternalStore(
    subscribeCategories,
    getClientSnapshot,
    () => DEFAULT_CATEGORIES_SNAPSHOT
  );
  const categories = useMemo(() => JSON.parse(categoriesSnapshot) as CategoryItem[], [categoriesSnapshot]);

  return (
    <section
      className="section"
      id="categories"
      style={{
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border-subtle)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">Categories</span>
          <h2 className="display-lg">
            Learn by <span className="text-gold">category</span>
          </h2>
          <p>
            Pick a category and start with beginner-friendly courses or jump
            straight into advanced tracks.
          </p>
        </div>

        <div className="cat-chip-row" aria-label="Top categories">
          {categories.slice(0, 6).map((c) => (
            <a key={c.id} className="cat-chip" href="#explore">
              <span aria-hidden>{c.icon}</span>
              {c.label}
            </a>
          ))}
        </div>

        <div className="grid-4">
          {categories.map((c) => (
            <div key={c.id} className="d-card cat-card">
              <div className="cat-card-top">
                <div className="cat-icon" aria-hidden>
                  {c.icon}
                </div>
                <span className={`pill ${c.pill}`}>Popular</span>
              </div>
              <h3 className="cat-title">{c.label}</h3>
              <p className="cat-desc">Curated courses and projects to get you job-ready.</p>
              <a className="btn btn-ghost btn-sm" href="#explore">
                Explore →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
