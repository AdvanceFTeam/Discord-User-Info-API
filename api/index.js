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

async function getPfp(userId, size = 512) {
  try {
    const userData = await getUserData(userId);
    let avatarUrl;

    if (userData.avatar && userData.avatar.startsWith("a_")) {
      avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${userData.avatar}.gif?size=${size}`;
    }
    else if (userData.avatar) {
      avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${userData.avatar}.png?size=${size}`;
    }
    // If no custom avatar(pfp), it uses the default Discord avatar
    else {
      const defaultAvatarIndex = parseInt(userData.discriminator, 10) % 5; //modulo of discriminator
      avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
    }

    return {
      id: userData.id,
      username: userData.username,
      display_name: userData.global_name || userData.username,
      avatarUrl: avatarUrl,
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
    { url: "/api/:userId", description: "Get user avatar URL" },
    { url: "/api/pfp/:userId/image", description: "Get user avatar image" },
    { url: "/api/pfp/:userId/smallimage", description: "Get user small avatar image" },
    { url: "/api/pfp/:userId/bigimage", description: "Get user big avatar image" },
    { url: "/api/pfp/:userId/superbigimage", description: "Get user super big avatar image" }
  ];
  res.json({ endpoints });
});


app.get("/api/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const avatarUrl = await getPfp(userId);
    res.json({ avatarUrl });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch user data or avatar" });
  }
});

app.get("/api/pfp/:userId/image", async (req, res) => {
  const userId = req.params.userId;
  const size = req.query.size || 512;
  try {
    const avatarUrl = await getPfp(userId, size);
    res.redirect(avatarUrl.avatarUrl);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch user data or avatar" });
  }
});

app.get("/api/pfp/:userId/smallimage", async (req, res) => {
  const userId = req.params.userId;
  const size = req.query.size || 128;
  try {
    const avatarUrl = await getPfp(userId, size);
    res.redirect(avatarUrl.avatarUrl);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch user data or avatar" });
  }
});

app.get("/api/pfp/:userId/bigimage", async (req, res) => {
  const userId = req.params.userId;
  const size = req.query.size || 1024;
  try {
    const avatarUrl = await getPfp(userId, size);
    res.redirect(avatarUrl.avatarUrl);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch user data or avatar" });
  }
});

app.get("/api/pfp/:userId/superbigimage", async (req, res) => {
  const userId = req.params.userId;
  const size = req.query.size || 4096;
  try {
    const avatarUrl = await getPfp(userId, size);
    res.redirect(avatarUrl.avatarUrl);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch user data or avatar" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port localhost:${PORT}`);
});
