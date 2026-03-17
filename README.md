# Robinson's Auctioneers - Full Documentation

This document explains the entire project from top to bottom: what it is, how it is structured, how every file works, how the front end and back end talk to each other, and how it is deployed. Handles image upload but i didnt add that to the docs here lol.

---

## Table of Contents

1. [What the Project Is](#1-what-the-project-is)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Folder Structure Overview](#3-folder-structure-overview)
4. [Deployment](#4-deployment)
5. [Backend - Deep Dive](#5-backend---deep-dive)
   - [Technology Stack](#technology-stack-backend)
   - [How the Database Works](#how-the-database-works)
   - [Database Schema (Tables)](#database-schema-tables)
   - [File by File Explanation](#file-by-file-explanation-backend)
   - [All API Endpoints](#all-api-endpoints)
   - [How the Docker Image Works (Backend)](#how-the-docker-image-works-backend)
6. [Frontend - Deep Dive](#6-frontend---deep-dive)
   - [Technology Stack](#technology-stack-frontend)
   - [Environment Variables](#environment-variables)
   - [File by File Explanation](#file-by-file-explanation-frontend)
   - [Pages](#pages)
   - [Components](#components)
   - [How the Docker Image Works (Frontend)](#how-the-docker-image-works-frontend)
7. [Session Management](#7-session-management)
8. [Admin System and Bootstrap](#8-admin-system-and-bootstrap)
9. [Running Locally with Docker Compose](#9-running-locally-with-docker-compose)
10. [Request Flow - A Worked Example](#10-request-flow---a-worked-example)

---

## 1. What the Project Is

Robinson's Auctioneers is a full-stack web application for running online auctions. Users can:

- Browse active and ended auctions without logging in.
- Register for an account and log in.
- Create their own auctions.
- Place bids on other users' auctions.
- View their dashboard showing their own auctions and any auctions they have won.
- Admins can manage all auctions, end them early, delete them, and create other admin accounts.

The project is split into two independent pieces:

- **Backend**: A REST API written in Rust, deployed to Render.
- **Frontend**: A React single-page application, deployed to Vercel.

---

## 2. High-Level Architecture

```
Browser (User)
     |
     | HTTPS
     v
Vercel (Frontend)
  React app - static files served via Vercel's CDN
     |
     | HTTP requests to API (HTTPS)
     v
Render (Backend)
  Rust Axum HTTP server
     |
     | reads / writes
     v
SQLite database file
  stored on the Render container's disk
```

The frontend is a collection of HTML, CSS, and JavaScript files that run entirely in the user's browser. When the user does something like place a bid, the browser sends an HTTP request directly to the backend URL on Render. The backend processes the request, reads or writes the SQLite database file, and sends a JSON response back to the browser. The frontend then updates what the user sees.

There is no server-side rendering. The frontend is purely client-side.

---

## 3. Folder Structure Overview

```
cloud-assignment/
  README.md             <- This file
  docker-compose.yml    <- Runs both services locally together
  bycrypt.py            <- Standalone utility to hash a password (for manual testing)

  Backend/              <- The Rust API
    Cargo.toml          <- Rust dependency list (like package.json for Rust)
    Dockerfile          <- Instructions to build the backend into a Docker image
    src/                <- All Rust source code
      main.rs           <- Entry point - starts the server, defines all routes
      database.rs       <- Opens SQLite connections, creates the DB file if missing
      queries.rs        <- All raw SQL strings as Rust constants
      structs.rs        <- Data types used across the app (Auction, Bid, Account, etc.)
      crud.rs           <- Functions that read and write to the database
      authentication.rs <- Password hashing, session expiry logic, sign-in functions
      response.rs       <- Defines the standard JSON response shape sent to the client

  Frontend/             <- The React app
    package.json        <- Node.js dependency list
    vite.config.js      <- Vite build tool configuration
    vercel.json         <- Vercel deployment configuration (SPA routing fix)
    nginx.conf          <- nginx web server config used in the Docker image
    Dockerfile          <- Instructions to build the frontend into a Docker image
    .env                <- Environment variables (API URL, admin credentials)
    src/
      main.jsx          <- Entry point - mounts React, wraps app in providers
      App.jsx           <- Defines all page routes and the session checker
      helpers.js        <- Every function that calls the backend API
      utils.js          <- Small formatting helpers (price, time left)
      context/
        AuthContext.jsx <- Manages who is logged in (stored in localStorage)
      pages/
        HomePage.jsx          <- Shows all active and ended auctions
        LoginPage.jsx         <- Login, register, and admin login tabs
        AuctionDetailPage.jsx <- Shows one auction with its bid history
        DashboardPage.jsx     <- Logged-in user's own auctions and won auctions
        AdminPage.jsx         <- Admin-only management panel
      components/
        Navbar.jsx              <- Top navigation bar
        AuctionCard.jsx         <- Card tile shown in the auction grid
        BidModal.jsx            <- Popup form to place a bid
        CreateAuctionModal.jsx  <- Popup form to create a new auction
        EditAuctionModal.jsx    <- Popup form to edit an existing auction
        NewAdminModal.jsx       <- Popup form to create a new admin account
```

---

## 4. Deployment

### Backend - Render

The backend is deployed as a **Docker container** on Render.

- Render pulls the `Backend/Dockerfile`, builds it, and runs the resulting container.
- The container exposes port 3000. Render forwards public HTTPS traffic to it.
- The SQLite database file (`robinsons_auctioneers.db`) lives inside the container's `/app` directory.
- **Important limitation**: Render's free tier uses ephemeral storage. If the container restarts, the database file is wiped. A paid Render disk would be needed for persistence in production.
- The live backend URL is: `https://robinsons-auctioneers-0lh2.onrender.com`

### Frontend - Vercel

The frontend is deployed as a **static site** on Vercel.

- Vercel detects the `Frontend/` folder as a Vite project.
- It runs `npm run build` which produces a `dist/` folder of static HTML/JS/CSS files.
- Those files are served globally via Vercel's CDN.
- The `vercel.json` file contains one rule: redirect all URL paths to `index.html`. This is necessary because the app uses client-side routing (React Router). Without this, refreshing a page like `/auction/5` would return a 404 from Vercel because there is no actual file at that path.
- The `VITE_API_URL` environment variable must be set in the Vercel project settings to point at the Render backend URL.

### Why not Fly.io

Fly.io was originally considered but was dropped due to deployment issues. Render was chosen for the backend instead because its Docker-based deployment is more straightforward.

---

## 5. Backend - Deep Dive

### Technology Stack (Backend)

| Library | Purpose |
|---|---|
| **Rust** | The programming language. Fast, memory-safe, compiled. |
| **Axum** | The HTTP web framework. Handles routing and request/response parsing. |
| **Tokio** | Async runtime for Rust. Allows the server to handle many requests concurrently. |
| **rusqlite** | SQLite database driver for Rust. The `bundled` feature compiles SQLite directly into the binary so no external install is needed. |
| **bcrypt** | Password hashing library. Passwords are never stored in plain text. |
| **chrono** | Date and time library. Used for session expiry timestamps. |
| **serde / serde_json** | Serialization library. Converts Rust structs to JSON and JSON back to Rust structs. |
| **tower-http** | Middleware for Axum. Used here specifically for CORS headers. |

### How the Database Works

The backend uses **SQLite**, which is a single-file database. There is no separate database server process. The entire database is stored in one file called `robinsons_auctioneers.db`.

When the backend starts up, `database::initialize_db()` is called. It checks whether the `.db` file already exists on disk. If it does not exist yet, it creates it and runs the SQL schema to create all the tables. If it already exists, it does nothing and leaves the data alone.

Every time an API request needs to read or write data, `database::open_connection()` is called to get a fresh connection to the file. The connection is used for that one request, then dropped (closed automatically by Rust's ownership system).

This approach (opening a connection per request rather than holding one permanently) is fine for a low-traffic application and avoids connection management complexity.

### Database Schema (Tables)

There are five tables:

**accounts** - Registered users
```
account_id    INTEGER  Primary key, auto-incremented
username      TEXT     Unique. Used to log in.
email         TEXT     Unique.
password_hash TEXT     bcrypt hash of the user's password. Never the raw password.
created_at    DATETIME Automatically set to the current time when the row is inserted.
```

**admin** - Admin accounts (separate from normal users)
```
admin_id      INTEGER  Primary key, auto-incremented
username      TEXT     Unique.
password_hash TEXT     bcrypt hash.
```

**auctions** - Every auction listing
```
auction_id    INTEGER  Primary key, auto-incremented
title         TEXT     Name of the item being auctioned.
description   TEXT     Optional longer description.
starting_price REAL    The price bidding starts at.
current_price REAL     Updated each time a bid is placed. Starts equal to starting_price.
seller_id     INTEGER  The account_id of the user who created the auction.
start_time    DATETIME Automatically set when the auction row is created.
end_time      DATETIME Set by the seller. After this point the auction should be ended.
is_active     BOOLEAN  1 = open for bids. 0 = ended. Defaults to 1.
```

**bids** - Every individual bid placed
```
bid_id        INTEGER  Primary key, auto-incremented
auction_id    INTEGER  Which auction this bid is for.
bidder_id     INTEGER  Which user placed the bid.
bid_amount    REAL     The bid value in GBP.
bid_time      DATETIME Automatically set when the bid row is created.
```

**won_auctions** - Records of which user won which auction
```
win_id        INTEGER  Primary key, auto-incremented
auction_id    INTEGER  The auction that was won.
winner_id     INTEGER  The account_id of the winner.
winning_bid   REAL     The final winning amount.
won_time      DATETIME Automatically set.
```

A row is inserted into `won_auctions` when an auction is explicitly ended (via the end auction API call). The winner is determined by finding the highest bid in the `bids` table for that auction.

### File by File Explanation (Backend)

#### `src/main.rs`

This is the entry point of the entire backend. The `run()` function (called from the `app/` binary) does three things:

1. **Initialises the database** by calling `database::initialize_db()`. If the `.db` file does not exist, it creates it.

2. **Builds the router** using Axum. Every URL path the API exposes is registered here, along with which handler function to call. For example:
   ```
   .route("/api/auctions/active", get(get_active_auctions))
   ```
   This says: when a GET request arrives at `/api/auctions/active`, call the `get_active_auctions` function.

3. **Starts the HTTP server** listening on `0.0.0.0:PORT`. The `PORT` environment variable is read first; if it is not set, port 3000 is used as a default. Render sets `PORT` automatically.

CORS (Cross-Origin Resource Sharing) is configured here to allow any origin, any method, and any headers. This is necessary because the frontend on Vercel (a different domain) needs to call the backend on Render.

The handler functions at the bottom of `main.rs` are thin. Each one:
- Opens a database connection.
- Calls the appropriate `crud.rs` function.
- Returns an `ApiResponse` JSON object with a success/failure flag.

For protected routes (anything that modifies data), the handler first calls `authentication::session_valid()` with the session expiry timestamp sent in the request body. If the session has expired, it returns a 401 Unauthorized response immediately without touching the database.

#### `src/database.rs`

Handles the database file itself.

- `DB_FILE` is the filename constant (`robinsons_auctioneers.db`). It lives in the same directory as the binary when run on Render.
- `open_connection()` opens and returns a connection to the file.
- `initialize_db()` checks if the file exists and calls `create_new_db()` if not.
- `create_new_db()` opens a connection and runs the `CREATE_DB_SCHEMA` SQL to set up all the tables.

#### `src/queries.rs`

A file containing nothing but SQL strings as Rust constants. There are no functions here. Every SQL query used anywhere in the app is defined here and given a readable name, for example:

```rust
pub const GET_ALL_ACTIVE_AUCTIONS: &str = "SELECT * FROM auctions WHERE is_active = 1";
```

Keeping all SQL in one place makes it easy to find and change queries without searching through the whole codebase.

The most important constant is `CREATE_DB_SCHEMA`, which contains the full SQL to create all five tables. This is the single source of truth for the database structure.

#### `src/structs.rs`

Defines all the data types used across the backend. In Rust, you must declare the shape of your data explicitly.

There are two categories of structs:

**Output structs** (marked with `#[derive(Serialize)]`) - These are sent back to the client as JSON:
- `Auction` - Fields matching the auctions table.
- `Bid` - Fields matching the bids table.
- `Account` - User account data. Note: `password_hash` is intentionally excluded.
- `Admin` - Admin data. Also excludes the password hash.
- `WonAuction` - A won auction record.
- `SessionStatus` - Used to report whether a session is valid.

**Input structs** (marked with `#[derive(Deserialize)]`) - These are parsed from incoming JSON request bodies:
- `CreateAuctionReq` - Data needed to create an auction.
- `UpdateAuctionReq` - Data needed to update an auction. Includes `session_expiry` so the server can validate the session.
- `PlaceBidReq` - Data needed to place a bid.
- `AuthReq` - Username and password for login or registration.
- `CreateUserReq` - Username, email, password for registration.
- `SessionReq` - Just the `session_expiry` string, used by routes that only need session validation.

#### `src/crud.rs`

"CRUD" stands for Create, Read, Update, Delete. This file contains all the functions that actually talk to the database. The functions in `main.rs` call these.

Each function receives a `&Connection` (a reference to an open database connection) and the data it needs, runs a SQL query from `queries.rs`, and returns the result.

Key functions:

- `get_all_active_auctions` - Runs `SELECT * FROM auctions WHERE is_active = 1`.
- `get_all_ended_auctions` - Runs `SELECT * FROM auctions WHERE is_active = 0`.
- `get_auction_by_id` - Looks up a single auction by its ID.
- `create_auction` - Inserts a new row into the auctions table.
- `place_bid` - Inserts a bid row AND updates the `current_price` on the auction in one go.
- `end_auction` - Sets `is_active = 0` on the auction, then finds the highest bidder and inserts a row into `won_auctions`.
- `admin_delete_auction` - Deletes an auction and all its associated bids and won_auction records.
- `create_user` - Inserts a new account row.
- `get_user_by_id` - Looks up a user by their numeric ID.
- `get_user_by_username` - Looks up a user by username, returning the account data plus the stored password hash (used during login).

#### `src/authentication.rs`

Handles everything related to user identity.

- `session_valid(session_expiry: &str) -> bool` - Parses the session expiry as an RFC 3339 timestamp and checks if the current time is before it. Returns `true` if the session is still valid.
- `new_session_expiry() -> String` - Returns a timestamp 1 hour from now, as an RFC 3339 string. This is generated when a user logs in.
- `user_sign_in(conn, auth_req) -> Result<Option<Account>>` - Looks up the user by username, gets the stored bcrypt hash, and calls `bcrypt::verify()` to check if the provided password matches. Returns the account if it does, or `None` if the username does not exist or the password is wrong.
- `admin_sign_in` - Same as `user_sign_in` but for the admin table.
- `create_admin` - Hashes the password with `bcrypt::hash()` and inserts a new admin row.

Passwords are **never stored in plain text**. bcrypt hashes are one-way: you cannot reverse them to get the original password. The only way to check a password is to run `bcrypt::verify(plain_password, stored_hash)`.

#### `src/response.rs`

Defines the standard shape that every API response follows:

```json
{
  "success": true,
  "data": { ... }
}
```

or on failure:

```json
{
  "success": false,
  "error": "Something went wrong"
}
```

Some responses also include a `session_status` boolean field. The frontend checks this field; if it is `false`, it immediately logs the user out and redirects to the login page.

The `ApiResponse<T>` struct is generic - the `data` field can hold any type (a list of auctions, a single bid, a boolean, etc.). The `#[serde(skip_serializing_if = "Option::is_none")]` attribute means fields that have no value are simply omitted from the JSON output rather than appearing as `null`.

### All API Endpoints

| Method | Path | Description | Auth Required |
|---|---|---|---|
| GET | `/health` | Returns `"ok"`. Used by Render to check the service is alive. | No |
| POST | `/api/session/validate` | Checks if a session expiry timestamp is still valid. | No |
| GET | `/api/auctions/active` | Returns all auctions with `is_active = 1`. | No |
| GET | `/api/auctions/ended` | Returns all auctions with `is_active = 0`. | No |
| GET | `/api/auctions/:id` | Returns one auction by its ID. | No |
| GET | `/api/auctions/user/:user_id` | Returns all auctions created by a specific user. | No |
| POST | `/api/auctions` | Creates a new auction. | No (seller_id sent in body) |
| PUT | `/api/auctions/:id` | Updates an auction's title, description, or end time. | Yes (session_expiry) |
| DELETE | `/api/auctions/:id` | Deletes an auction and all its bids. | Yes (session_expiry) |
| POST | `/api/auctions/:id/end` | Ends an auction and records the winner. | Yes (session_expiry) |
| GET | `/api/auctions/:id/bids` | Returns all bids for an auction. | No |
| GET | `/api/auctions/:id/bids/max` | Returns the highest bid amount. | No |
| POST | `/api/bids` | Places a bid on an auction. | Yes (session_expiry) |
| DELETE | `/api/bids/:id` | Deletes a bid. | Yes (session_expiry) |
| GET | `/api/users/id/:id` | Returns a user's public profile by their numeric ID. | No |
| PUT | `/api/users/:id` | Updates a user's email and password. | Yes (session_expiry) |
| DELETE | `/api/users/:id` | Deletes a user account. | Yes (session_expiry) |
| GET | `/api/users/:id/won` | Returns all auctions a user has won. | No |
| POST | `/api/register` | Creates a new user account and returns account data + session. | No |
| POST | `/api/login` | Logs in a user, returns account data + session expiry. | No |
| POST | `/api/admin/login` | Logs in as admin. | No |
| POST | `/api/admin/create` | Creates a new admin account. | Yes (session_expiry) |
| POST | `/api/admin/bootstrap` | Creates the first admin if it does not already exist. | No |
| GET | `/api/auctions/:id/images` | Returns all images for an auction (base64-encoded). | No |
| POST | `/api/auctions/:id/images` | Uploads one or more images for an auction. | Yes (session_expiry) |

The `bootstrap` endpoint is special. It uses `INSERT OR IGNORE`, meaning it only inserts the admin row if one with that username does not already exist. This lets the frontend safely call it on every admin login attempt without creating duplicate records.

### Image Upload (Backend)

The backend stores auction images directly in the database as blobs. The `auction_images` table has this schema:

- `image_id` (primary key)
- `auction_id` (foreign key to auctions)
- `image_data` (BLOB)

When the frontend uploads images, it sends them as base64-encoded strings, and the backend decodes them into binary before storing.

The two endpoints are:

- **GET `/api/auctions/:id/images`**: returns an array of base64 strings (one per image).
- **POST `/api/auctions/:id/images`**: accepts a JSON payload like `{ "image_data": ["<base64>", "<base64>"] }` and stores each image (up to a max of 8 images per auction).

The backend enforces a maximum number of images per auction using the constant `MAX_IMAGES_PER_AUCTION`.

### How the Docker Image Works (Backend)

The `Backend/Dockerfile` uses a two-stage build to keep the final image small:

**Stage 1 - Build**
- Starts from the official `rust:latest` image (which has the full Rust compiler installed).
- Copies `Cargo.toml`, `Cargo.lock`, and all source files.
- Runs `cargo build --release` to compile an optimised binary.

**Stage 2 - Runtime**
- Starts from `debian:bookworm-slim`, a very small Linux image with no Rust compiler.
- Installs only the minimal runtime libraries needed (OpenSSL certificates and the SQLite shared library).
- Copies just the compiled binary from Stage 1.
- Exposes port 3000.
- Sets the binary as the container entry point.

This two-stage approach means the final image contains only the compiled binary and its runtime dependencies, not the entire Rust toolchain. The resulting image is much smaller.

---

## 6. Frontend - Deep Dive

### Technology Stack (Frontend)

| Library | Purpose |
|---|---|
| **React 19** | The UI framework. The entire UI is built as React components. |
| **Vite** | The build tool. Bundles all the source files into static HTML/JS/CSS. Also provides the local development server. |
| **React Router v7** | Client-side routing. Handles navigating between pages without a full page reload. |
| **Mantine v8** | UI component library. Provides ready-made buttons, inputs, modals, tables, notifications, etc. |
| **@tabler/icons-react** | Icon library used throughout the UI. |
| **dayjs** | Date utility used by Mantine's date picker component. |

### Environment Variables

The frontend uses a `.env` file with three variables:

```
VITE_API_URL='https://robinsons-auctioneers-0lh2.onrender.com'
VITE_ADMIN_USERNAME='admin'
VITE_ADMIN_PASSWORD='password@123'
```

`VITE_API_URL` is the base URL of the backend. Every API call in `helpers.js` prepends this to the path.

`VITE_ADMIN_USERNAME` and `VITE_ADMIN_PASSWORD` are used by the frontend to call the bootstrap endpoint when the admin logs in for the first time. This ensures the first admin account is created automatically in the database.

Vite embeds these values directly into the JavaScript bundle at build time. They are not secret at runtime - anyone can read them from the browser's developer tools. This is acceptable for this project because the admin password can always be changed, and the bootstrap endpoint is idempotent (calling it again with the same username does nothing).

When deployed to Vercel, these same variables must be set in the Vercel project's environment variable settings.

#### Backend environment variables (Rust)

The backend also supports a `.env` file (it is loaded automatically on startup via `dotenvy`). The backend expects the following variable:

```
JWT_SECRET=your-super-secret-key
```

This secret is used to sign and verify JWT tokens that are issued during login/registration. If it is not set, the backend will fall back to a default secret (`secret_key`), which is fine for local dev but should not be used in production.

There is an example file at `Backend/.env.example` showing the expected values.

### File by File Explanation (Frontend)

#### `src/main.jsx`

The true entry point. This file mounts the entire React application into the `<div id="root">` element in `index.html`. It wraps the app in:
- `MantineProvider` - Required for Mantine components to work. Also provides the colour scheme (light/dark mode).
- `Notifications` - Required for toast notifications to appear.
- `AuthProvider` - The custom authentication context (see `AuthContext.jsx`).

#### `src/App.jsx`

Defines all the URL routes and what page component to render for each:

| URL | Component |
|---|---|
| `/` | `HomePage` |
| `/login` | `LoginPage` |
| `/auction/:id` | `AuctionDetailPage` |
| `/dashboard` | `DashboardPage` |
| `/admin` | `AdminPage` |
| anything else | Redirects to `/` |

`App.jsx` also runs a background session check every 5 minutes using `setInterval`. If the session has expired, it redirects the user to the login page and shows a notification. It skips the check when the user is already on the login page.

The overall page layout (the persistent top navigation bar with the main content area below it) is set up here using Mantine's `AppShell` component.

#### `src/helpers.js`

This is the single file responsible for all communication with the backend. Every function in this file maps to one API endpoint.

The most important function is the private `request()` helper at the top. All other functions call it. It does the following:

1. Reads the current `session_expiry` from `localStorage`.
2. Automatically injects `session_expiry` into the request body for any non-GET request. This means individual API call functions do not need to worry about sending the session manually.
3. Makes the `fetch()` call with the correct headers.
4. Parses the JSON response.
5. Checks if `body.session_status === false`. If it is, it removes the user from `localStorage` and redirects to `/login`. This catches expired sessions on any API call.
6. Throws an error if the response was not successful.
7. Returns `body.data` (the actual payload).

The exported functions are straightforward wrappers, for example:

```javascript
const getActiveAuctions = async () => {
  return await request("/api/auctions/active");
};

const placeBid = async (data) => {
  return await request("/api/bids", { method: "POST", body: JSON.stringify(data) });
};
```

The `bootstrapAdmin` function is the only one that bypasses the `request()` helper and calls `fetch()` directly, because the bootstrap endpoint does not follow the standard response format.

`handleInvalidSession` checks the locally stored session expiry without making a network call. It is used by the periodic session check in `App.jsx`.

#### `src/utils.js`

Two small helper functions used in multiple components:

- `timeLeft(endTime)` - Takes an end time string and returns a human-readable string like `"2d 4h left"`, `"45m left"`, or `"Ended"`.
- `formatPrice(value)` - Formats a number as a GBP price string, e.g. `"£24.50"`.

#### `src/context/AuthContext.jsx`

Provides global access to the currently logged-in user across the entire app without having to pass it down through every component manually.

It stores the user object in React state AND in `localStorage`. Storing it in `localStorage` means the user stays logged in if they refresh the page.

Provided values:
- `user` - The current user object (null if not logged in). Contains `account_id`, `username`, `email`, `created_at`, `is_admin`, and `session_expiry`.
- `signIn(userData)` - Saves the user to state and `localStorage`.
- `signOut()` - Clears the user from state and `localStorage`.
- `sessionValidStatus(timestamp)` - A simple check: is the given timestamp still in the future?

Any component that needs access to the current user calls the `useAuth()` hook:
```javascript
const { user, signIn, signOut } = useAuth();
```

### Pages

#### `HomePage.jsx`

The first page users see. On load, it fetches both active and ended auctions from the backend simultaneously using `Promise.all`. It then displays them in two tabs (Active and Ended).

A search input filters auctions by title in real time (no extra API call, just filtering the already-loaded list). A sort dropdown reorders results by ending soonest, price low-to-high, or price high-to-low.

Auction tiles are rendered using the `AuctionCard` component.

#### `LoginPage.jsx`

Has three tabs:

- **Sign In** - Calls `login()` with username and password. On success, calls `signIn()` from `AuthContext` to save the user, then navigates to `/`.
- **Register** - Calls `register()` with username, email, and password. Form validation ensures passwords match and are at least 6 characters long. On success, signs the user in immediately.
- **Admin** - Calls `bootstrapAdmin()` first (silently, ignoring errors) to ensure the first admin exists, then calls `adminLogin()`. On success, navigates to `/admin`.

#### `AuctionDetailPage.jsx`

Reads the auction ID from the URL (`:id` parameter) using `useParams()`. Fetches the auction data and all its bids in parallel. Displays:

- The auction title, description, status badge, and time remaining.
- The current bid amount prominently.
- A "Place Bid" button if the user is logged in and does not own the auction and the auction is still active.
- The full bid history sorted from highest to lowest.

If no user is logged in, shows a "Sign in to bid" button instead. If the user is the seller, shows a "Your Auction" badge instead of the bid button.

#### `DashboardPage.jsx`

Only accessible when logged in (redirects to login otherwise). Shows two tabs:

- **My Auctions** - A table listing all auctions the user has created. Each row has a dropdown menu allowing the user to view, edit (if active), or delete (if active) the auction. The "New Auction" button opens `CreateAuctionModal`.
- **Won Auctions** - A table listing all auctions the user has won, with the winning bid amount and date.

#### `AdminPage.jsx`

Only accessible to users with `is_admin: true` in their user object. Shows a 403-style "Access denied" message for anyone else.

Shows a table of all auctions (active and ended together). Each row has a dropdown menu with options to:
- View the auction detail page.
- Edit the auction (opens `EditAuctionModal`).
- End the auction early (calls `endAuction()`).
- Delete the auction entirely (calls `deleteAuction()`).

There are also two buttons in the header:
- "New Auction" - Opens `CreateAuctionModal` to create an auction on behalf of any user.
- "New Admin" - Opens `NewAdminModal` to create another admin account.

### Components

#### `Navbar.jsx`

The persistent top bar rendered on every page. Shows:
- The Robinson's Auctioneers logo/title (clicking it navigates to `/`).
- An "Auctions" button linking to the home page.
- A "Dashboard" button (only visible when logged in).
- An "Admin" button (only visible when `user.is_admin` is true).
- A dark/light mode toggle button.
- Either a "Sign In" button (when logged out) or an avatar with a dropdown menu (when logged in) showing the username, a link to the dashboard, and a sign-out option.

The active page button is highlighted using Mantine's `'light'` variant.

#### `AuctionCard.jsx`

A compact card tile used in the home page grid. Displays the auction's live/ended status badge, time remaining, title, optional description (truncated), current bid, and a "View" button that navigates to the auction's detail page.

#### `BidModal.jsx`

A popup modal with a number input for placing a bid. The minimum bid is enforced as the current price plus £0.01. Validation prevents submitting a bid below this minimum. On success, calls `onBidPlaced()` so the parent can refresh the auction data.

#### `CreateAuctionModal.jsx`

A popup form with fields for title, description (optional), starting price, and end date/time. Uses Mantine's `DateTimePicker` component. On submit, calls `createAuction()` and passes the current user's `account_id` as the `seller_id`. Calls `onCreated()` on success so the parent can refresh its list.

#### `EditAuctionModal.jsx`

A popup form to edit the title, description, and end time of an existing auction. Pre-populates the form fields with the current auction's data via a `useEffect`. On submit, calls `updateAuction()` with the auction's ID and the new values.

#### `NewAdminModal.jsx`

A simple popup form with username and password fields. Calls `createAdmin()` on submit. Used by the admin panel to promote another user to admin status.

### How the Docker Image Works (Frontend)

The `Frontend/Dockerfile` also uses a two-stage build:

**Stage 1 - Build**
- Starts from `node:20-alpine`.
- Installs npm dependencies.
- Accepts `VITE_API_URL` as a build argument and sets it as an environment variable so Vite can embed it into the bundle.
- Runs `npm run build` to produce the static `dist/` folder.

**Stage 2 - Runtime**
- Starts from `nginx:stable-alpine`.
- Copies the `dist/` folder from Stage 1 into nginx's web root.
- Copies `nginx.conf` as the server configuration.
- Exposes port 80.

The `nginx.conf` serves the static files and includes the SPA fallback rule (`try_files $uri $uri/ /index.html`), which is identical in purpose to the `vercel.json` rewrite rule.

The Docker image is used when running locally via docker-compose. On Vercel, the docker image is not used at all - Vercel runs `npm run build` directly and hosts the output.

---

## 7. Session Management

The app uses a hybrid session mechanism: a simple expiry timestamp is stored on the client, and a signed JWT is also issued and stored as a “token”.

### How it works (JWT + expiry timestamp)

When a user logs in or registers successfully, the backend returns an account object that includes both:

- `session_expiry` — an RFC 3339 timestamp that expires in 1 hour.
- `token` — a JSON Web Token (JWT) signed with a secret (`JWT_SECRET`).

The frontend saves the full user object in `localStorage` (see `AuthContext.jsx`).

### What the frontend sends on every API request

The `request()` helper in `helpers.js` does two things automatically:

1. It injects the `session_expiry` timestamp into the JSON request body.
2. It sends the JWT in an `Authorization: Bearer <token>` header.

So the backend can validate either value.

### How the backend validates sessions

The backend uses `authentication::session_valid()` for all protected endpoints. That function:

- First tries to parse the value as an RFC 3339 timestamp and checks that it is still in the future.
- If that fails, it treats the value as a JWT and verifies it using the configured `JWT_SECRET`.

This means the current system supports both the original timestamp-based session logic and the newer JWT-based tokens.

If validation fails, the API returns `session_status: false`.

When the frontend sees `session_status: false`, it clears the stored user and redirects to the login page.

### Frontend debug logging

The frontend includes debug logging for request/response payloads, but it only runs when `import.meta.env.DEV` is true (i.e., during development with `npm run dev`). In production builds (e.g., `npm run build`), `import.meta.env.DEV` becomes false and the logs are suppressed.

---

---

## 8. Admin System and Bootstrap

There are two separate user systems that do not share a table:

- `accounts` table - Regular users who register through the app.
- `admin` table - Admin accounts.

When an admin logs in, the backend queries the `admin` table, not the `accounts` table. The account object returned to the frontend has `is_admin: true` set by the backend. The frontend checks this flag to decide whether to show the Admin nav button and allow access to `AdminPage`.

**The Bootstrap Problem**

When the app is first deployed to a new environment (fresh database), there are no admin accounts. To solve this without requiring manual database access, there is a `/api/admin/bootstrap` endpoint. It uses `INSERT OR IGNORE` SQL, meaning:
- If the username already exists in the admin table, nothing happens.
- If it does not exist, it inserts the row.

The frontend calls this endpoint every time someone attempts to log in via the Admin tab on the login page. The credentials used are the `VITE_ADMIN_USERNAME` and `VITE_ADMIN_PASSWORD` environment variables. However, it only calls bootstrap when the entered credentials match the env vars - effectively, the first time the designated admin logs in, their account is created automatically.

Once the first admin is in the system, new admins can be created through the Admin panel's "New Admin" button, which calls `/api/admin/create`.

---

## 9. Running Locally with Docker Compose

The `docker-compose.yml` at the root allows running both services together for local development.

```bash
docker-compose up --build
```

This:
1. Builds the backend image from `Backend/Dockerfile`.
2. Builds the frontend image from `Frontend/Dockerfile`, passing `VITE_API_URL=http://backend:3000` as a build argument. This tells the frontend to talk to the backend service by its Docker Compose service name (`backend`) on port 3000.
3. Starts both containers. The backend is on port 3000 and the frontend is on port 3001.
4. Creates a named volume `backend-data` mounted at `/app` in the backend container. This persists the SQLite database file across container restarts.

Access the frontend at `http://localhost:3001` and the backend directly at `http://localhost:3000`.

---

## 10. Request Flow - A Worked Example

Here is what happens, step by step, when a logged-in user places a bid of £50 on auction ID 7.

1. The user is on `/auction/7` (the `AuctionDetailPage`). They click "Place Bid". The `BidModal` opens.

2. The user types `50` into the bid amount field and clicks "Place Bid" in the modal.

3. The modal calls `placeBid({ auction_id: 7, bidder_id: 3, bid_amount: 50 })` from `helpers.js`.

4. The `request()` function in `helpers.js` reads `session_expiry` from the user object in `localStorage`. It injects it into the request body. The final body sent to the server looks like:
   ```json
   { "auction_id": 7, "bidder_id": 3, "bid_amount": 50, "session_expiry": "2026-03-13T15:00:00+00:00" }
   ```

5. `fetch()` sends a POST request to `https://robinsons-auctioneers-0lh2.onrender.com/api/bids`.

6. The request arrives at the Rust backend. Axum routes it to the `place_bid` handler function in `main.rs`.

7. The handler calls `authentication::session_valid("2026-03-13T15:00:00+00:00")`. The current time is before the expiry, so this returns `true`.

8. The handler calls `database::open_connection()` to get a database connection.

9. The handler calls `crud::place_bid(&conn, 7, 3, 50.0)`.

10. Inside `crud::place_bid`, two SQL statements are executed:
    - `INSERT INTO bids (auction_id, bidder_id, bid_amount) VALUES (7, 3, 50)` - Records the bid.
    - `UPDATE auctions SET current_price = 50 WHERE auction_id = 7` - Updates the current price on the auction.

11. The function returns the `bid_id` of the new bid (e.g. `15`).

12. The handler wraps this in an `ApiResponse` and returns it as JSON:
    ```json
    { "success": true, "data": 15 }
    ```

13. Back in the browser, `request()` receives this response. It sees `success: true` and returns `15` (the bid ID).

14. `BidModal.handleSubmit` receives the result, shows a success notification ("You bid £50.00"), calls `onBidPlaced()` to trigger a data refresh on the parent page, and closes the modal.

15. `AuctionDetailPage` re-fetches the auction and bids, and the UI updates to show the new current bid of £50 and the new entry in the bid history table.
