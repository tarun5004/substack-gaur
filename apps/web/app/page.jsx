import Link from "next/link";
import { AppShell } from "@/components/site/app-shell";
import { FeedPostItem } from "@/components/content/feed-post-item";
import { getFeaturedPosts, getPublications } from "@/services/content";

export const dynamic = "force-dynamic";

function HomeRightRail({ posts, publications }) {
  return (
    <>
      <section className="rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-semibold">Up next</h2>
          <Link href="/explore" className="text-xs text-muted-foreground hover:text-foreground">
            See all
          </Link>
        </div>
        <div className="mt-4 space-y-4">
          {posts.slice(0, 3).map((post) => (
            <Link key={post.id} href={`/posts/${post.slug}`} className="block">
              <p className="text-sm font-semibold leading-snug">{post.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{post.readTimeMinutes} min read</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="rounded-lg border bg-card p-5">
        <h2 className="font-semibold">Publications</h2>
        <div className="mt-4 space-y-4">
          {publications.slice(0, 4).map((publication) => (
            <Link
              key={publication.id}
              href={`/publications/${publication.slug}`}
              className="flex items-center gap-3"
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: publication.accentColor }}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{publication.name}</span>
                <span className="text-xs text-muted-foreground">
                  {publication.subscriberCount.toLocaleString()} readers
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

export default async function HomePage() {
  const [posts, publications] = await Promise.all([getFeaturedPosts(), getPublications()]);

  return (
    <AppShell active="home" rightRail={<HomeRightRail posts={posts} publications={publications} />}>
      <section className="border-b pb-6">
        <p className="text-sm font-medium text-muted-foreground">For you</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">Sahyogi</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          A focused publishing feed for writers, publications, and readers who care about useful
          long-form work.
        </p>
        <Link
          href="/dashboard/editor"
          className="mt-6 block rounded-lg border bg-card px-5 py-4 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          What is worth writing today?
        </Link>
      </section>

      <section className="divide-y">
        {posts.length ? (
          posts.map((post) => <FeedPostItem key={post.id} post={post} />)
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
            No posts are available yet.
          </div>
        )}
      </section>
    </AppShell>
  );
}
