# Changelog

All notable changes to Astrid GraphQL Client will be documented in this file.

## Unreleased

### Added

- New `AstridGraphQLClient` class.
- Runtime-agnostic GraphQL request API.
- Typed query and mutation helpers.
- Structured error classes.
- Timeout and external abort support.
- Retry support with linear and exponential strategies.
- Dynamic headers and instance header mutation.
- Request, response, and error hooks.
- Polling-based watch queries.
- Persisted-query metadata support.
- ESM and CommonJS builds with TypeScript declarations.
- Vitest unit test suite.
- Legacy compatibility wrappers.

### Changed

- Refactored the original 2021 implementation into a modern TypeScript package.
- Modern methods return GraphQL data by default.
- Replaced Node.js-specific environment and header assumptions with Fetch APIs.
- Updated the package metadata, build, and publication workflows for Node.js 18+.

### Deprecated

- Global client configuration through legacy `createClient({ base_url })`.
