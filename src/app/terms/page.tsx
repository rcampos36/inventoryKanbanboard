import Link from "next/link";

export const dynamic = "force-static";

const LAST_UPDATED = "August 4, 2026";

export default function TermsOfUsePage() {
  return (
    <main className="min-h-screen bg-sand text-brand">
      <header className="border-b border-peach/50 bg-[var(--salestower-surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Link
            href="/"
            className="font-[family-name:var(--font-syne)] text-xl font-extrabold tracking-tight text-brand"
          >
            SalesTower
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-peach/70 px-3 py-2 text-sm font-semibold text-brand hover:bg-peach/35"
          >
            Back home
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-wider text-brand/50">
          Legal
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight text-brand sm:text-4xl">
          Terms of Use
        </h1>
        <p className="mt-2 text-sm text-brand/60">Last updated: {LAST_UPDATED}</p>

        <div className="prose-salestower mt-10 space-y-8 text-sm leading-relaxed text-brand/85 sm:text-[15px]">
          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-brand">
              1. Agreement
            </h2>
            <p>
              These Terms of Use (“Terms”) govern access to and use of
              SalesTower, including the marketing website, dealership dashboards,
              reports, admin tools, demo request forms, and the public interactive
              demo board (together, the “Service”), operated by SalesTower
              (“we,” “us,” or “our”).
            </p>
            <p>
              By creating an account, accessing a dealership workspace, submitting
              a demo request, or using the Service, you agree to these Terms. If
              you are using the Service on behalf of a dealership or other
              organization, you represent that you have authority to bind that
              organization, and “you” includes that organization.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-brand">
              2. What SalesTower is
            </h2>
            <p>
              SalesTower is an operational dashboard for automotive dealerships.
              It is designed to help sales managers and authorized staff view and
              manage:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>New and used inventory by model and workflow lanes</li>
              <li>Sales assignments, daily sales, and month-to-date pacing</li>
              <li>Working deals, manager demos, and overnight customer demos</li>
              <li>Team structure (salespeople and managers)</li>
              <li>Historical movement and sales reporting within the Service</li>
            </ul>
            <p>
              SalesTower is a management and visibility tool. It is not a
              substitute for your DMS, OEM systems, accounting software, legal
              compliance processes, or official vehicle title/registration
              records.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-brand">
              3. Accounts and dealership workspaces
            </h2>
            <p>
              Access to a production dealership board requires registration or an
              invitation from an administrator of that dealership workspace. Each
              workspace is intended for one dealership / organization and is
              separated from other customers’ data.
            </p>
            <p>
              You must provide accurate account information, keep login
              credentials confidential, and promptly notify us if you suspect
              unauthorized access. Administrators are responsible for managing
              user access (including adding, removing, and assigning admin vs.
              standard roles) for their organization.
            </p>
            <p>
              You are responsible for all activity that occurs under accounts
              issued to your organization.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-brand">
              4. Your data and content
            </h2>
            <p>
              You retain ownership of inventory, sales, personnel, and other
              business data you enter or import into your dealership workspace
              (“Customer Data”). You grant us a limited license to host, process,
              display, and back up Customer Data solely to provide and improve the
              Service for your organization.
            </p>
            <p>
              You represent that you have the right to upload and process Customer
              Data in the Service, including vehicle information, staff names, and
              any files you import (for example spreadsheet inventory uploads).
              Do not upload unlawful, infringing, or unrelated personal data.
            </p>
            <p>
              Sales and board history stored by the Service (including sale dates
              and movement logs used for reports) may remain available for your
              organization’s reporting even if a vehicle is later moved on the
              board, subject to these Terms and your account status.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-brand">
              5. Acceptable use
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Access another dealership’s workspace or data without
                authorization
              </li>
              <li>
                Share login credentials or allow unauthorized personnel to use
                the Service
              </li>
              <li>
                Attempt to probe, disrupt, reverse engineer, or overload the
                Service
              </li>
              <li>
                Use the Service to store or transmit malware or unlawful content
              </li>
              <li>
                Misrepresent sales, inventory status, or demo/overnight vehicle
                assignments in a way intended to defraud your organization or
                third parties
              </li>
              <li>
                Use the demo board as a production system of record for real
                dealership operations
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-brand">
              6. Interactive demo
            </h2>
            <p>
              The Service may include a password-protected interactive demo (for
              example at /demo) with sample inventory for sales and evaluation
              purposes. Demo board activity is in-memory / non-production and is
              not a substitute for a registered dealership workspace. Do not
              enter real customer personal information, credentials, or
              confidential store data into the demo.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-brand">
              7. Demo and contact requests
            </h2>
            <p>
              If you submit a “Schedule a Demo” or similar request, you consent to
              us contacting you at the email and phone details you provide about
              SalesTower. You agree the information you submit is accurate and
              that you are authorized to receive that outreach.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-brand">
              8. Third-party systems and imports
            </h2>
            <p>
              You may import inventory files or, in the future, connect
              third-party systems (such as a CRM or inventory platform). You are
              responsible for the accuracy of imported data and for complying with
              those third parties’ terms. We are not responsible for outages,
              data errors, or policy changes of third-party providers.
            </p>
            <p>
              Duplicate stock numbers already present in your workspace are
              typically skipped on re-import; you remain responsible for verifying
              that your board reflects your lot.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-brand">
              9. Availability and changes
            </h2>
            <p>
              We may update, modify, or discontinue features of the Service. We
              aim for reliable availability but do not guarantee uninterrupted
              access. You should maintain independent backups or exports of
              critical business records as appropriate for your dealership.
            </p>
            <p>
              We may update these Terms from time to time. The “Last updated”
              date will change when we do. Continued use after changes become
              effective constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-brand">
              10. Disclaimer of warranties
            </h2>
            <p>
              THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM
              EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR
              IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR
              PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE
              WILL BE ERROR-FREE, THAT INVENTORY OR SALES FIGURES WILL BE
              COMPLETE OR CURRENT, OR THAT THE SERVICE WILL MEET YOUR
              OPERATIONAL, LEGAL, OR FINANCIAL REQUIREMENTS.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-brand">
              11. Limitation of liability
            </h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE AND OUR AFFILIATES,
              OFFICERS, AND CONTRACTORS WILL NOT BE LIABLE FOR INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR
              LOST PROFITS, LOST REVENUE, LOST DATA, FLOORPLAN COSTS, OR BUSINESS
              INTERRUPTION, ARISING FROM OR RELATED TO YOUR USE OF THE SERVICE.
            </p>
            <p>
              OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF THE SERVICE WILL NOT
              EXCEED THE AMOUNTS YOU PAID US FOR THE SERVICE IN THE TWELVE (12)
              MONTHS BEFORE THE CLAIM, OR ONE HUNDRED U.S. DOLLARS (US$100) IF
              YOU HAVE NOT PAID ANY FEES.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-brand">
              12. Indemnity
            </h2>
            <p>
              You will defend and indemnify us against claims, damages, and
              expenses (including reasonable attorneys’ fees) arising from your
              Customer Data, your misuse of the Service, your violation of these
              Terms, or your violation of applicable law or third-party rights.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-brand">
              13. Suspension and termination
            </h2>
            <p>
              We may suspend or terminate access if you violate these Terms,
              create risk for the Service or other customers, or fail to pay
              applicable fees (when fees apply). You may stop using the Service at
              any time. Provisions that by their nature should survive
              (including ownership, warranty disclaimers, and limitations of
              liability) will survive termination.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-brand">
              14. Governing law
            </h2>
            <p>
              These Terms are governed by the laws of the Province of New
              Brunswick and the federal laws of Canada applicable therein,
              without regard to conflict-of-law rules, unless a different
              jurisdiction is required by mandatory law. Courts in New Brunswick
              will have exclusive jurisdiction, except where applicable law
              requires otherwise.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-brand">
              15. Contact
            </h2>
            <p>
              Questions about these Terms or the Service:{" "}
              <a
                href="mailto:info@salestower.io"
                className="font-semibold text-brand underline decoration-peach underline-offset-2"
              >
                info@salestower.io
              </a>
              .
            </p>
          </section>

          <p className="rounded-xl border border-peach/50 bg-[var(--salestower-surface)] px-4 py-3 text-xs text-brand/60">
            This document is a starting draft tailored to SalesTower’s current
            product features. It is not legal advice. Have a lawyer review and
            adapt it for your entity, billing model, and jurisdictions before
            relying on it in production.
          </p>
        </div>
      </article>
    </main>
  );
}
