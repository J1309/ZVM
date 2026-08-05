import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const pages = {
  privacy: {
    title: 'Privacy Policy',
    updated: 'Effective August 2026',
    sections: [
      ['Data We Collect', 'ZoomieVan Inc. collects customer personal details necessary to deliver mobile dog fitness services, including full owner name, phone number, email address, physical delivery address, postal code/FSA, dog health and profile details (name, breed, weight, age, energy level, reactivity notes), vaccine documentation, payment records, and customer service communications.'],
      ['How We Use Your Information', 'Your information is used strictly to schedule and deliver doorstep mobile fitness sessions, verify canine health and vaccine compliance, process secure payments via Stripe, send automated session reminders, enforce service area boundaries, and communicate critical service updates.'],
      ['Data Storage & Protection', 'Customer account details, vaccine records, and reservation data are securely transmitted and stored using industry-standard encrypted database architecture. Payment details are handled directly by PCI-DSS compliant payment processor Stripe; ZoomieVan Inc. does not store raw credit card credentials.'],
      ['Third-Party Service Sharing', 'We do not sell, rent, or trade customer data. Personal details are shared only with trusted infrastructure providers (e.g., Clerk authentication, Convex database, Stripe payments, Vercel hosting) strictly as required to fulfill service operations.'],
      ['Your Rights & Choices', 'Customers may review, update, or request deletion of their personal information and dog profiles at any time through their User Account dashboard or by contacting our Privacy Officer at privacy@zoomievaninc.com.'],
    ],
  },
  terms: {
    title: 'Terms of Service',
    updated: 'Effective August 2026',
    sections: [
      ['Service Scope & Delivery', 'ZoomieVan Inc. operates mobile canine fitness vans offering structured, non-motorized slatmill exercise sessions at the customer\'s specified service address within active Edmonton and Alberta service regions.'],
      ['Account & Profile Accuracy', 'Customers are responsible for providing truthful, accurate, and complete information regarding owner contact details, delivery address, and dog physical health, weight, age, and behavioral background.'],
      ['Canine Health & Handler Safety Review', 'The owner or authorized handler remains solely responsible for ensuring the dog is physically fit for exercise. ZoomieVan handlers reserve the absolute right to pause, shorten, refuse, or cancel any session if a dog displays signs of severe fatigue, heat distress, illness, aggression, or unhandled reactivity.'],
      ['Booking & Cancellation Policy', 'All scheduled runs, package purchases, and trial sessions are final and non-refundable. Rescheduling requests must be made at least 24 hours prior to a scheduled session window. Missed pickups, late cancellations, inaccurate address entries, or handler safety refusals are non-refundable.'],
      ['Limitation of Liability', 'To the fullest extent permitted under Canadian federal and Alberta law, ZoomieVan Inc., its officers, employees, mobile handlers, and affiliates shall not be liable for any direct, indirect, incidental, or consequential damages, injuries, or losses arising from participation in mobile exercise sessions.'],
    ],
  },
  waiver: {
    title: 'Liability Waiver & Release',
    updated: 'Effective August 2026',
    sections: [
      ['Assumption of Fitness Activity Risks', 'The owner explicitly understands that canine exercise on slatmills involves inherent physical risks including, but not limited to, muscle fatigue, minor soreness, slips, stress, or unexpected behavioral reactions. Owners voluntarily assume all risks associated with their dog\'s participation.'],
      ['Mandatory Health & Behavioral Disclosure', 'Owners must fully disclose any known medical conditions, prior surgeries, joint issues, cardiac conditions, medications, extreme heat sensitivity, aggression toward handlers, or bite history before any session.'],
      ['Handler Safety Discretion', 'Handlers maintain full authority to adjust treadmill pace, restrict workout duration, or stop a session immediately if continuing poses any risk to the dog or handler. Safety-based session stops do not entitle the customer to a refund.'],
      ['Release of Legal Claims', 'The owner hereby waives, releases, and forever discharges ZoomieVan Inc., its directors, employees, and mobile handlers from any and all liabilities, claims, lawsuits, or medical expenses resulting from participation in ZoomieVan fitness programs.'],
      ['Media Release & Opt-Out', 'By booking a session, owners consent to the creation and use of non-identifying photos or videos of their dog for operational updates and marketing, unless an explicit written opt-out request is submitted to support@zoomievaninc.com prior to the run.'],
    ],
  },
  pipeda: {
    title: 'PIPEDA & Canadian Privacy Compliance',
    updated: 'Effective August 2026',
    sections: [
      ['Accountability & Compliance Officer', 'ZoomieVan Inc. strictly adheres to the Personal Information Protection and Electronic Documents Act (PIPEDA) of Canada. Our Privacy Officer oversees data protection practices and ensures full regulatory compliance.'],
      ['Explicit Customer Consent', 'We obtain meaningful consent before collecting personal contact details, physical delivery locations, or canine health records. Consent may be modified or withdrawn at any time.'],
      ['Access Rights & Correction', 'Canadian residents have the statutory right to request access to their personal file, examine stored records, and demand prompt correction of inaccuracies.'],
      ['Data Retention & Destruction', 'Personal and payment records are retained only as long as necessary to fulfill active subscriptions, legal tax obligations, and service audits, after which records are securely purged.'],
    ],
  },
  cookies: {
    title: 'Cookie & Tracking Policy',
    updated: 'Effective August 2026',
    sections: [
      ['Essential Cookies & Storage', 'ZoomieVan Inc. uses essential browser session cookies and local state storage exclusively for account authentication, maintaining security tokens, and preserving user interface preferences.'],
      ['No Third-Party Ad Tracking', 'We do not employ invasive third-party tracking cookies or sell visitor browsing behavior to external advertising brokers.'],
      ['Managing Browser Preferences', 'Users may adjust browser settings to block or clear cookies; however, disabling essential session tokens may limit access to account booking features.'],
    ],
  },
  support: {
    title: 'Customer Support & Contact',
    updated: 'Effective August 2026',
    sections: [
      ['Official Support Channels', 'For booking inquiries, schedule changes, vaccine uploads, or account assistance, contact ZoomieVan Inc. via email at support@zoomievaninc.com or phone at +1 (587) 568-4967.'],
      ['Support Hours', 'Customer support is active Monday through Saturday from 8:00 AM to 6:00 PM MT. Inquiries received after hours will be responded to on the next business day.'],
      ['Urgent Handler Communications', 'For urgent doorstep access, route timing, or session safety inquiries on active run days, clients may call or SMS our dispatch line directly.'],
    ],
  },
};

type PageKey = keyof typeof pages;

export default function LegalPage() {
  const { page = 'privacy' } = useParams();
  const content = pages[page as PageKey] ?? pages.privacy;

  return (
    <main className="min-h-screen bg-dark-900 px-4 pb-20 pt-28 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-dark-300 hover:text-brand-400">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-brand-400">ZoomieVan</p>
            <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{content.title}</h1>
            <p className="mt-2 text-sm text-dark-400">{content.updated}</p>
          </div>
        </div>

        <div className="space-y-5">
          {content.sections.map(([title, body]) => (
            <section key={title} className="rounded-xl border border-dark-600 bg-dark-800/40 p-5">
              <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-dark-200">{body}</p>
            </section>
          ))}
        </div>

        <p className="mt-8 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          This page is a production-readiness draft. Final legal, privacy, and support language should be approved before public launch.
        </p>
      </div>
    </main>
  );
}
