"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EyeOff, Pencil, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiErrorMessage } from "@/services/api";
import { deletePost, getMyPosts, publishPost, unpublishPost } from "@/services/posts";

export function PostManagement() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState({ postId: "", type: "" });

  useEffect(() => {
    let mounted = true;

    async function loadPosts() {
      try {
        const nextPosts = await getMyPosts();

        if (mounted) {
          setPosts(nextPosts);
          setError("");
        }
      } catch (requestError) {
        if (mounted) {
          setError(getApiErrorMessage(requestError, "Posts could not be loaded"));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPosts();

    return () => {
      mounted = false;
    };
  }, []);

  function isActionRunning(postId, type) {
    return action.postId === postId && action.type === type;
  }

  async function updateStatus(post, nextStatus) {
    setAction({ postId: post.id, type: nextStatus });

    try {
      const updatedPost =
        nextStatus === "published" ? await publishPost(post.id) : await unpublishPost(post.id);

      setPosts((currentPosts) =>
        currentPosts.map((currentPost) =>
          currentPost.id === updatedPost.id ? updatedPost : currentPost,
        ),
      );
      toast.success(nextStatus === "published" ? "Post published" : "Post moved to drafts");
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, "Post status could not be updated"));
    } finally {
      setAction({ postId: "", type: "" });
    }
  }

  async function removePost(post) {
    if (!window.confirm("Delete this post? This cannot be undone.")) {
      return;
    }

    setAction({ postId: post.id, type: "delete" });

    try {
      await deletePost(post.id);
      setPosts((currentPosts) => currentPosts.filter((currentPost) => currentPost.id !== post.id));
      toast.success("Post deleted");
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, "Post could not be deleted"));
    } finally {
      setAction({ postId: "", type: "" });
    }
  }

  return (
    <>
      <h1 className="text-3xl font-semibold">Post management</h1>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>All posts</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {loading ? <p className="py-4 text-sm text-muted-foreground">Loading posts...</p> : null}

          {!loading && error ? <p className="py-4 text-sm text-destructive">{error}</p> : null}

          {!loading && !error && !posts.length ? (
            <p className="py-4 text-sm text-muted-foreground">
              No posts yet. Create a draft from the editor to start your publication.
            </p>
          ) : null}

          {!loading && !error
            ? posts.map((post) => (
                <div
                  key={post.id}
                  className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_120px_100px_300px] md:items-center"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{post.title}</p>
                    {post.subtitle ? (
                      <p className="text-sm text-muted-foreground">{post.subtitle}</p>
                    ) : null}
                  </div>
                  <Badge variant="outline" className="w-fit">
                    {post.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {post.readTimeMinutes} min read
                  </span>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Button asChild type="button" variant="outline" size="sm">
                      <Link href={`/dashboard/editor/${post.id}`}>
                        <Pencil className="size-4" />
                        Edit
                      </Link>
                    </Button>
                    {post.status === "published" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={Boolean(action.postId)}
                        onClick={() => updateStatus(post, "draft")}
                      >
                        <EyeOff className="size-4" />
                        {isActionRunning(post.id, "draft") ? "Moving..." : "Unpublish"}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={Boolean(action.postId)}
                        onClick={() => updateStatus(post, "published")}
                      >
                        <Send className="size-4" />
                        {isActionRunning(post.id, "published") ? "Publishing..." : "Publish"}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={Boolean(action.postId)}
                      onClick={() => removePost(post)}
                    >
                      <Trash2 className="size-4" />
                      {isActionRunning(post.id, "delete") ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              ))
            : null}
        </CardContent>
      </Card>
    </>
  );
}
