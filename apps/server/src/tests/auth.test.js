import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import app from "../app.js";
import { connectDatabase, disconnectDatabase } from "../configs/database.js";
import { env } from "../configs/env.js";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "../constants/cookies.js";
let mongo;
let userCount = 0;

async function createSessionCookies() {
  userCount += 1;

  const response = await request(app)
    .post("/api/auth/signup")
    .send({
      fullName: "Tarun Raj",
      username: `tarunraj${userCount}`,
      email: `tarun${userCount}@example.com`,
      password: "password123",
    });

  expect(response.status).toBe(201);
  expect(response.headers["set-cookie"]).toBeDefined();

  return response.headers["set-cookie"];
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDatabase(mongo.getUri());
});
afterEach(async () => {
  await mongoose.connection.db?.dropDatabase();
});
afterAll(async () => {
  await disconnectDatabase();
  await mongo.stop();
});
describe("auth", () => {
  it("reports API health", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("ok");
    expect(response.body.data.service).toBe("sahyogi-api");
  });

  it("creates a safe session without returning password material", async () => {
    const response = await request(app).post("/api/auth/signup").send({
      fullName: "Tarun Raj",
      username: "tarunraj",
      email: "tarun@example.com",
      password: "password123",
    });
    expect(response.status).toBe(201);
    expect(response.body.data.email).toBe("tarun@example.com");
    expect(response.body.data.password).toBeUndefined();
    expect(response.body.data.passwordHash).toBeUndefined();
    expect(response.headers["set-cookie"]).toBeDefined();
  });
  it("blocks protected routes without a session", async () => {
    const response = await request(app).get("/api/auth/me");
    expect(response.status).toBe(401);
  });

  it("rejects refresh without a cookie", async () => {
    const response = await request(app).post("/api/auth/refresh");
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Refresh session is required");
  });

  it("rejects refresh with an invalid token cookie", async () => {
    const response = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [`${REFRESH_TOKEN_COOKIE}=not-a-real-token`]);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid refresh session");
  });

  it("rejects signed access tokens with invalid payloads", async () => {
    const invalidAccessToken = jwt.sign({ sid: "session-only" }, env.JWT_ACCESS_SECRET);
    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", [`${ACCESS_TOKEN_COOKIE}=${invalidAccessToken}`]);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid or expired session");
  });

  it("logs in, refreshes, and logs out a session", async () => {
    await request(app).post("/api/auth/signup").send({
      fullName: "Session Writer",
      username: "sessionwriter",
      email: "session@example.com",
      password: "password123",
    });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "session@example.com",
      password: "password123",
    });
    const refreshResponse = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", loginResponse.headers["set-cookie"]);
    const logoutResponse = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", refreshResponse.headers["set-cookie"]);

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.email).toBe("session@example.com");
    expect(loginResponse.headers["set-cookie"]).toBeDefined();
    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.headers["set-cookie"]).toBeDefined();
    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.message).toBe("Logged out");
  });

  it("does not expose private email on public profiles", async () => {
    await request(app).post("/api/auth/signup").send({
      fullName: "Public Writer",
      username: "publicwriter",
      email: "public-writer@example.com",
      password: "password123",
    });

    const response = await request(app).get("/api/users/publicwriter");

    expect(response.status).toBe(200);
    expect(response.body.data.username).toBe("publicwriter");
    expect(response.body.data.email).toBeUndefined();
  });

  it("updates writer profile settings", async () => {
    const cookies = await createSessionCookies();
    const response = await request(app)
      .patch("/api/users/me/profile")
      .set("Cookie", cookies)
      .send({
        fullName: "Tarun Updated",
        bio: "Writing about product engineering.",
        avatarUrl: "https://example.com/avatar.png",
        socials: {
          website: "https://example.com",
          github: "",
          linkedin: "",
          twitter: "",
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.data.fullName).toBe("Tarun Updated");
    expect(response.body.data.bio).toBe("Writing about product engineering.");
    expect(response.body.data.avatarUrl).toBe("https://example.com/avatar.png");
    expect(response.body.data.socials.website).toBe("https://example.com");
  });

  it("rejects invalid post ids before hitting database casts", async () => {
    const cookies = await createSessionCookies();
    const response = await request(app)
      .post("/api/posts/not-a-valid-id/publish")
      .set("Cookie", cookies);

    expect(response.status).toBe(422);
    expect(response.body.details.fieldErrors.id[0]).toBe("id must be a valid MongoDB ObjectId");
  });

  it("rejects invalid publication ids before hitting database casts", async () => {
    const cookies = await createSessionCookies();
    const response = await request(app)
      .patch("/api/publications/not-a-valid-id")
      .set("Cookie", cookies)
      .send({ tagline: "Updated tagline" });

    expect(response.status).toBe(422);
    expect(response.body.details.fieldErrors.id[0]).toBe("id must be a valid MongoDB ObjectId");
  });

  it("rejects invalid publication ids when creating posts", async () => {
    const cookies = await createSessionCookies();
    const response = await request(app)
      .post("/api/posts")
      .set("Cookie", cookies)
      .send({
        publicationId: "not-a-valid-id",
        title: "A real editorial workflow",
        content: {
          html: "<p>Hello</p>",
          text: "Hello",
        },
      });

    expect(response.status).toBe(422);
    expect(response.body.details.fieldErrors.publicationId[0]).toBe(
      "publicationId must be a valid MongoDB ObjectId",
    );
  });

  it("protects image upload endpoints", async () => {
    const response = await request(app).post("/api/uploads/image");

    expect(response.status).toBe(401);
  });

  it("validates missing image uploads", async () => {
    const cookies = await createSessionCookies();
    const response = await request(app).post("/api/uploads/image").set("Cookie", cookies);

    expect(response.status).toBe(422);
    expect(response.body.message).toBe("Image file is required");
  });

  it("returns author and publication summaries for published posts", async () => {
    const cookies = await createSessionCookies();
    const publicationResponse = await request(app)
      .post("/api/publications")
      .set("Cookie", cookies)
      .send({
        name: "Craft Notes",
        slug: "craft-notes",
        tagline: "Practical essays for builders",
      });

    const postResponse = await request(app)
      .post("/api/posts")
      .set("Cookie", cookies)
      .send({
        publicationId: publicationResponse.body.data.id,
        title: "Nested API Shape",
        subtitle: "A contract test for the reader UI",
        content: {
          html: "<p>Hello</p>",
          text: "Hello",
        },
      });

    await request(app)
      .post(`/api/posts/${postResponse.body.data.id}/publish`)
      .set("Cookie", cookies);

    const listResponse = await request(app).get("/api/posts");
    const detailResponse = await request(app).get(`/api/posts/${postResponse.body.data.slug}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data[0].author.fullName).toBe("Tarun Raj");
    expect(listResponse.body.data[0].publication.name).toBe("Craft Notes");
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.data.author.username).toMatch(/^tarunraj/);
    expect(detailResponse.body.data.publication.slug).toBe("craft-notes");
  });

  it("sanitizes post html before storing content", async () => {
    const cookies = await createSessionCookies();
    const publicationResponse = await request(app)
      .post("/api/publications")
      .set("Cookie", cookies)
      .send({
        name: "Security Notes",
        slug: "security-notes",
      });

    const response = await request(app)
      .post("/api/posts")
      .set("Cookie", cookies)
      .send({
        publicationId: publicationResponse.body.data.id,
        title: "Sanitized Post Content",
        content: {
          html: '<p>Hello<script>alert("xss")</script><a href="javascript:alert(1)">bad</a></p>',
          text: "Hello bad",
        },
      });

    expect(response.status).toBe(201);
    expect(response.body.data.content.html).not.toContain("<script");
    expect(response.body.data.content.html).not.toContain("javascript:");
  });

  it("rejects duplicate public post slugs", async () => {
    const cookies = await createSessionCookies();
    const firstPublication = await request(app)
      .post("/api/publications")
      .set("Cookie", cookies)
      .send({
        name: "First Desk",
        slug: "first-desk",
      });
    const secondPublication = await request(app)
      .post("/api/publications")
      .set("Cookie", cookies)
      .send({
        name: "Second Desk",
        slug: "second-desk",
      });

    const firstPost = await request(app)
      .post("/api/posts")
      .set("Cookie", cookies)
      .send({
        publicationId: firstPublication.body.data.id,
        title: "One Shared Slug",
        content: {
          html: "<p>Hello</p>",
          text: "Hello",
        },
      });
    const duplicatePost = await request(app)
      .post("/api/posts")
      .set("Cookie", cookies)
      .send({
        publicationId: secondPublication.body.data.id,
        title: "One Shared Slug",
        content: {
          html: "<p>Hello again</p>",
          text: "Hello again",
        },
      });

    expect(firstPost.status).toBe(201);
    expect(duplicatePost.status).toBe(409);
    expect(duplicatePost.body.message).toBe("Post slug is already in use");
  });

  it("updates publication fields without resetting existing values", async () => {
    const cookies = await createSessionCookies();
    const publication = await request(app).post("/api/publications").set("Cookie", cookies).send({
      name: "Partial Publication",
      slug: "partial-publication",
      description: "Keep this description",
      tagline: "Original tagline",
      logoUrl: "https://example.com/logo.png",
      accentColor: "#2563eb",
    });

    const response = await request(app)
      .patch(`/api/publications/${publication.body.data.id}`)
      .set("Cookie", cookies)
      .send({ tagline: "Updated tagline" });

    expect(publication.body.data.logoUrl).toBe("https://example.com/logo.png");
    expect(publication.body.data.accentColor).toBe("#2563eb");
    expect(response.status).toBe(200);
    expect(response.body.data.description).toBe("Keep this description");
    expect(response.body.data.tagline).toBe("Updated tagline");
  });

  it("rejects empty publication patches", async () => {
    const cookies = await createSessionCookies();
    const publication = await request(app).post("/api/publications").set("Cookie", cookies).send({
      name: "Empty Patch Publication",
      slug: "empty-patch-publication",
    });

    const response = await request(app)
      .patch(`/api/publications/${publication.body.data.id}`)
      .set("Cookie", cookies)
      .send({});

    expect(response.status).toBe(422);
    expect(response.body.details.formErrors[0]).toBe("At least one field is required");
  });

  it("updates post fields without resetting existing content", async () => {
    const cookies = await createSessionCookies();
    const publication = await request(app).post("/api/publications").set("Cookie", cookies).send({
      name: "Partial Post Publication",
      slug: "partial-post-publication",
    });
    const post = await request(app)
      .post("/api/posts")
      .set("Cookie", cookies)
      .send({
        publicationId: publication.body.data.id,
        title: "Original Post Title",
        subtitle: "Keep this subtitle",
        category: "Workflow",
        tags: ["drafting", "editing"],
        content: {
          html: "<p>Keep this body</p>",
          text: "Keep this body",
        },
      });

    const response = await request(app)
      .patch(`/api/posts/${post.body.data.id}`)
      .set("Cookie", cookies)
      .send({ title: "Updated Post Title" });

    expect(response.status).toBe(200);
    expect(response.body.data.title).toBe("Updated Post Title");
    expect(response.body.data.subtitle).toBe("Keep this subtitle");
    expect(response.body.data.category).toBe("Workflow");
    expect(response.body.data.tags).toEqual(["drafting", "editing"]);
    expect(response.body.data.content.text).toBe("Keep this body");
  });

  it("returns owned post detail for editor loading", async () => {
    const ownerCookies = await createSessionCookies();
    const otherWriterCookies = await createSessionCookies();
    const publication = await request(app)
      .post("/api/publications")
      .set("Cookie", ownerCookies)
      .send({
        name: "Editor Detail Publication",
        slug: "editor-detail-publication",
      });
    const post = await request(app)
      .post("/api/posts")
      .set("Cookie", ownerCookies)
      .send({
        publicationId: publication.body.data.id,
        title: "Editable Draft",
        content: {
          html: "<p>Draft content</p>",
          text: "Draft content",
        },
      });

    const ownerResponse = await request(app)
      .get(`/api/posts/mine/${post.body.data.id}`)
      .set("Cookie", ownerCookies);
    const forbiddenResponse = await request(app)
      .get(`/api/posts/mine/${post.body.data.id}`)
      .set("Cookie", otherWriterCookies);

    expect(ownerResponse.status).toBe(200);
    expect(ownerResponse.body.data.title).toBe("Editable Draft");
    expect(ownerResponse.body.data.content.text).toBe("Draft content");
    expect(forbiddenResponse.status).toBe(403);
  });

  it("rejects empty post patches", async () => {
    const cookies = await createSessionCookies();
    const publication = await request(app).post("/api/publications").set("Cookie", cookies).send({
      name: "Empty Patch Post Publication",
      slug: "empty-patch-post-publication",
    });
    const post = await request(app).post("/api/posts").set("Cookie", cookies).send({
      publicationId: publication.body.data.id,
      title: "Post That Needs A Patch",
    });

    const response = await request(app)
      .patch(`/api/posts/${post.body.data.id}`)
      .set("Cookie", cookies)
      .send({});

    expect(response.status).toBe(422);
    expect(response.body.details.formErrors[0]).toBe("At least one field is required");
  });

  it("publishes and unpublishes owned posts", async () => {
    const cookies = await createSessionCookies();
    const publication = await request(app).post("/api/publications").set("Cookie", cookies).send({
      name: "Publish Flow Publication",
      slug: "publish-flow-publication",
    });
    const post = await request(app).post("/api/posts").set("Cookie", cookies).send({
      publicationId: publication.body.data.id,
      title: "Publish Flow Post",
    });

    const publishResponse = await request(app)
      .post(`/api/posts/${post.body.data.id}/publish`)
      .set("Cookie", cookies);
    const unpublishResponse = await request(app)
      .post(`/api/posts/${post.body.data.id}/unpublish`)
      .set("Cookie", cookies);
    const publicDetailResponse = await request(app).get(`/api/posts/${post.body.data.slug}`);

    expect(publishResponse.status).toBe(200);
    expect(publishResponse.body.data.status).toBe("published");
    expect(publishResponse.body.data.publishedAt).toBeTruthy();
    expect(unpublishResponse.status).toBe(200);
    expect(unpublishResponse.body.data.status).toBe("draft");
    expect(unpublishResponse.body.data.publishedAt).toBeNull();
    expect(publicDetailResponse.status).toBe(404);
  });

  it("deletes owned posts from the management list", async () => {
    const cookies = await createSessionCookies();
    const publication = await request(app).post("/api/publications").set("Cookie", cookies).send({
      name: "Delete Flow Publication",
      slug: "delete-flow-publication",
    });
    const post = await request(app).post("/api/posts").set("Cookie", cookies).send({
      publicationId: publication.body.data.id,
      title: "Delete Flow Post",
    });

    const deleteResponse = await request(app)
      .delete(`/api/posts/${post.body.data.id}`)
      .set("Cookie", cookies);
    const listResponse = await request(app).get("/api/posts/mine").set("Cookie", cookies);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.message).toBe("Post deleted");
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(0);
  });

  it("prevents another writer from deleting a post", async () => {
    const ownerCookies = await createSessionCookies();
    const otherWriterCookies = await createSessionCookies();
    const publication = await request(app)
      .post("/api/publications")
      .set("Cookie", ownerCookies)
      .send({
        name: "Owner Only Publication",
        slug: "owner-only-publication",
      });
    const post = await request(app).post("/api/posts").set("Cookie", ownerCookies).send({
      publicationId: publication.body.data.id,
      title: "Owner Only Post",
    });

    const response = await request(app)
      .delete(`/api/posts/${post.body.data.id}`)
      .set("Cookie", otherWriterCookies);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Only the publication owner can manage posts");
  });

  it("lists public publications and filters posts by publication slug", async () => {
    const cookies = await createSessionCookies();
    const firstPublication = await request(app)
      .post("/api/publications")
      .set("Cookie", cookies)
      .send({
        name: "Filtered Desk One",
        slug: "filtered-desk-one",
      });
    const secondPublication = await request(app)
      .post("/api/publications")
      .set("Cookie", cookies)
      .send({
        name: "Filtered Desk Two",
        slug: "filtered-desk-two",
      });

    const firstPost = await request(app).post("/api/posts").set("Cookie", cookies).send({
      publicationId: firstPublication.body.data.id,
      title: "Filtered First Post",
    });
    const secondPost = await request(app).post("/api/posts").set("Cookie", cookies).send({
      publicationId: secondPublication.body.data.id,
      title: "Filtered Second Post",
    });

    await request(app).post(`/api/posts/${firstPost.body.data.id}/publish`).set("Cookie", cookies);
    await request(app).post(`/api/posts/${secondPost.body.data.id}/publish`).set("Cookie", cookies);

    const publicationsResponse = await request(app).get("/api/publications");
    const firstPostsResponse = await request(app).get(
      "/api/posts?publicationSlug=filtered-desk-one",
    );

    expect(publicationsResponse.status).toBe(200);
    expect(publicationsResponse.body.data.map((publication) => publication.slug)).toEqual(
      expect.arrayContaining(["filtered-desk-one", "filtered-desk-two"]),
    );
    expect(firstPostsResponse.status).toBe(200);
    expect(firstPostsResponse.body.data).toHaveLength(1);
    expect(firstPostsResponse.body.data[0].publication.slug).toBe("filtered-desk-one");
  });

  it("returns not found when filtering posts by an unknown publication", async () => {
    const response = await request(app).get("/api/posts?publicationSlug=missing-publication");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Publication not found");
  });

  it("lists active subscribers only for the publication owner", async () => {
    const ownerCookies = await createSessionCookies();
    const otherWriterCookies = await createSessionCookies();
    const publication = await request(app)
      .post("/api/publications")
      .set("Cookie", ownerCookies)
      .send({
        name: "Subscriber List Publication",
        slug: "subscriber-list-publication",
      });

    await request(app).post("/api/publications/subscriber-list-publication/subscribe").send({
      email: "reader@example.com",
      source: "publication_page",
    });

    const ownerResponse = await request(app)
      .get(`/api/publications/${publication.body.data.id}/subscribers?search=reader`)
      .set("Cookie", ownerCookies);
    const forbiddenResponse = await request(app)
      .get(`/api/publications/${publication.body.data.id}/subscribers`)
      .set("Cookie", otherWriterCookies);

    expect(ownerResponse.status).toBe(200);
    expect(ownerResponse.body.data.publication.slug).toBe("subscriber-list-publication");
    expect(ownerResponse.body.data.subscribers).toHaveLength(1);
    expect(ownerResponse.body.data.subscribers[0].email).toBe("reader@example.com");
    expect(forbiddenResponse.status).toBe(403);
    expect(forbiddenResponse.body.message).toBe("Only the owner can manage this publication");
  });

  it("unsubscribes and resubscribes readers without duplicate key failures", async () => {
    const ownerCookies = await createSessionCookies();
    const publication = await request(app)
      .post("/api/publications")
      .set("Cookie", ownerCookies)
      .send({
        name: "Resubscribe Publication",
        slug: "resubscribe-publication",
      });

    const subscribeResponse = await request(app)
      .post("/api/publications/resubscribe-publication/subscribe")
      .send({
        email: "reader@example.com",
        source: "publication_page",
      });
    const unsubscribeResponse = await request(app)
      .post("/api/publications/resubscribe-publication/unsubscribe")
      .send({ email: "reader@example.com" });
    const emptyListResponse = await request(app)
      .get(`/api/publications/${publication.body.data.id}/subscribers`)
      .set("Cookie", ownerCookies);
    const resubscribeResponse = await request(app)
      .post("/api/publications/resubscribe-publication/subscribe")
      .send({
        email: "reader@example.com",
        source: "publication_page",
      });

    expect(subscribeResponse.status).toBe(200);
    expect(subscribeResponse.body.data.publication.subscriberCount).toBe(1);
    expect(unsubscribeResponse.status).toBe(200);
    expect(unsubscribeResponse.body.data.status).toBe("unsubscribed");
    expect(unsubscribeResponse.body.data.publication.subscriberCount).toBe(0);
    expect(emptyListResponse.body.data.subscribers).toHaveLength(0);
    expect(resubscribeResponse.status).toBe(200);
    expect(resubscribeResponse.body.data.status).toBe("subscribed");
    expect(resubscribeResponse.body.data.publication.subscriberCount).toBe(1);
  });
});
