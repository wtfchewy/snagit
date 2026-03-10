import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background relative">
      <div className="dot-grid absolute inset-0 pointer-events-none" />

      <div className="relative z-10 max-w-xl mx-auto px-6 py-16">
        <Link to="/login" className="inline-flex items-center gap-2 text-copy-lighter text-[13px] hover:text-copy transition-colors no-underline mb-8">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Back
        </Link>

        <div className="flex items-center gap-2.5 mb-8">
          <img src="/logo.svg" alt="" className="w-7 h-7" />
          <span className="text-lg font-bold tracking-tight font-display text-copy">Backpack</span>
        </div>

        <h1 className="text-2xl font-bold text-copy mb-2 font-display">Privacy Policy</h1>
        <p className="text-[12px] text-copy-lighter mb-8">Last updated: March 9, 2026</p>

        <div className="space-y-6 text-[13px] text-copy-light leading-relaxed">
          <section>
            <h2 className="text-[15px] font-semibold text-copy mb-2">Overview</h2>
            <p>
              Backpack is a browser extension and web application that lets you save UI components from websites. We are committed to protecting your privacy and being transparent about what data we collect.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-copy mb-2">Information We Collect</h2>
            <p className="mb-2">When you use Backpack, we collect:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-copy">Account information:</strong> Your name, email address, and profile photo provided by Google when you sign in.</li>
              <li><strong className="text-copy">Saved components:</strong> The HTML and CSS of UI components you choose to capture, along with the source URL and any names you assign.</li>
              <li><strong className="text-copy">Packs:</strong> The names and organization of your component collections.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-copy mb-2">Information We Do Not Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>We do not track your browsing history or activity.</li>
              <li>We do not collect data from pages you visit unless you explicitly capture a component.</li>
              <li>We do not sell, share, or transfer your personal data to third parties.</li>
              <li>We do not use your data for advertising purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-copy mb-2">How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To authenticate your account and sync your saved components.</li>
              <li>To display your component library in the Backpack web app.</li>
              <li>To improve the functionality of the service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-copy mb-2">Data Storage</h2>
            <p>
              Your data is stored securely using Google Firebase (Firestore). Your authentication credentials are managed by Firebase Authentication. All data is transmitted over encrypted connections (HTTPS).
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-copy mb-2">Chrome Extension Permissions</h2>
            <p className="mb-2">The Backpack extension requests the following permissions:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-copy">activeTab:</strong> To access the current page when you choose to capture a component.</li>
              <li><strong className="text-copy">storage:</strong> To store your authentication credentials locally.</li>
              <li><strong className="text-copy">scripting:</strong> To inject the component picker into the active tab.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-copy mb-2">Data Deletion</h2>
            <p>
              You can delete individual components or entire packs at any time. To delete your account and all associated data, sign out and contact us. We will remove all your data promptly.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-copy mb-2">Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Any changes will be reflected on this page with an updated date.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-copy mb-2">Contact</h2>
            <p>
              If you have any questions about this privacy policy, please reach out via the Backpack GitHub repository.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
