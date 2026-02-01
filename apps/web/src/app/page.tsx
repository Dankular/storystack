import { Navbar } from '@/components/navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <main>
      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Story<span className="text-primary-600">Stack</span>
          </h1>
          <p className="mt-6 text-xl leading-8 text-gray-600">
            A modern platform for writers and readers to share and discover stories.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="/stories"
              className="rounded-md bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Browse Stories
            </a>
            <a
              href="/write"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600"
            >
              Start Writing <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="Powerful Search"
            description="Full-text search with advanced filters, exclusions, and saved searches."
          />
          <FeatureCard
            title="Smart Tagging"
            description="Curated tags with synonyms and categories for easy discovery."
          />
          <FeatureCard
            title="Reading Experience"
            description="Customizable reader with offline support and progress sync."
          />
          <FeatureCard
            title="Author Tools"
            description="Rich editor, scheduled publishing, analytics, and co-author support."
          />
          <FeatureCard
            title="Community"
            description="Comments, reviews, forums, and beta reader tools."
          />
          <FeatureCard
            title="Monetization"
            description="Tips, early access tiers, and Patreon integration."
          />
        </div>
      </div>
      </main>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600">{description}</p>
    </div>
  );
}
