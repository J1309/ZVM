import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const pages = {
  privacy: {
    title: 'Privacy Policy',
    updated: 'Draft for launch review',
    sections: [
      ['Data we collect', 'Account profile, contact details, address, dog profile, booking details, vaccine status, and support messages when you provide them.'],
      ['How we use data', 'To provide mobile dog fitness services, manage bookings, verify safety requirements, support customers, prevent abuse, and improve the product.'],
      ['Storage and processors', 'Production storage must be configured in the client-owned backend before launch. Do not collect real customer data until that backend is active.'],
      ['Your choices', 'Customers must be able to request access, correction, deletion, and support through a monitored contact channel before public launch.'],
    ],
  },
  terms: {
    title: 'Terms of Service',
    updated: 'Draft for launch review',
    sections: [
      ['Service scope', 'ZoomieVan provides mobile canine fitness sessions subject to service-area availability, scheduling, handler safety review, and vaccine requirements.'],
      ['Accounts', 'Customers are responsible for accurate profile, address, dog, and contact information.'],
      ['Owner responsibility', 'The dog owner or authorized caregiver remains responsible for determining whether the dog is healthy, suitable, and safe to participate. ZoomieVan may refuse, pause, or stop service if a dog appears unwell, unsafe, reactive, distressed, or otherwise unsuitable for a session.'],
      ['Non-refundable payments', 'All paid bookings, packages, deposits, and service fees are non-refundable unless ZoomieVan cancels the service and chooses, at its sole discretion, to issue a credit, reschedule, or refund. Missed appointments, late cancellations, inaccurate information, refusal for safety reasons, or owner-requested cancellations are not refundable.'],
      ['No guarantee of results', 'ZoomieVan does not guarantee specific fitness, behavioral, weight-loss, health, or training outcomes. Sessions are designed as supervised exercise support and are not veterinary care, medical treatment, or behavior therapy.'],
      ['Limitation of liability', 'To the fullest extent permitted by law, ZoomieVan, its owners, handlers, contractors, and affiliates are not responsible for injury, illness, escape, stress, behavioral incidents, property damage, indirect losses, or other claims arising from participation in or inability to participate in the service.'],
      ['Final review required', 'These terms are draft business-protection language and must be reviewed by qualified legal counsel before public launch.'],
    ],
  },
  waiver: {
    title: 'Liability Waiver',
    updated: 'Draft for launch review',
    sections: [
      ['Acknowledgement of risk', 'Dog fitness activity can involve physical risk, including fatigue, stress, muscle strain, slips, illness, escape, reactivity, or injury. Owners accept these inherent risks when requesting or allowing service.'],
      ['Owner disclosure duty', 'Owners must disclose health conditions, medication, age concerns, prior injuries, aggression, bite history, fear, anxiety, reactivity, heat sensitivity, pregnancy, recent surgery, or any other issue that could affect safe participation.'],
      ['Dog safety responsibility', 'The owner acknowledges that ZoomieVan provides supervised mobile fitness support, but the owner remains responsible for the dog\'s health, suitability, behavior, and safety before, during, and after the session. ZoomieVan is not a veterinarian and does not provide medical clearance.'],
      ['Right to refuse or stop service', 'ZoomieVan may refuse, pause, shorten, or stop a session at any time if the handler believes continuing could be unsafe, unsuitable, or stressful for the dog, handler, property, or public. Such safety-based decisions do not create a refund obligation.'],
      ['Release of claims', 'To the fullest extent permitted by law, the owner releases ZoomieVan, its owners, handlers, contractors, and affiliates from claims, costs, damages, or losses connected to the dog\'s participation, except where a release is not permitted by applicable law.'],
      ['Health and vaccines', 'Dogs may be refused service if vaccine, parasite-prevention, health, or behavior requirements are incomplete or unsafe for the session.'],
      ['Media consent', 'Photo/video consent must include a clear opt-out path before production launch.'],
      ['Review required', 'This waiver should be finalized by the business owner and legal counsel before being used with customers.'],
    ],
  },
  pipeda: {
    title: 'PIPEDA Compliance',
    updated: 'Draft for launch review',
    sections: [
      ['Accountability', 'Assign a privacy owner before launch.'],
      ['Consent', 'Collect consent for account data, service communications, vaccine status, and media separately where appropriate.'],
      ['Safeguards', 'Move all customer records from browser storage to the production backend with access controls and audit logs.'],
      ['Access and deletion', 'Define and document customer data access, correction, deletion, and retention workflows.'],
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    updated: 'Draft for launch review',
    sections: [
      ['Current use', 'The current frontend uses browser storage for demo account state. Production must replace this with secure backend-managed auth.'],
      ['Analytics', 'Analytics and monitoring tools should be documented here before they are enabled.'],
      ['Control', 'Add consent controls if non-essential cookies or tracking tools are introduced.'],
    ],
  },
  support: {
    title: 'Support',
    updated: 'Launch contact placeholder',
    sections: [
      ['Contact', 'Email support@zoomievaninc.com or call +1 (587) 568-4967 for account, booking, privacy, and safety requests.'],
      ['Response ownership', 'Assign a monitored support owner and response target before public launch.'],
      ['Urgent safety issues', 'Create an incident escalation path for service, animal safety, privacy, and payment issues before production launch.'],
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
