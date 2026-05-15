import { format } from "date-fns";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { CoverFrame } from "@/components/content/cover-frame";

export function FeedPostItem({ post }) {
  return (
    <article className="group grid gap-4 py-6 sm:grid-cols-[1fr_180px]">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <Avatar name={post.author.fullName} src={post.author.avatarUrl} className="h-9 w-9" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{post.publication.name}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(post.publishedAt), "MMM d")} &middot; {post.readTimeMinutes} min read
            </p>
          </div>
        </div>

        <Link href={`/posts/${post.slug}`} className="mt-4 block group-hover:underline">
          <h2 className="text-xl font-semibold leading-snug sm:text-2xl">{post.title}</h2>
          {post.subtitle ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {post.subtitle}
            </p>
          ) : null}
        </Link>

        <p className="mt-4 text-xs font-medium uppercase tracking-normal text-muted-foreground">
          {post.category}
        </p>
      </div>

      <Link href={`/posts/${post.slug}`} className="hidden sm:block">
        <CoverFrame title={post.title} className="aspect-[4/3]" />
      </Link>
    </article>
  );
}
