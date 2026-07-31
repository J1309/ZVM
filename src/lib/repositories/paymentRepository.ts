import { getItem } from '../db';
import { Payment } from '../types';
import { api, convex } from '../convexClient';

export async function getAllPayments(): Promise<Payment[]> {
  if (convex) return convex.query(api.payments.listAll);
  return getItem<Payment[]>('payments') ?? [];
}
