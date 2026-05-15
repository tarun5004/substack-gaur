import { notFound } from "next/navigation";
import { AppShell } from "@/components/site/app-shell";
import { SubscribeForm } from "@/components/content/subscribe-form";
import { FeedPostItem } from "@/components/content/feed-post-item";
import { getPublication, getPublicationPosts } from "@/services/content";
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const publication = await getPublication(slug);
  if (!publication) {
    return {
      title: "Publication not found",
    };
  }

  return {
    title: publication.name,
    description: publication.tagline,
  };
}

function PublicationRightRail({ publication }) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <div
        className="mb-5 h-2 w-20 rounded-full"
        style={{ backgroundColor: publication.accentColor }}
        aria-hidden
      />
      <h2 className="font-semibold">Subscribe to {publication.name}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{publication.tagline}</p>
      <p className="mt-3 text-xs font-medium text-muted-foreground">
        {publication.subscriberCount.toLocaleString()} readers
      </p>
      <div className="mt-5">
        <SubscribeForm publicationSlug={publication.slug} />
      </div>
    </section>
  );
}

export default async function PublicationPage({ params }) {
  const { slug } = await params;
  const [publication, posts] = await Promise.all([getPublication(slug), getPublicationPosts(slug)]);
  if (!publication) {
    notFound();
  }

  return (
    <AppShell active="explore" rightRail={<PublicationRightRail publication={publication} />}>
      <section className="border-b pb-8">
        <div
          className="mb-8 h-3 w-28 rounded-full"
          style={{ backgroundColor: publication.accentColor }}
          aria-hidden
        />
        <h1 className="font-serif text-5xl leading-tight sm:text-6xl">{publication.name}</h1>
        <p className="mt-5 max-w-2xl text-xl leading-8 text-muted-foreground">
          {publication.tagline}
        </p>
        <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">{publication.description}</p>
      </section>
      <section className="divide-y">
        {posts.length ? (
          posts.map((post) => <FeedPostItem key={post.id} post={post} />)
        ) : (
          <div className="mt-6 rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
            No published posts are available for this publication yet.
          </div>
        )}
      </section>
    </AppShell>
  );
}
