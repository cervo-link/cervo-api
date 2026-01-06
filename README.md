# cervo-api

## Authentication

This API uses API key authentication. See [API Authentication Documentation](./docs/api-authentication.md) for details on how to authenticate your requests.

**Quick Start:**
1. Copy `.env.example` to `.env`
2. Generate a secure API key: `openssl rand -hex 32`
3. Add the API key to your `.env` file: `API_KEY=your-generated-key`
4. Include the API key in your requests using one of these methods:
   - Authorization header: `Authorization: Bearer your-api-key`
   - X-API-Key header: `X-API-Key: your-api-key`
   - Query parameter: `?api_key=your-api-key`

## Setup

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.18. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
