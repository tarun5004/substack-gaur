import { format } from "date-fns";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/site/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CoverFrame } from "@/components/content/cover-frame";
import { SubscribeForm } from "@/components/content/subscribe-form";
import { getPost } from "@/services/content";
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    return {
      title: "Post not found",
    };
  }

  return {
    title: post.title,
    description: post.subtitle,
  };
}

function PostRightRail({ post }) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {post.publication.name}
      </p>
      <h2 className="mt-3 text-lg font-semibold">{post.publication.tagline}</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Get the next issue when it is published.
      </p>
      <div className="mt-5">
        <SubscribeForm publicationSlug={post.publication.slug} />
      </div>
    </section>
  );
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    notFound();
  }

  return (
    <AppShell active="home" rightRail={<PostRightRail post={post} />}>
      <article>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{post.category}</Badge>
          <span className="text-sm text-muted-foreground">
            {format(new Date(post.publishedAt), "MMMM d, yyyy")} &middot; {post.readTimeMinutes} min
            read
          </span>
        </div>
        <h1 className="mt-6 font-serif text-4xl leading-tight sm:text-6xl">{post.title}</h1>
        <p className="mt-5 text-xl leading-8 text-muted-foreground">{post.subtitle}</p>
        <div className="mt-8 flex items-center gap-3">
          <Avatar name={post.author.fullName} src={post.author.avatarUrl} />
          <div>
            <p className="font-medium">{post.author.fullName}</p>
            <p className="text-sm text-muted-foreground">{post.publication.name}</p>
          </div>
        </div>
        <CoverFrame title={post.title} className="mt-10 aspect-[16/8]" />
        <div
          className="prose-sahyogi editorial-measure mx-auto mt-10"
          dangerouslySetInnerHTML={{ __html: post.content.html }}
        />
      </article>
    </AppShell>
  );
}
