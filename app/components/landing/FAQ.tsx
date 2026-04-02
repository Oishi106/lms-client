"use client";

import { useMemo, useSyncExternalStore } from 'react';
import { DEFAULT_FAQS, FAQ_STORAGE_KEY, type FaqItem } from '@/app/lib/faq-data';

const DEFAULT_FAQS_SNAPSHOT = JSON.stringify(DEFAULT_FAQS);

const normalizeFaqs = (items: FaqItem[]): FaqItem[] => {
  if (!Array.isArray(items) || items.length === 0) return DEFAULT_FAQS;
  const normalizedFaqs = items
    .map((item) => ({ q: item.q?.trim() ?? '', a: item.a?.trim() ?? '' }))
    .filter((item) => item.q && item.a);
  return normalizedFaqs.length > 0 ? normalizedFaqs : DEFAULT_FAQS;
};

const getClientSnapshot = (): string => {
  const storedFaqs = window.localStorage.getItem(FAQ_STORAGE_KEY);
  if (!storedFaqs) return DEFAULT_FAQS_SNAPSHOT;

  try {
    return JSON.stringify(normalizeFaqs(JSON.parse(storedFaqs) as FaqItem[]));
  } catch {
    return DEFAULT_FAQS_SNAPSHOT;
  }
};

const subscribeFaqs = (callback: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === FAQ_STORAGE_KEY) callback();
  };
  const onLocalUpdate = () => callback();

  window.addEventListener('storage', onStorage);
  window.addEventListener('skillforge-faq-updated', onLocalUpdate);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('skillforge-faq-updated', onLocalUpdate);
  };
};

export default function FAQ() {
  const faqSnapshot = useSyncExternalStore(subscribeFaqs, getClientSnapshot, () => DEFAULT_FAQS_SNAPSHOT);
  const faqs = useMemo(() => JSON.parse(faqSnapshot) as FaqItem[], [faqSnapshot]);

  return (
    <section
      className="section"
      id="faq"
      style={{
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">FAQ</span>
          <h2 className="display-lg">
            Quick <span className="text-gold">answers</span>
          </h2>
          <p>
            Common questions about learning, instructors, and getting started.
          </p>
        </div>

        <div className="faq-grid">
          {faqs.map((item, idx) => (
            <details key={item.q} className="faq-item" open={idx === 0}>
              <summary className="faq-q">
                <span>{item.q}</span>
                <span className="faq-icon" aria-hidden>
                  +
                </span>
              </summary>
              <div className="faq-a">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
