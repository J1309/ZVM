import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getWelcomeEmailHtml,
  getVerificationEmailHtml,
  getOrderConfirmationEmailHtml,
} from '../convex/emailTemplates.ts';

test('Welcome Email: generates friendly, professional HTML with profile completion CTA', () => {
  const html = getWelcomeEmailHtml({
    userName: 'Sarah Jenkins',
    dashboardUrl: 'https://zoomievan.ca/dashboard',
  });

  assert.ok(html.includes('Sarah Jenkins'), 'Should include user name');
  assert.ok(html.includes('Welcome To The Pack') || html.includes('congratulations on joining ZoomieVan'), 'Should include welcoming headline');
  assert.ok(html.includes('https://zoomievan.ca/dashboard'), 'Should include dashboard link');
  assert.ok(html.includes("Complete Your Dog's Profile"), 'Should have profile completion CTA button');
  assert.ok(html.includes('Dog Vitals'), 'Should mention dog vitals');
  assert.ok(html.includes('Upload Vet Vaccine Record'), 'Should mention vaccination records');
  assert.ok(html.includes('mobile dog fitness gym'), 'Should highlight mobile slatmill perks');
  assert.ok(html.includes('<!DOCTYPE html>'), 'Should be valid HTML document');
});

test('Verification Email: generates approval announcement with session date and payment request', () => {
  const html = getVerificationEmailHtml({
    userName: 'Alex Chen',
    dogName: 'Cooper',
    sessionDate: '2026-09-12',
    timeSlot: '09:00 AM - 10:30 AM',
    dashboardUrl: 'https://zoomievan.ca/dashboard',
  });

  assert.ok(html.includes('Alex Chen'), 'Should include customer name');
  assert.ok(html.includes('Cooper'), 'Should include dog name');
  assert.ok(html.includes('Profile Approved') || html.includes('ready to roll'), 'Should state profile approved');
  assert.ok(html.includes('2026-09-12'), 'Should include session date');
  assert.ok(html.includes('09:00 AM - 10:30 AM'), 'Should include time slot');
  assert.ok(html.includes('$70 CAD'), 'Should specify $70 CAD package rate');
  assert.ok(html.includes('Lock In Session'), 'Should have payment CTA');
});

test('Order Confirmation Email: generates receipt, booking details, and prep guidelines', () => {
  const html = getOrderConfirmationEmailHtml({
    userName: 'Emily Davis',
    dogName: 'Luna',
    planName: 'Founding Member Trial Run (3 Sessions)',
    amountPaid: '$70.00 CAD',
    sessionDate: '2026-09-14',
    timeSlot: '11:00 AM - 12:30 PM',
    address: '123 Forest Hill Rd, Toronto, ON M4V 2L9',
    dashboardUrl: 'https://zoomievan.ca/dashboard',
  });

  assert.ok(html.includes('Emily Davis'), 'Should include customer name');
  assert.ok(html.includes('Luna'), 'Should include dog name');
  assert.ok(html.includes('Founding Member Trial Run (3 Sessions)'), 'Should include plan name');
  assert.ok(html.includes('$70.00 CAD'), 'Should include amount paid');
  assert.ok(html.includes('2026-09-14'), 'Should include scheduled session date');
  assert.ok(html.includes('11:00 AM - 12:30 PM'), 'Should include time slot');
  assert.ok(html.includes('123 Forest Hill Rd'), 'Should include service address');
  assert.ok(html.includes('Session Day Quick Checklist'), 'Should include prep checklist');
  assert.ok(html.includes('View Your Dashboard'), 'Should include button to dashboard');
});
