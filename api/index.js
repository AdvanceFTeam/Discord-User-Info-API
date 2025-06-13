const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const NodeCache = require("node-cache");
const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));
require("dotenv").config();

const app = express();
app.use(cors());
app.use(helmet());
app.set("trust proxy", 1);

const PORT = process.env.PORT || 3000;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CACHE_TTL = parseInt(process.env.CACHE_TTL || "60", 10);

if (!DISCORD_BOT_TOKEN) {
  throw new Error("Missing DISCORD_BOT_TOKEN in .env");
}

const myCache = new NodeCache({ stdTTL: CACHE_TTL });
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

const isValidUserId = (id) => /^\d{17,20}$/.test(id);

async function cachedFetch(key, fetchFn) {
  const cached = myCache.get(key);
  if (cached) return cached;
  const result = await fetchFn();
  myCache.set(key, result);
  return result;
}

// -------------------
// discord functon
// -------------------
async function getUserData(userId) {
  return cachedFetch(userId, async () => {
    const res = await fetch(`https://discord.com/api/users/${userId}`, {
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
    });
    if (!res.ok) throw new Error(`Discord API error: ${res.status}`);
    return res.json();
  });
}

async function getAvatar(userId, size = 512) {
  const user = await getUserData(userId);
  let url;

  if (user.avatar) {
    const ext = user.avatar.startsWith("a_") ? "gif" : "png";
    url = `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.${ext}?size=${size}`;
  } else {
    const defaultIndex = user.discriminator
      ? parseInt(user.discriminator) % 5
      : 0;
    url = `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
  }

  return {
    id: user.id,
    username: user.username,
    display_name: user.global_name || user.username,
    avatarUrl: url,
    discriminator: user.discriminator,
  };
}

async function getBanner(userId, size = 512) {
  const user = await getUserData(userId);
  if (!user.banner) throw new Error("User has no banner");
  const ext = user.banner.startsWith("a_") ? "gif" : "png";
  const url = `https://cdn.discordapp.com/banners/${userId}/${user.banner}.${ext}?size=${size}`;
  return { id: user.id, bannerUrl: url };
}

// -------------------
// github funciton 
// -------------------
async function _GithubUser(username) {
  return cachedFetch(`github_${username}`, async () => {
    const res = await fetch(`https://api.github.com/users/${username}`, {
      headers: { 'User-Agent': 'Node.js Server' }
    });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    return res.json();
  });
}

// -------------------
// Routes
// -------------------
app.get("/api", (req, res) => {
  res.json({
    endpoints: [
      // Discord
      { url: "/api/:userId", description: "Get avatar JSON info (JSON)" },
      { url: "/api/user/:userId/raw", description: "Get raw Discord user data (JSON)" },
      { url: "/api/pfp/:userId/image", description: "Redirect to avatar (512px)" },
      { url: "/api/pfp/:userId/smallimage", description: "Redirect to avatar (128px)" },
      { url: "/api/pfp/:userId/bigimage", description: "Redirect to avatar (1024px)" },
      { url: "/api/pfp/:userId/superbigimage", description: "Redirect to avatar (4096px)" },
      { url: "/api/pfp/:userId/:size", description: "Redirect to avatar with custom size (64–4096)" },
      { url: "/api/banner/:userId", description: "Get banner URL JSON for a user (JSON)" },
      { url: "/api/banner/:userId/image", description: "Redirect to banner image" },

      // GitHub
      { url: "/api/github/:username", description: "Get GitHub user JSON info" },
      { url: "/api/github/:username/pfp", description: "Redirect to GitHub avatar image" }
    ]
  });
});

// -------------------
// Discord route
// -------------------
app.get("/api/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!isValidUserId(userId)) return res.status(400).json({ error: "Invalid user ID" });
  try {
    const data = await getAvatar(userId);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch avatar" });
  }
});

const imageSizes = {
  image: 512,
  smallimage: 128,
  bigimage: 1024,
  superbigimage: 4096,
};

Object.entries(imageSizes).forEach(([endpoint, size]) => {
  app.get(`/api/pfp/:userId/${endpoint}`, async (req, res) => {
    const { userId } = req.params;
    if (!isValidUserId(userId)) return res.status(400).json({ error: "Invalid user ID" });
    try {
      const data = await getAvatar(userId, size);
      const imageRes = await fetch(data.avatarUrl);
      const contentType = imageRes.headers.get("content-type");
      res.set("Content-Type", contentType);
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
      imageRes.body.pipe(res);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Could not fetch avatar" });
    }
  });
});

app.get("/api/pfp/:userId/:size", async (req, res) => {
  const { userId, size } = req.params;
  if (!isValidUserId(userId)) return res.status(400).json({ error: "Invalid user ID" });

  const numericSize = parseInt(size, 10);
  const allowedSizes = [64, 128, 256, 512, 1024, 2048, 4096];
  const finalSize = allowedSizes.includes(numericSize) ? numericSize : 512;

  try {
    const data = await getAvatar(userId, finalSize);
    const imageRes = await fetch(data.avatarUrl);
    const contentType = imageRes.headers.get("content-type");
    res.set("Content-Type", contentType);
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    imageRes.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch avatar" });
  }
});

app.get("/api/user/:userId/raw", async (req, res) => {
  const { userId } = req.params;
  if (!isValidUserId(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const user = await getUserData(userId);

    const avatarExt = user.avatar?.startsWith("a_") ? "gif" : "png";
    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.${avatarExt}?size=512`
      : `https://cdn.discordapp.com/embed/avatars/${user.discriminator ? parseInt(user.discriminator) % 5 : 0}.png`;

    const bannerExt = user.banner?.startsWith("a_") ? "gif" : "png";
    const bannerUrl = user.banner
      ? `https://cdn.discordapp.com/banners/${userId}/${user.banner}.${bannerExt}?size=512`
      : null;

    res.json({
      id: user.id,
      username: user.username,
      display_name: user.global_name || user.username,
      avatar: user.avatar,
      avatarUrl,
      discriminator: user.discriminator,
      public_flags: user.public_flags,
      flags: user.flags,
      accent_color: user.accent_color,
      banner: user.banner,
      banner_color: user.banner_color,
      bannerUrl,
      avatar_decoration_data: user.avatar_decoration_data,
      collectibles: user.collectibles,
      clan: user.clan,
      primary_guild: user.primary_guild
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch user data" });
  }
});

app.get("/api/banner/:userId", async (req, res) => {
  const { userId } = req.params;
  const size = req.query.size || 512;
  if (!isValidUserId(userId)) return res.status(400).json({ error: "Invalid user ID" });

  try {
    const data = await getBanner(userId, size);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: "Banner not available" });
  }
});

app.get("/api/banner/:userId/image", async (req, res) => {
  const { userId } = req.params;
  const size = req.query.size || 512;
  if (!isValidUserId(userId)) return res.status(400).json({ error: "Invalid user ID" });

  try {
    const data = await getBanner(userId, size);
    const imageRes = await fetch(data.bannerUrl);
    const contentType = imageRes.headers.get("content-type");
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    res.set("Content-Type", contentType);
    imageRes.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: "Banner not available" });
  }
});

// -------------------
// GitHub route
// -------------------
app.get("/api/github/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const user = await _GithubUser(username);
    res.json({
      id: user.id,
      username: user.login,
      display_name: user.name || user.login,
      avatarUrl: user.avatar_url,
      profileUrl: user.html_url,
      bio: user.bio,
      public_repos: user.public_repos,
      followers: user.followers,
      following: user.following,
      location: user.location,
      company: user.company,
      blog: user.blog
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch GitHub user data" });
  }
});

app.get("/api/github/:username/pfp", async (req, res) => {
  const { username } = req.params;
  try {
    const user = await _GithubUser(username);
    const imageRes = await fetch(user.avatar_url);
    const contentType = imageRes.headers.get("content-type");
    res.set("Content-Type", contentType);
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    imageRes.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch GitHub avatar" });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

module.exports = app;
