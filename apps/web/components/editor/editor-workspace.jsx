"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/services/api";
import { getMyPublications } from "@/services/publications";
import { createPost, getMyPost, publishPost, updatePost } from "@/services/posts";
import { uploadImage } from "@/services/uploads";
import { editorPostSchema } from "@/validations/post";

const RichEditor = dynamic(
  () => import("@/components/editor/rich-editor").then((module) => module.RichEditor),
  {
    ssr: false,
    loading: () => <div className="h-[580px] rounded-lg border bg-card" />,
  },
);
const initialContent = {
  html: "<h2>Untitled issue</h2><p>Start with the strongest promise to your reader.</p>",
  text: "Untitled issue Start with the strongest promise to your reader.",
};

function normalizePostContent(post) {
  return {
    html: post?.content?.html || initialContent.html,
    text: post?.content?.text || initialContent.text,
  };
}

function tagsFromInput(value) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function errorMapFromZod(error) {
  return Object.fromEntries(error.issues.map((issue) => [issue.path.join("."), issue.message]));
}

export function EditorWorkspace({ postId }) {
  const [publications, setPublications] = useState([]);
  const [loadingPublications, setLoadingPublications] = useState(true);
  const [loadingPost, setLoadingPost] = useState(Boolean(postId));
  const [publicationId, setPublicationId] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [category, setCategory] = useState("General");
  const [tags, setTags] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [content, setContent] = useState(initialContent);
  const [editorContentSeed, setEditorContentSeed] = useState(initialContent.html);
  const [savedPost, setSavedPost] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [postLoadError, setPostLoadError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPublications() {
      try {
        const nextPublications = await getMyPublications();

        if (mounted) {
          setPublications(nextPublications);
          setPublicationId(
            (currentPublicationId) => currentPublicationId || nextPublications[0]?.id || "",
          );
        }
      } catch (error) {
        if (mounted) {
          setLoadError(getApiErrorMessage(error, "Publications could not be loaded"));
        }
      } finally {
        if (mounted) {
          setLoadingPublications(false);
        }
      }
    }

    loadPublications();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!postId) {
      return;
    }

    let mounted = true;

    async function loadPost() {
      setLoadingPost(true);

      try {
        const post = await getMyPost(postId);
        const nextContent = normalizePostContent(post);

        if (mounted) {
          setSavedPost(post);
          setPublicationId(post.publicationId ?? post.publication?.id ?? "");
          setTitle(post.title ?? "");
          setSubtitle(post.subtitle ?? "");
          setCoverImageUrl(post.coverImageUrl ?? "");
          setCategory(post.category ?? "General");
          setTags((post.tags ?? []).join(", "));
          setSeoTitle(post.seo?.title ?? "");
          setSeoDescription(post.seo?.description ?? "");
          setContent(nextContent);
          setEditorContentSeed(nextContent.html);
          setPostLoadError("");
        }
      } catch (error) {
        if (mounted) {
          setPostLoadError(getApiErrorMessage(error, "Post could not be loaded"));
        }
      } finally {
        if (mounted) {
          setLoadingPost(false);
        }
      }
    }

    loadPost();

    return () => {
      mounted = false;
    };
  }, [postId]);

  const payload = useMemo(
    () => ({
      publicationId,
      title,
      subtitle,
      coverImageUrl,
      category,
      tags: tagsFromInput(tags),
      seo: {
        title: seoTitle,
        description: seoDescription,
      },
      content,
    }),
    [
      category,
      content,
      coverImageUrl,
      publicationId,
      seoDescription,
      seoTitle,
      subtitle,
      tags,
      title,
    ],
  );

  async function saveDraft() {
    setSaving(true);
    setErrors({});

    try {
      const validated = editorPostSchema.parse(payload);
      const post = savedPost
        ? await updatePost(savedPost.id, {
            title: validated.title,
            subtitle: validated.subtitle,
            coverImageUrl: validated.coverImageUrl,
            category: validated.category,
            tags: validated.tags,
            seo: validated.seo,
            content: validated.content,
          })
        : await createPost(validated);

      setSavedPost(post);
      toast.success("Draft saved");
      return post;
    } catch (error) {
      if (error.issues) {
        setErrors(errorMapFromZod(error));
        toast.error("Please fix the highlighted fields");
        return null;
      }

      toast.error(getApiErrorMessage(error, "Draft could not be saved"));
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function publishDraft() {
    setPublishing(true);

    try {
      const post = await saveDraft();
      if (!post) {
        return;
      }

      const publishedPost = await publishPost(post.id);
      setSavedPost(publishedPost);
      toast.success("Post published");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Post could not be published"));
    } finally {
      setPublishing(false);
    }
  }

  async function uploadCover(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingCover(true);

    try {
      const image = await uploadImage(file);
      setCoverImageUrl(image.url);
      toast.success("Cover image uploaded");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Cover image could not be uploaded"));
    } finally {
      setUploadingCover(false);
      event.target.value = "";
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Editor</p>
          <h1 className="mt-2 text-3xl font-semibold">
            {postId ? "Edit issue" : "Draft a new issue"}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={saveDraft}
            disabled={saving || publishing || loadingPost || Boolean(postLoadError)}
          >
            {saving ? "Saving..." : "Save draft"}
          </Button>
          <Button
            onClick={publishDraft}
            disabled={saving || publishing || loadingPost || Boolean(postLoadError)}
          >
            {publishing ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>
      {loadingPost ? (
        <div className="mt-8 rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Loading post...
        </div>
      ) : null}
      {!loadingPost && postLoadError ? (
        <div className="mt-8 rounded-lg border bg-card p-6">
          <h2 className="font-semibold">Post could not be loaded</h2>
          <p className="mt-2 text-sm text-muted-foreground">{postLoadError}</p>
        </div>
      ) : null}
      {!loadingPost && !postLoadError ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <RichEditor initialContent={editorContentSeed} onChange={setContent} />
          <aside className="space-y-4">
            <div className="rounded-lg border bg-card p-5">
              <h2 className="font-semibold">Post settings</h2>
              <div className="mt-4 space-y-4">
                {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}
                <div className="space-y-2">
                  <Label htmlFor="publication">Publication</Label>
                  <select
                    id="publication"
                    value={publicationId}
                    onChange={(event) => setPublicationId(event.target.value)}
                    disabled={loadingPublications || !publications.length}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingPublications ? <option>Loading publications...</option> : null}
                    {!loadingPublications && !publications.length ? (
                      <option value="">Create a publication first</option>
                    ) : null}
                    {publications.map((publication) => (
                      <option key={publication.id} value={publication.id}>
                        {publication.name}
                      </option>
                    ))}
                  </select>
                  {errors.publicationId ? (
                    <p className="text-xs text-destructive">{errors.publicationId}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post-title">Title</Label>
                  <Input
                    id="post-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="A clear working title"
                  />
                  {errors.title ? <p className="text-xs text-destructive">{errors.title}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Textarea
                    id="subtitle"
                    value={subtitle}
                    onChange={(event) => setSubtitle(event.target.value)}
                    placeholder="A short promise for the reader"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    placeholder="General"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cover-image">Cover image URL</Label>
                  <Input
                    id="cover-image"
                    value={coverImageUrl}
                    onChange={(event) => setCoverImageUrl(event.target.value)}
                    placeholder="https://..."
                  />
                  <Input
                    id="cover-file"
                    type="file"
                    accept="image/*"
                    disabled={uploadingCover}
                    onChange={uploadCover}
                  />
                  {uploadingCover ? (
                    <p className="text-xs text-muted-foreground">Uploading cover image...</p>
                  ) : null}
                  {errors.coverImageUrl ? (
                    <p className="text-xs text-destructive">{errors.coverImageUrl}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">SEO title</Label>
                  <Input
                    id="title"
                    value={seoTitle}
                    onChange={(event) => setSeoTitle(event.target.value)}
                    placeholder="A precise searchable title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">SEO description</Label>
                  <Textarea
                    id="description"
                    value={seoDescription}
                    onChange={(event) => setSeoDescription(event.target.value)}
                    placeholder="What readers and search previews should know"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(event) => setTags(event.target.value)}
                    placeholder="publishing, product, writing"
                  />
                  {savedPost ? (
                    <p className="text-xs text-muted-foreground">
                      Last saved as {savedPost.status}.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
