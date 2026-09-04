"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import {
  getWelcomeEmailHtml,
  getVerificationEmailHtml,
  getOrderConfirmationEmailHtml,
} from "./emailTemplates";

const DEFAULT_FROM = "ZoomieVan <onboarding@resend.dev>";
const DEFAULT_SITE_URL = "https://zoomievan.ca";

async function sendViaResend(to: string, subject: string, html: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;

  if (!apiKey) {
    console.warn(`[Resend] RESEND_API_KEY is not set. Mocking email delivery to: ${to} (Subject: "${subject}")`);
    return { success: true, id: "mock-resend-id" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: from.trim(),
        to: [to.trim()],
        subject,
        html,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || response.statusText || `HTTP ${response.status}`;
      console.error(`[Resend Error] Failed sending email to ${to}: ${errorMsg}`, data);
      return { success: false, error: errorMsg };
    }

    console.log(`[Resend Success] Email sent to ${to} (ID: ${data?.id})`);
    return { success: true, id: data?.id };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error(`[Resend Network Error] Could not reach Resend API: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Action 1: Send Welcome & Profile Completion Email
 */
export const sendWelcomeEmail = internalAction({
  args: {
    to: v.string(),
    userName: v.string(),
  },
  handler: async (_ctx, args) => {
    const siteUrl = process.env.SITE_URL || DEFAULT_SITE_URL;
    const dashboardUrl = `${siteUrl.replace(/\/$/, "")}/dashboard`;
    const html = getWelcomeEmailHtml({
      userName: args.userName,
      dashboardUrl,
    });

    return await sendViaResend(
      args.to,
      "Welcome to ZoomieVan! Complete Your Dog's Profile 🐾",
      html
    );
  },
});

/**
 * Action 2: Send Account Verified & Payment Request Email
 */
export const sendVerificationEmail = internalAction({
  args: {
    to: v.string(),
    userName: v.string(),
    dogName: v.string(),
    sessionDate: v.optional(v.string()),
    timeSlot: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const siteUrl = process.env.SITE_URL || DEFAULT_SITE_URL;
    const dashboardUrl = `${siteUrl.replace(/\/$/, "")}/dashboard`;
    const html = getVerificationEmailHtml({
      userName: args.userName,
      dogName: args.dogName,
      sessionDate: args.sessionDate,
      timeSlot: args.timeSlot,
      dashboardUrl,
    });

    return await sendViaResend(
      args.to,
      `Great News! ${args.dogName || "Your Dog"}'s Profile is Approved & Ready 🐾`,
      html
    );
  },
});

/**
 * Action 3: Send Order & Booking Confirmation Email
 */
export const sendOrderConfirmationEmail = internalAction({
  args: {
    to: v.string(),
    userName: v.string(),
    dogName: v.string(),
    planName: v.string(),
    amountPaid: v.string(),
    sessionDate: v.optional(v.string()),
    timeSlot: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const siteUrl = process.env.SITE_URL || DEFAULT_SITE_URL;
    const dashboardUrl = `${siteUrl.replace(/\/$/, "")}/dashboard`;
    const html = getOrderConfirmationEmailHtml({
      userName: args.userName,
      dogName: args.dogName,
      planName: args.planName,
      amountPaid: args.amountPaid,
      sessionDate: args.sessionDate,
      timeSlot: args.timeSlot,
      address: args.address,
      dashboardUrl,
    });

    return await sendViaResend(
      args.to,
      `Order Confirmed! ${args.dogName || "Your Dog"}'s Session is Locked 🚐💨`,
      html
    );
  },
});
