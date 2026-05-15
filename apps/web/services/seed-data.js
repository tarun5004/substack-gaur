const publication = {
  id: "pub_1",
  name: "Sahyogi Review",
  slug: "sahyogi-review",
  tagline: "Independent software writing with taste, depth, and useful detail.",
  description:
    "A publication for builders who care about craft, distribution, and the quiet systems behind enduring work.",
  accentColor: "#0f766e",
  subscriberCount: 18420,
};
const author = {
  id: "usr_1",
  fullName: "Aarav Mehta",
  username: "aarav",
  avatarUrl: "",
  bio: "Writer, product engineer, and editor of Sahyogi Review.",
};
export const seedPosts = [
  {
    id: "post_1",
    title: "The craft of independent publishing",
    slug: "the-craft-of-independent-publishing",
    subtitle: "A practical field guide for building a publication readers return to.",
    coverImageUrl: "",
    category: "Publishing",
    tags: ["writing", "creator-economy", "systems"],
    readTimeMinutes: 6,
    publishedAt: "2026-05-10T10:30:00.000Z",
    author,
    publication,
    content: {
      text: "Independent publishing rewards clarity, cadence, and reader trust.",
      html: `
        <p>Independent publishing rewards clarity, cadence, and reader trust. The best publications do not feel like content machines. They feel like dependable editorial homes.</p>
        <p>A strong system starts with a simple promise: who the publication serves, what it notices before others do, and why a reader should let it into their week.</p>
        <h2>Build the operating rhythm</h2>
        <p>Plan around repeatable rituals: research, drafting, editorial review, publishing, distribution, and subscriber feedback. The interface should make those rituals obvious without making them noisy.</p>
        <blockquote>Great publishing tools protect attention on both sides: the writer's attention while creating, and the reader's attention while reading.</blockquote>
      `,
    },
  },
  {
    id: "post_2",
    title: "Why calm dashboards make better writers",
    slug: "calm-dashboards-better-writers",
    subtitle: "Analytics should guide decisions without turning every essay into a slot machine.",
    coverImageUrl: "",
    category: "Product",
    tags: ["analytics", "ux", "dashboard"],
    readTimeMinutes: 4,
    publishedAt: "2026-05-08T08:00:00.000Z",
    author,
    publication,
    content: {
      text: "Writer analytics should be legible, directional, and humane.",
      html: "<p>Writer analytics should be legible, directional, and humane. Sahyogi keeps the signal close to the publishing workflow instead of overwhelming the writer with vanity graphs.</p>",
    },
  },
  {
    id: "post_3",
    title: "Designing subscription flows readers trust",
    slug: "subscription-flows-readers-trust",
    subtitle: "A high-converting form can still feel respectful.",
    coverImageUrl: "",
    category: "Growth",
    tags: ["subscriptions", "trust", "email"],
    readTimeMinutes: 5,
    publishedAt: "2026-05-04T12:00:00.000Z",
    author,
    publication,
    content: {
      text: "Trust starts before the email field.",
      html: "<p>Trust starts before the email field. Readers need a clear promise, a sense of cadence, and confidence that their inbox will not become a dumping ground.</p>",
    },
  },
];
export const seedPublications = [
  publication,
  {
    id: "pub_2",
    name: "Build Notes",
    slug: "build-notes",
    tagline: "Deep dives from engineers shipping durable software.",
    description:
      "Practical engineering essays with architecture notes, release thinking, and product lessons.",
    accentColor: "#7c3aed",
    subscriberCount: 9360,
  },
  {
    id: "pub_3",
    name: "Small Teams Weekly",
    slug: "small-teams-weekly",
    tagline: "Operating notes for tiny teams with serious standards.",
    description: "A weekly briefing on product taste, support systems, and calm execution.",
    accentColor: "#b45309",
    subscriberCount: 12880,
  },
];
