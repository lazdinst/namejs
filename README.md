# Namejs

A monorepo project containing a shared library of types, a client application, and a server application.

## Directory Structure

```
namejs/
├── shared/       # Shared library containing common types
├── client/       # Frontend application
├── server/       # Backend application
```

## Environment Variables

### Client (`client/.env`)

Vite only exposes variables prefixed with `VITE_`, and it reads `client/.env` — not
the repository root. Copy the template to get started:

```bash
cp client/.env.example client/.env
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_CARTO_API_KEY` | _(unset)_ | CARTO basemap key — get one at <https://carto.com/basemaps/apikey>. When unset, the map falls back to Esri's keyless dark canvas and logs a warning. The fallback exists because CARTO answers `200` with a watermarked "API KEY REQUIRED" tile, so a missing key otherwise looks like a working map. |
| `VITE_SERVER_HOST` | `localhost` | Backend host, used for both the REST calls and the WebSocket. |
| `VITE_SERVER_PORT` | `4000` | Backend port. Should match the server's `PORT`. |

`client/.env` is gitignored; `client/.env.example` is committed. Vite inlines these
values into the bundle at build time, so everything here is visible to anyone who
loads the app — never put a private secret in this file. A CARTO basemap key is
designed to be used from the browser, but restrict it to your domains in the CARTO
dashboard.

### Server

The server reads its configuration straight from the process environment. It does
**not** load a `.env` file — there is no `dotenv` dependency — so set these in your
shell or process manager:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | HTTP and WebSocket port. |
| `NODE_ENV` | `development` | Runtime environment. |

```bash
PORT=4100 npm run dev:server
```

## Setup Instructions

### 1. Install Dependencies

Ensure all dependencies are installed in each project (`shared`, `client`, `server`).

From the root of the repository, run:

```bash
cd shared
npm install

cd ../client
npm install

cd ../server
npm install
```

### 3. Link the Shared Library

Use `npm link` to create a symlink between the shared library and the client/server projects.

#### A. Link the Shared Library

Run the following in the `shared` directory:

```bash
cd shared
npm link
```

#### B. Link Shared to Client

Run the following in the `client` directory:

```bash
cd ../client
npm link shared
```

#### C. Link Shared to Server

Run the following in the `server` directory:

```bash
cd ../server
npm link shared
```

### 4. Verify the Setup

To test if the shared library is properly linked, you can:

#### In the Client:

1. Create a test file in `client/src` that imports a type from `shared`:
```ts
import { TestSharedType } from "shared";

console.log(test);
```

2. Run the file with `ts-node`:
```bash
npx ts-node src/test.ts
```

### Add the Shared Library as a Dependency

To avoid manually linking the `shared` library using `npm link`, you can add it as a dependency in the `client` and `server` projects with a `file:` reference. This ensures that the `shared` library is always correctly included.

#### A. Add the `shared` Dependency

Run the following command in the `client` directory to add `shared` as a dependency:

```bash
cd client
npm install ../shared
```

This will update the `client/package.json` to include the `shared` library:

```json
"dependencies": {
  "shared": "file:../shared"
}
```

Repeat the same steps in the `server` directory:

```bash
cd ../server
npm install ../shared
```

The `server/package.json` will also include:

```json
"dependencies": {
  "shared": "file:../shared"
}
```

#### B. Reinstalling Dependencies

Whenever you run `npm install`, the `shared` library will automatically be included and linked as a local dependency.

#### C. Verifying the Setup

1. Check that `shared` is present in the `node_modules` of both `client` and `server`:
```bash
ls client/node_modules/shared
ls server/node_modules/shared
```

2. Test importing a type from `shared` in the client or server:
```ts
import { TestSharedType } from "shared";

console.log(test);
```

3. Run the TypeScript compiler in the client or server to confirm everything resolves correctly:
```bash
npx tsc
```

