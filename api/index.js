const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const NodeCache = require("node-cache");
require("dotenv").config();

const app = express();
app.use(cors());

const myCache = new NodeCache({ stdTTL: 60 });

app.set("trust proxy", 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

const fetchp = import("node-fetch").then(module => module.default);

if (!process.env.DISCORD_BOT_TOKEN) {
  throw new Error("Missing DISCORD_BOT_TOKEN environment variable");
}

// -------------------
// Helper Functions
// -------------------

async function getUserData(userId) {
  // Check cache first
  const cachedData = myCache.get(userId);
  if (cachedData) return cachedData;

  const fetch = await fetchp;
  const DISCORD_API_BASE_URL = "https://discord.com/api";
  const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

  try {
    const response = await fetch(`${DISCORD_API_BASE_URL}/users/${userId}`, {
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user data from Discord API: ${response.status} ${response.statusText}`);
    }

    const userData = await response.json();
    myCache.set(userId, userData);
    return userData;
  } catch (error) {
    console.error("Error in getUserData:", error);
    throw new Error("Failed to fetch user data");
  }
}

async function getPfp(userId, size = 512) {
  try {
    const userData = await getUserData(userId);
    let avatarUrl;

    if (userData.avatar) {
      if (userData.avatar.startsWith("a_")) {
        avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${userData.avatar}.gif?size=${size}`;
      } else {
        avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${userData.avatar}.png?size=${size}`;
      }
    } else {
      // If no custom avatar, choose one of the default avatars.
      const defaultAvatarIndex = userData.discriminator ? parseInt(userData.discriminator, 10) % 5 : 0;
      avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
    }

    return {
      id: userData.id,
      username: userData.username,
      display_name: userData.global_name || userData.username,
      avatarUrl,
      discriminator: userData.discriminator,
    };
  } catch (error) {
    console.error("Error in getPfp:", error);
    throw new Error("Failed to fetch user data or avatar");
  }
}

async function getBanner(userId, size = 512) {
  try {
    const userData = await getUserData(userId);
    if (userData.banner) {
      let bannerUrl;
      if (userData.banner.startsWith("a_")) {
        bannerUrl = `https://cdn.discordapp.com/banners/${userId}/${userData.banner}.gif?size=${size}`;
      } else {
        bannerUrl = `https://cdn.discordapp.com/banners/${userId}/${userData.banner}.png?size=${size}`;
      }
      return {
        id: userData.id,
        bannerUrl,
      };
    } else {
      throw new Error("User does not have a banner");
    }
  } catch (error) {
    console.error("Error in getBanner:", error);
    throw new Error("Failed to fetch banner data");
  }
}

// -------------------
// API Endpoints
// -------------------

app.get("/api", (req, res) => {
  const endpoints = [
    { url: "/api", description: "Welcome message and list of endpoints" },
    { url: "/api/:userId", description: "Get user avatar URL (JSON)" },
    { url: "/api/pfp/:userId/image", description: "Redirect to user avatar image" },
    { url: "/api/pfp/:userId/smallimage", description: "Redirect to small user avatar image" },
    { url: "/api/pfp/:userId/bigimage", description: "Redirect to big user avatar image" },
    { url: "/api/pfp/:userId/superbigimage", description: "Redirect to super big user avatar image" },
    { url: "/api/user/:userId/raw", description: "Get raw Discord user data (JSON)" },
    { url: "/api/banner/:userId", description: "Get user banner URL (JSON)" },
    { url: "/api/banner/:userId/image", description: "Redirect to user banner image" },
  ];
  res.json({ endpoints });
});

app.get("/api/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const avatarData = await getPfp(userId);
    res.json(avatarData);
  } catch (error) {
    console.error("Error in /api/:userId:", error);
    res.status(500).json({ error: "Failed to fetch user data or avatar" });
  }
});

app.get("/api/pfp/:userId/image", async (req, res) => {
  const { userId } = req.params;
  const size = req.query.size || 512;
  try {
    const avatarData = await getPfp(userId, size);
    res.redirect(avatarData.avatarUrl);
  } catch (error) {
    console.error("Error in /api/pfp/:userId/image:", error);
    res.status(500).json({ error: "Failed to fetch user data or avatar" });
  }
});

app.get("/api/pfp/:userId/smallimage", async (req, res) => {
  const { userId } = req.params;
  const size = req.query.size || 128;
  try {
    const avatarData = await getPfp(userId, size);
    res.redirect(avatarData.avatarUrl);
  } catch (error) {
    console.error("Error in /api/pfp/:userId/smallimage:", error);
    res.status(500).json({ error: "Failed to fetch user data or avatar" });
  }
});

app.get("/api/pfp/:userId/bigimage", async (req, res) => {
  const { userId } = req.params;
  const size = req.query.size || 1024;
  try {
    const avatarData = await getPfp(userId, size);
    res.redirect(avatarData.avatarUrl);
  } catch (error) {
    console.error("Error in /api/pfp/:userId/bigimage:", error);
    res.status(500).json({ error: "Failed to fetch user data or avatar" });
  }
});

app.get("/api/pfp/:userId/superbigimage", async (req, res) => {
  const { userId } = req.params;
  const size = req.query.size || 4096;
  try {
    const avatarData = await getPfp(userId, size);
    res.redirect(avatarData.avatarUrl);
  } catch (error) {
    console.error("Error in /api/pfp/:userId/superbigimage:", error);
    res.status(500).json({ error: "Failed to fetch user data or avatar" });
  }
});

app.get("/api/user/:userId/raw", async (req, res) => {
  const { userId } = req.params;
  try {
    const userData = await getUserData(userId);
    res.json(userData);
  } catch (error) {
    console.error("Error in /api/user/:userId/raw:", error);
    res.status(500).json({ error: "Failed to fetch raw user data" });
  }
});

app.get("/api/banner/:userId", async (req, res) => {
  const { userId } = req.params;
  const size = req.query.size || 512;
  try {
    const bannerData = await getBanner(userId, size);
    res.json(bannerData);
  } catch (error) {
    console.error("Error in /api/banner/:userId:", error);
    res.status(404).json({ error: "Banner not available" });
  }
});

app.get("/api/banner/:userId/image", async (req, res) => {
  const { userId } = req.params;
  const size = req.query.size || 512;
  try {
    const bannerData = await getBanner(userId, size);
    res.redirect(bannerData.bannerUrl);
  } catch (error) {
    console.error("Error in /api/banner/:userId/image:", error);
    res.status(404).json({ error: "Banner not available" });
  }
});
// Fallback 404 endpoint
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
