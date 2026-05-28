# Ndunda - Namibia Rental Marketplace

## Project Overview

Ndunda is a rental marketplace platform for Namibia, connecting tenants with property owners and verified agents. Find rooms, apartments, and houses for rent, or list your property for free.

## Development Setup

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Copy env template and add Clerk keys (see .env.example).
cp .env.example .env.local

# Step 5: Start Convex backend (separate terminal).
npx convex dev

# Step 6: Start the Vite dev server.
npm run dev
```

### Auth & backend

- **Clerk** — sign-in, sign-up, sessions ([dashboard](https://dashboard.clerk.com))
- **Convex** — database and API ([docs](https://docs.convex.dev))

After creating a Clerk app, enable the [Convex integration](https://dashboard.clerk.com/apps/setup/convex) and set:

```sh
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<your-clerk-frontend-api>.clerk.accounts.dev
npx convex env set ADMIN_EMAILS yammertaurus@gmail.com
```

Add `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_FRONTEND_API_URL`, and `CLERK_JWT_ISSUER_DOMAIN` to `.env.local`.

Clerk must have a JWT template named `convex`. If `/admin` shows `No JWT template exists with name: convex`, open the Clerk Dashboard for the app and activate the Convex integration or create the `convex` JWT template. Then sign out completely and sign back in so Clerk issues a fresh token.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Convex (backend)
- Clerk (authentication)

## How can I deploy this project?

This project can be deployed to any hosting platform that supports Vite/React applications:
- Vercel
- Netlify
- AWS Amplify
- GitHub Pages
- Or any Node.js hosting service

## Features

- Property listings with detailed views
- Agent profiles and reviews
- Real-time messaging/chat
- User authentication (Login/Signup)
- Saved properties
- Search and filtering
- Map integration
- Schedule property viewings
