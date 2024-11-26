# Namejs

A monorepo project containing a shared library of types, a client application, and a server application.

## Directory Structure

```
namejs/
├── shared/       # Shared library containing common types
├── client/       # Frontend application
├── server/       # Backend application
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

