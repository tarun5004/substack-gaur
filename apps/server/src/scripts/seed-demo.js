import { connectDatabase, disconnectDatabase } from "../configs/database.js";
import { isProduction } from "../configs/env.js";
import { Post } from "../modules/posts/post.model.js";
import { Publication } from "../modules/publications/publication.model.js";
import { Subscription } from "../modules/publications/subscription.model.js";
import { User } from "../modules/users/user.model.js";
import { sanitizePostContent } from "../utils/post-content.js";
import { calculateReadTime } from "../utils/read-time.js";

const demoUser = {
  fullName: "Sahyogi Demo Writer",
  username: "sahyogi_demo",
  email: process.env.DEMO_USER_EMAIL || "demo.writer@example.com",
  bio: "A demo account for local publishing workflows.",
};

const demoPublication = {
  name: "Sahyogi Field Notes",
  slug: "sahyogi-field-notes",
  tagline: "Practical publishing notes for careful builders.",
  description: "A local demo publication with realistic posts, subscribers, drafts, and settings.",
  accentColor: "#0f766e",
  status: "active",
};

const demoPosts = [
  {
    title: "How to shape a useful publication rhythm",
    slug: "shape-useful-publication-rhythm",
    subtitle: "A simple weekly system for publishing without burning out.",
    category: "Publishing",
    tags: ["publishing", "workflow", "editorial"],
    status: "published",
    publishedAt: new Date("2026-05-01T10:30:00.000Z"),
    content: {
      html: "<p>A strong publication rhythm starts with one clear promise, one repeatable cadence, and one honest feedback loop.</p><h2>Keep the system visible</h2><p>Plan research, drafting, review, publishing, and reader replies as one calm operating system.</p>",
      text: "A strong publication rhythm starts with one clear promise, one repeatable cadence, and one honest feedback loop. Keep the system visible. Plan research, drafting, review, publishing, and reader replies as one calm operating system.",
    },
  },
  {
    title: "Designing dashboards that help writers decide",
    slug: "designing-dashboards-help-writers-decide",
    subtitle: "Metrics should guide the next issue, not distract from it.",
    category: "Product",
    tags: ["dashboard", "analytics", "writing"],
    status: "published",
    publishedAt: new Date("2026-05-08T09:00:00.000Z"),
    content: {
      html: "<p>Writer analytics are most useful when they explain direction instead of demanding constant reaction.</p><p>Good dashboards make the next editorial decision easier.</p>",
      text: "Writer analytics are most useful when they explain direction instead of demanding constant reaction. Good dashboards make the next editorial decision easier.",
    },
  },
  {
    title: "Draft notes for a better subscribe flow",
    slug: "draft-notes-better-subscribe-flow",
    subtitle: "A working draft for testing editor and dashboard flows.",
    category: "Growth",
    tags: ["subscriptions", "trust"],
    status: "draft",
    content: {
      html: "<p>Readers subscribe when the promise is clear and the exchange feels respectful.</p>",
      text: "Readers subscribe when the promise is clear and the exchange feels respectful.",
    },
  },
];

const demoSubscribers = [
  "reader.one@example.com",
  "reader.two@example.com",
  "reader.three@example.com",
  "reader.four@example.com",
  "reader.five@example.com",
  "reader.six@example.com",
  "reader.seven@example.com",
  "reader.eight@example.com",
  "reader.nine@example.com",
  "reader.ten@example.com",
];

async function upsertDemoUser() {
  const password = process.env.DEMO_USER_PASSWORD;
  if (!password) {
    throw new Error("Set DEMO_USER_PASSWORD in apps/server/.env before running the demo seed.");
  }

  const passwordHash = await User.hashPassword(password);
  return User.findOneAndUpdate(
    { email: demoUser.email },
    {
      $set: {
        ...demoUser,
        passwordHash,
        role: "writer",
        emailVerifiedAt: new Date(),
      },
    },
    { new: true, upsert: true },
  );
}

async function upsertPublication(ownerId) {
  return Publication.findOneAndUpdate(
    { slug: demoPublication.slug },
    {
      $set: {
        ...demoPublication,
        ownerId,
      },
    },
    { new: true, upsert: true },
  );
}

async function upsertPosts(publicationId, authorId) {
  const results = [];

  for (const post of demoPosts) {
    const content = sanitizePostContent(post.content);
    const savedPost = await Post.findOneAndUpdate(
      { slug: post.slug },
      {
        $set: {
          ...post,
          publicationId,
          authorId,
          content,
          readTimeMinutes: calculateReadTime(content.text),
          seo: {
            title: post.title,
            description: post.subtitle,
          },
        },
      },
      { new: true, upsert: true },
    );
    results.push(savedPost);
  }

  return results;
}

async function upsertSubscribers(publicationId) {
  for (const email of demoSubscribers) {
    await Subscription.updateOne(
      { publicationId, email },
      {
        $set: {
          publicationId,
          email,
          status: "active",
          source: "demo_seed",
        },
      },
      { upsert: true },
    );
  }

  const subscriberCount = await Subscription.countDocuments({
    publicationId,
    status: "active",
  });
  await Publication.findByIdAndUpdate(publicationId, { $set: { subscriberCount } });
  return subscriberCount;
}

async function seedDemoData() {
  if (isProduction) {
    throw new Error("Demo seed is disabled in production.");
  }

  await connectDatabase();
  const user = await upsertDemoUser();
  const publication = await upsertPublication(user._id);
  const posts = await upsertPosts(publication._id, user._id);
  const subscriberCount = await upsertSubscribers(publication._id);

  return {
    user: user.email,
    publication: publication.slug,
    posts: posts.length,
    subscribers: subscriberCount,
  };
}

seedDemoData()
  .then((summary) => {
    console.log(
      `Demo data ready: ${summary.publication}, ${summary.posts} posts, ${summary.subscribers} subscribers.`,
    );
  })
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
