# Discord Avatar API
Free to use PFP api 

## Usage

### Endpoints Overview

- **Welcome Endpoint:**  
  **URL:** `/api`  
  **Method:** GET  
  **Description:** Returns a welcome message along with a list of available endpoints.

- **Get Avatar Data (JSON):**  
  **URL:** `/api/:userId`  
  **Method:** GET  
  **Description:** Returns the avatar URL, username, and display name for the specified Discord user.
  
  **Example Response:**
  ```json
  {
    "id": "773952016036790272",
    "username": "yellowgreg",
    "display_name": "yellowgreg",
    "avatarUrl": "https://cdn.discordapp.com/avatars/773952016036790272/cfe9480144d80fbf9625abf9e66a0b9b.png?size=128",
    "discriminator": "1234"
  }
  ```

- **Redirect to Avatar Image:**  
  **URLs:**
  - `/api/pfp/:userId/image` (default size: 512)
  - `/api/pfp/:userId/smallimage` (default size: 128)
  - `/api/pfp/:userId/bigimage` (default size: 1024)
  - `/api/pfp/:userId/superbigimage` (default size: 4096)  
  **Method:** GET  
  **Description:** Redirects the client to the actual image URL of the user’s avatar. An optional `size` query parameter can override the default size.

- **Get Raw User Data:**  
  **URL:** `/api/user/:userId/raw`  
  **Method:** GET  
  **Description:** Returns the full JSON data received from the Discord API.

- **Banner Endpoints:**  
  **JSON Response:**  
  **URL:** `/api/banner/:userId`  
  **Method:** GET  
  **Description:** Returns the banner URL (if available) in JSON format.

  **Image Redirect:**  
  **URL:** `/api/banner/:userId/image`  
  **Method:** GET  
  **Description:** Redirects to the banner image URL.

- **Fallback 404:**  
  Any unknown endpoints will return a 404 JSON response:
  ```json
  { "error": "Endpoint not found" }
  ```

## Dependencies

- [express](https://www.npmjs.com/package/express): A minimal and flexible Node.js web framework.
- [cors](https://www.npmjs.com/package/cors): Enables Cross-Origin Resource Sharing.
- [dotenv](https://www.npmjs.com/package/dotenv): Loads environment variables from a `.env` file.
- [node-fetch](https://www.npmjs.com/package/node-fetch): A light-weight module that brings `window.fetch` to Node.js.
- [express-rate-limit](https://www.npmjs.com/package/express-rate-limit): Provides basic IP rate limiting middleware.
- [node-cache](https://www.npmjs.com/package/node-cache): Simple in‑memory caching for Node.js.


