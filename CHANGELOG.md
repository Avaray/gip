# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0] - 2026-07-30

This major release focuses on true zero-dependency architecture, improved reliability of IPv4/IPv6 resolution, and overall stability improvements across all JavaScript runtimes (Node.js, Bun, Deno).

### Added
- **Native TypeScript / JSDoc Docs**: Added detailed JSDoc comments to `module.d.ts`, bringing rich IntelliSense and hover-documentation for TypeScript users directly in their IDE.
- **Service Diagnostics Script**: Introduced a standalone `test-services.mjs` utility script to check the health of all built-in IPv4 and IPv6 services. You can run it via `npm run test:services`.
- **NPM Package Optimization**: Added `files` and `exports` fields to `package.json` to strictly expose the ES modules and type definitions, while completely excluding development tools and tests from the published package.

### Changed
- **Replaced `fetch` with `node:http/https`**: Completely removed reliance on the global `fetch` API. The engine now uses Node's native HTTP modules. This ensures absolute zero dependencies and fixes severe bugs where `fetch` would ignore forced DNS families in some runtimes.
- **Strict DNS Family Enforcement**: The `ipv4` and `ipv6` options now strictly enforce `family: 4` or `family: 6` at the socket level. You are mathematically guaranteed to get the correct IP protocol, even if the target service is dual-stack.
- **Case-Insensitive CLI & API**: The `type` argument is now fully case-insensitive (e.g., `IPv6`, `IPV4`, `AuToMaTiC` are gracefully supported).
- **Reduced Flakiness**: The default `ensure` validation count in the integration tests was adjusted to better tolerate external service rate limits (HTTP 429).
- **Curated Service Lists**: Audited and relocated dual-stack domains into their appropriate lists to prevent "wrong format" noise and speed up overall resolution times.

### Fixed
- **Silent Hangs in Bun**: Implemented manual `abort` signal listeners and socket destruction to fix critical bugs where Bun would hang indefinitely on timed-out requests.
- **Stack Trace Pollution**: Handled unhandled promise rejections and connection errors. The library now elegantly traps errors (like HTTP 503 or 429) without crashing the console with massive, noisy stack traces.
