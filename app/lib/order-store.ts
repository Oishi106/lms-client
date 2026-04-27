import { promises as fs } from 'fs';
import path from 'path';

export type StoredOrder = {
  id: string;
  courseId: string;
  courseTitle: string;
  amount: string;
  buyerName: string;
  buyerEmail: string;
  videoUrl?: string;
  createdAt: number;
  status: 'paid';
  source?: 'real' | 'demo';
};

const storePath = path.join(process.cwd(), 'data', 'course-orders.json');

const ensureStoreDir = async () => {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
};

export const readStoredOrders = async (): Promise<StoredOrder[]> => {
  try {
    const raw = await fs.readFile(storePath, 'utf8');
    const parsed = JSON.parse(raw) as StoredOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeStoredOrder = async (order: StoredOrder): Promise<StoredOrder[]> => {
  const current = await readStoredOrders();
  const next = [order, ...current.filter((item) => item.id !== order.id)];

  await ensureStoreDir();
  await fs.writeFile(storePath, JSON.stringify(next, null, 2), 'utf8');

  return next;
};