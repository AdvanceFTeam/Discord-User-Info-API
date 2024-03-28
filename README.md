# Discord Avatar API

This Node.js application provides an API for fetching Discord user avatars(pfp).

## Installation

1. Clone this repository.
2. Install dependencies by running `npm install`.
```
npm install cors express node-fetch dotenv
```
4. Create a `.env` file in the root directory and add your Discord bot token:
   ```
   DISCORD_BOT_TOKEN=your_discord_bot_token_here
   ```
5. Start the server by running `cd api` first then `node index`.

## Usage

### Get Avatar URL

- **Endpoint:** `/api/pfp/:userId`
- **Method:** GET
- **Parameters:**
  - `userId` (required): Discord user ID for which avatar is to be fetched.
- **Example:**
  ```json
  {
    "avatarUrl": "https://cdn.discordapp.com/avatars/userId/avatar.png"
  }
  ```
- **Response:** JSON object containing the avatar URL.

### Get Avatar Image

- **Endpoint:** `/api/pfp/:userId/image`
- **Method:** GET
- **Parameters:**
  - `userId` (required): Discord user ID for which avatar is to be fetched.
  - `size` (optional): Size of the avatar image. Default is 512.
- **Response:** Redirects to the URL of the avatar image.

### Get Small Avatar Image

- **Endpoint:** `/api/pfp/:userId/smallimage`
- **Method:** GET
- **Parameters:**
  - `userId` (required): Discord user ID for which avatar is to be fetched.
  - `size` (optional): Size of the avatar image. Default is 128.
- **Response:** Redirects to the URL of the avatar image with specified size.

### Get Big Avatar Image

- **Endpoint:** `/api/pfp/:userId/bigimage`
- **Method:** GET
- **Parameters:**
  - `userId` (required): Discord user ID for which avatar is to be fetched.
  - `size` (optional): Size of the avatar image. Default is 1024.
- **Response:** Redirects to the URL of the avatar image with specified size.

## Dependencies

- [express](https://www.npmjs.com/package/express): Fast, unopinionated, minimalist web framework for Node.js.
- [cors](https://www.npmjs.com/package/cors): Middleware for enabling Cross-Origin Resource Sharing (CORS) in Express.js.
- [dotenv](https://www.npmjs.com/package/dotenv): Loads environment variables from a .env file into process.env.

## License

- Free to use
