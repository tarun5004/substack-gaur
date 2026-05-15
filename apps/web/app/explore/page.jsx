import Link from "next/link";
import { AppShell } from "@/components/site/app-shell";
import { FeedPostItem } from "@/components/content/feed-post-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFeaturedPosts, getPublications } from "@/services/content";
export const metadata = {
  title: "Explore",
  description: "Discover Sahyogi publications and essays.",
};

export const dynamic = "force-dynamic";

const topics = ["Explore", "Publishing", "Product", "Growth", "Engineering", "Design"];

function ExploreRightRail({ publications }) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold">Recommended</h2>
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
          Home
        </Link>
      </div>
      <div className="mt-4 space-y-4">
        {publications.slice(0, 4).map((publication) => (
          <Link
            key={publication.id}
            href={`/publications/${publication.slug}`}
            className="block rounded-md border p-4 transition-colors hover:border-primary/40"
          >
            <span
              className="mb-3 block h-2 w-16 rounded-full"
              style={{ backgroundColor: publication.accentColor }}
              aria-hidden
            />
            <span className="block font-semibold">{publication.name}</span>
            <span className="mt-1 block text-sm leading-6 text-muted-foreground">
              {publication.tagline}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function ExplorePage({ searchParams }) {
  const params = await searchParams;
  const query = typeof params?.q === "string" ? params.q.trim() : "";
  const [posts, publications] = await Promise.all([
    getFeaturedPosts(query ? { search: query } : {}),
    getPublications(),
  ]);

  return (
    <AppShell active="explore" rightRail={<ExploreRightRail publications={publications} />}>
      <section className="border-b pb-6">
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <span
              key={topic}
              className="rounded-md border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground first:bg-primary first:text-primary-foreground"
            >
              {topic}
            </span>
          ))}
        </div>
        <div className="mt-7 grid gap-5 md:grid-cols-[1fr_280px] md:items-end">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Explore</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
              Fresh thinking from independent rooms.
            </h1>
          </div>
          <form action="/explore" className="flex gap-2">
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search essays"
              className="bg-background"
            />
            <Button type="submit">Search</Button>
          </form>
        </div>
      </section>

      <section className="divide-y">
        {query ? (
          <p className="py-4 text-sm text-muted-foreground">
            {posts.length} results for "{query}"
          </p>
        ) : null}
        {posts.length ? (
          posts.map((post) => <FeedPostItem key={post.id} post={post} />)
        ) : (
          <div className="mt-6 rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
            No posts found.
          </div>
        )}
      </section>
    </AppShell>
  );
}
