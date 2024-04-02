const express = require("express");
const cors = require("cors");
require("dotenv").config();

async function getUserData(userId) {
  const fetch = (await import("node-fetch")).default;
  const DISCORD_API_BASE_URL = "https://discord.com/api";
  const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

  try {
    const response = await fetch(`${DISCORD_API_BASE_URL}/users/${userId}`, {
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user data from Discord API");
    }

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Failed to fetch user data");
  }
}

async function getInfo(userId) {
  try {
    const userData = await getUserData(userId);
    let avatarUrl;
    if (userData.avatar.startsWith("a_")) {
      avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${userData.avatar}.gif?size=128`;
    } else {
      avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${userData.avatar}.png?size=128`;
    }

    return {
      id: userData.id,
      username: userData.username,
      display_name: userData.global_name,
      avatarUrl: avatarUrl
    };
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Failed to fetch user data or avatar");
  }
}

const app = express();

app.use(cors());

app.get("/api", (req, res) => {
  const endpoints = [
    { url: "/api", description: "Welcome message and list of endpoints" },
    { url: "/api/:userId", description: "Get user avatar URL, username, display name, and ID" },
    { url: "/api/:userId/image", description: "Get user avatar image" },
    { url: "/api/:userId/smallimage", description: "Get user small avatar image" },
    { url: "/api/:userId/bigimage", description: "Get user big avatar image" },
    { url: "/api/:userId/superbigimage", description: "Get user big avatar image" }
  ];
  res.json({ endpoints });
});

app.get("/api/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const userData = await getInfo(userId);
    res.json(userData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch user data or avatar" });
  }
});

app.get("/api/:userId/image", async (req, res) => {
  const userId = req.params.userId;
  const size = req.query.size || 512;
  try {
    const avatarUrl = await getInfo(userId, size);
    res.redirect(avatarUrl);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch user data or avatar" });
  }
});

app.get("/api/:userId/smallimage", async (req, res) => {
  const userId = req.params.userId;
  const size = req.query.size || 128;
  try {
    const avatarUrl = await getInfo(userId, size);
    res.redirect(avatarUrl);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch user data or avatar" });
  }
});

app.get("/api/:userId/bigimage", async (req, res) => {
  const userId = req.params.userId;
  const size = req.query.size || 1024;
  try {
    const avatarUrl = await getInfo(userId, size);
    res.redirect(avatarUrl);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch user data or avatar" });
  }
});

app.get("/api/:userId/superbigimage", async (req, res) => {
  const userId = req.params.userId;
  const size = req.query.size || 4096;
  try {
    const avatarUrl = await getInfo(userId, size);
    res.redirect(avatarUrl);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch user data or avatar" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port localhost:${PORT}`);
});
