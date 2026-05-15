import { SiteHeader } from "@/components/site/site-header";
import { PostCard } from "@/components/content/post-card";
import { PublicationCard } from "@/components/content/publication-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFeaturedPosts, getPublications } from "@/services/content";
export const metadata = {
  title: "Explore",
  description: "Discover Sahyogi publications and essays.",
};

export const dynamic = "force-dynamic";

export default async function ExplorePage({ searchParams }) {
  const params = await searchParams;
  const query = typeof params?.q === "string" ? params.q.trim() : "";
  const [posts, publications] = await Promise.all([
    getFeaturedPosts(query ? { search: query } : {}),
    getPublications(),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-muted-foreground">Explore</p>
            <h1 className="mt-3 font-serif text-5xl leading-tight">
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
        <section className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <div>
            {query ? (
              <p className="mb-4 text-sm text-muted-foreground">
                {posts.length} results for "{query}"
              </p>
            ) : null}
            {posts.length ? (
              <div className="grid gap-8 md:grid-cols-2">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
                No posts found.
              </div>
            )}
          </div>
          <aside className="space-y-4">
            {publications.length ? (
              publications.map((publication) => (
                <PublicationCard key={publication.id} publication={publication} />
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No publications yet.
              </div>
            )}
          </aside>
        </section>
      </main>
    </>
  );
}
