import mongoose from "mongoose";
import { HttpStatus } from "../../constants/http.js";
import { ApiError } from "../../utils/api-error.js";
import { sanitizePostContent } from "../../utils/post-content.js";
import { calculateReadTime } from "../../utils/read-time.js";
import { createSlug } from "../../utils/slug.js";
import { publicationsRepository } from "../publications/publication.repository.js";
import { postsRepository } from "./post.repository.js";
import { toPostDTO } from "./post.serializer.js";

function entityId(value) {
  return value?._id ? value._id.toString() : value.toString();
}

function plainContent(content) {
  return content?.toObject ? content.toObject() : content;
}

function hasReaderContent(content) {
  const postContent = plainContent(content);
  return Boolean(postContent?.text?.trim());
}

async function assertPublicationOwner(publicationId, user) {
  const publication = await publicationsRepository.findById(publicationId);
  if (!publication) {
    throw new ApiError(HttpStatus.NOT_FOUND, "Publication not found");
  }
  if (publication.ownerId.toString() !== user.id) {
    throw new ApiError(HttpStatus.FORBIDDEN, "Only the publication owner can manage posts");
  }
  return publication;
}
export const postsService = {
  async listPublished(query) {
    let publicationId;
    if (query.publicationSlug) {
      const publication = await publicationsRepository.findBySlug(query.publicationSlug);
      if (!publication) {
        throw new ApiError(HttpStatus.NOT_FOUND, "Publication not found");
      }
      publicationId = publication._id.toString();
    }

    const posts = await postsRepository.findPublished({
      limit: query.limit,
      ...(query.search ? { search: query.search } : {}),
      ...(query.tag ? { tag: query.tag } : {}),
      ...(publicationId ? { publicationId } : {}),
      ...(query.cursor ? { cursor: query.cursor } : {}),
    });
    return {
      items: posts.map(toPostDTO),
      nextCursor: posts.length ? posts.at(-1)?.publishedAt?.toISOString() : null,
    };
  },
  async getPublished(slug) {
    const post = await postsRepository.findBySlug(slug);
    if (!post) {
      throw new ApiError(HttpStatus.NOT_FOUND, "Post not found");
    }
    return toPostDTO(post);
  },
  async listMine(user) {
    const posts = await postsRepository.findByAuthor(user.id);
    return posts.map(toPostDTO);
  },
  async getMine(user, postId) {
    const post = await postsRepository.findById(postId);
    if (!post) {
      throw new ApiError(HttpStatus.NOT_FOUND, "Post not found");
    }
    await assertPublicationOwner(entityId(post.publicationId), user);
    return toPostDTO(post);
  },
  async create(user, data) {
    await assertPublicationOwner(data.publicationId, user);
    const slug = data.slug?.toLowerCase() || createSlug(data.title);
    const existingPost = await postsRepository.findAnyBySlug(slug);
    if (existingPost) {
      throw new ApiError(HttpStatus.CONFLICT, "Post slug is already in use");
    }

    const post = await postsRepository.create({
      publicationId: new mongoose.Types.ObjectId(data.publicationId),
      authorId: new mongoose.Types.ObjectId(user.id),
      title: data.title,
      slug,
      subtitle: data.subtitle,
      coverImageUrl: data.coverImageUrl,
      content: sanitizePostContent(data.content),
      status: data.scheduledFor ? "scheduled" : "draft",
      tags: data.tags,
      category: data.category,
      readTimeMinutes: calculateReadTime(data.content.text),
      seo: {
        title: data.seo.title || data.title,
        description: data.seo.description || data.subtitle,
      },
      scheduledFor: data.scheduledFor,
    });
    return toPostDTO(await postsRepository.populateRelations(post));
  },
  async update(user, postId, data) {
    const post = await postsRepository.findById(postId);
    if (!post) {
      throw new ApiError(HttpStatus.NOT_FOUND, "Post not found");
    }
    await assertPublicationOwner(entityId(post.publicationId), user);
    const update = { ...data };
    if (data.slug) {
      update.slug = data.slug.toLowerCase();
      const existingPost = await postsRepository.findAnyBySlug(update.slug);
      if (existingPost && existingPost._id.toString() !== post._id.toString()) {
        throw new ApiError(HttpStatus.CONFLICT, "Post slug is already in use");
      }
    }
    if (data.content) {
      update.content = sanitizePostContent({
        ...plainContent(post.content),
        ...data.content,
      });
    }
    if (data.content?.text) {
      update.readTimeMinutes = calculateReadTime(data.content.text);
    }
    update.seo = {
      title: data.seo?.title || data.title || post.seo.title || post.title,
      description: data.seo?.description || data.subtitle || post.seo.description,
    };
    const updated = await postsRepository.updateById(postId, update);
    return toPostDTO(updated);
  },
  async publish(user, postId) {
    const post = await postsRepository.findById(postId);
    if (!post) {
      throw new ApiError(HttpStatus.NOT_FOUND, "Post not found");
    }
    await assertPublicationOwner(entityId(post.publicationId), user);
    if (!hasReaderContent(post.content)) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, "Add post content before publishing");
    }
    const updated = await postsRepository.updateById(postId, {
      status: "published",
      publishedAt: post.publishedAt ?? new Date(),
      scheduledFor: null,
    });
    return toPostDTO(updated);
  },
  async unpublish(user, postId) {
    const post = await postsRepository.findById(postId);
    if (!post) {
      throw new ApiError(HttpStatus.NOT_FOUND, "Post not found");
    }
    await assertPublicationOwner(entityId(post.publicationId), user);
    const updated = await postsRepository.updateById(postId, {
      status: "draft",
      publishedAt: null,
      scheduledFor: null,
    });
    return toPostDTO(updated);
  },
  async remove(user, postId) {
    const post = await postsRepository.findById(postId);
    if (!post) {
      throw new ApiError(HttpStatus.NOT_FOUND, "Post not found");
    }
    await assertPublicationOwner(entityId(post.publicationId), user);
    const deleted = await postsRepository.deleteById(postId);
    return toPostDTO(deleted);
  },
};
