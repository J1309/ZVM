/**
 * Client-side email service for ZoomieVan
 * Dispatches emails directly via Resend if VITE_RESEND_API_KEY is configured,
 * or logs full payloads to console for testing in development/demo mode.
 */

import {
  getWelcomeEmailHtml,
  getVerificationEmailHtml,
  getOrderConfirmationEmailHtml,
} from '../../convex/emailTemplates';

const RESEND_API_KEY = (import.meta as any)?.env?.VITE_RESEND_API_KEY;
const RESEND_FROM = (import.meta as any)?.env?.VITE_RESEND_FROM_EMAIL || 'ZoomieVan <onboarding@resend.dev>';
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://zoomievan.ca';

async function sendClientEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.info(`[Email Service (Local/Dev)] Email simulated to: ${to}\nSubject: ${subject}`);
    return true;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM.trim(),
        to: [to.trim()],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      console.error('[Email Service Error]', errData || res.statusText);
      return false;
    }

    console.info(`[Email Service] Live email delivered to ${to} via Resend.`);
    return true;
  } catch (err) {
    console.error('[Email Service Network Error]', err);
    return false;
  }
}

export async function sendWelcomeEmailClient(to: string, userName: string): Promise<boolean> {
  const dashboardUrl = `${SITE_URL}/dashboard`;
  const html = getWelcomeEmailHtml({ userName, dashboardUrl });
  return sendClientEmail(to, "Welcome to ZoomieVan! Complete Your Dog's Profile 🐾", html);
}

export async function sendVerificationEmailClient(
  to: string,
  userName: string,
  dogName: string,
  sessionDate?: string,
  timeSlot?: string
): Promise<boolean> {
  const dashboardUrl = `${SITE_URL}/dashboard`;
  const html = getVerificationEmailHtml({
    userName,
    dogName,
    sessionDate,
    timeSlot,
    dashboardUrl,
  });
  return sendClientEmail(to, `Great News! ${dogName || 'Your Dog'}'s Profile is Approved & Ready 🐾`, html);
}

export async function sendOrderConfirmationEmailClient(
  to: string,
  userName: string,
  dogName: string,
  planName: string,
  amountPaid: string,
  sessionDate?: string,
  timeSlot?: string,
  address?: string
): Promise<boolean> {
  const dashboardUrl = `${SITE_URL}/dashboard`;
  const html = getOrderConfirmationEmailHtml({
    userName,
    dogName,
    planName,
    amountPaid,
    sessionDate,
    timeSlot,
    address,
    dashboardUrl,
  });
  return sendClientEmail(to, `Order Confirmed! ${dogName || 'Your Dog'}'s Session is Locked 🚐💨`, html);
}
