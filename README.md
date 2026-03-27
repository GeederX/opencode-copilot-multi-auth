# opencode-copilot-multi-auth

An OpenCode plugin that adds GitHub Copilot multi-account routing with automatic failover.

## What This Plugin Does

- Manages a local Copilot account pool and automatically rotates accounts per request.
- Switches to another account when quota/rate-limit errors occur.
- Skips accounts that do not support the requested model.
- Applies manual routing strategy controls: `priority`, `enabled`, and `modelRule`.
- Supports both GitHub.com and GitHub Enterprise login flows.

This is not only manual priority ordering. It is automatic account-pool rotation with configurable routing rules.

## Features

- **Account-pool rotation**: retry on another account when one fails.
- **Quota/rate-limit failover**: detects 429 and common quota-like 403 errors.
- **Model-aware routing**: respects allow/block rules and temporary per-account model unavailability.
- **Priority + balancing**: lower `priority` wins; ties use lower usage count.
- **Enable/disable accounts**: toggle `enabled` in JSON without restarting OpenCode.
- **Token handling**: stores refresh token metadata and caches runtime access tokens.
- **Custom account ID on login**: optionally set a human-readable account ID.

## Install

### Option A: npm

```bash
npm install -g @geeder/opencode-copilot-multi-auth@0.3.0
```

Add to `opencode.json`:

```json
{
  "plugin": ["@geeder/opencode-copilot-multi-auth@0.3.0"]
}
```

### Option B: local plugin folder

```json
{
  "plugin": ["file:///C:/Users/<you>/.config/opencode/plugins/opencode-copilot-multi-auth-local"]
}
```

## Authentication Flow

Run:

```bash
opencode auth login
```

Choose provider `GitHub Copilot`, then choose one method:

- `Login / Add GitHub.com Account`
  - Prompts `Account ID (optional)`
  - Uses `github.com` automatically (no enterprise URL prompt)
- `Login / Add GitHub Enterprise Account`
  - Prompts `Account ID (optional)`
  - Prompts `Enterprise URL or domain` (required)

Run login multiple times to add more accounts.

## Account Storage

Accounts are stored in:

- `$OPENCODE_CONFIG_DIR/opencode-copilot-multi-auth-accounts.json` when `OPENCODE_CONFIG_DIR` is set
- otherwise `$XDG_CONFIG_HOME/opencode/opencode-copilot-multi-auth-accounts.json` when `XDG_CONFIG_HOME` is set
- otherwise `~/.config/opencode/opencode-copilot-multi-auth-accounts.json`

Example:

```json
{
  "version": 1,
  "accounts": [
    {
      "id": "work-main",
      "name": "copilot-work",
      "refreshToken": "gho_xxxxxxxxxxxx...",
      "accessToken": "gho_xxxxxxxxxxxx...",
      "accessTokenExpiresAt": 1700000000000,
      "priority": 100,
      "enabled": true,
      "modelRule": {
        "allowlist": [],
        "blocklist": []
      },
      "addedAt": 1694000000000
    }
  ]
}
```

### Important Rules

- `priority`: lower number means higher priority.
- `enabled`: `false` excludes account from selection.
- `modelRule.allowlist`: only these models are allowed for the account.
- `modelRule.blocklist`: these models are excluded for the account.

## Model Rules (modelRule)

The `modelRule` field controls which models can use each account. It has two settings:

### allowlist (allowedModels)

If `allowlist` is **not empty**, only those models can use this account:

```json
"modelRule": {
  "allowlist": ["gpt-4o", "gpt-4-turbo"],
  "blocklist": []
}
```

This account will **only** handle requests for `gpt-4o` or `gpt-4-turbo`. Other models will skip this account.

### blocklist (deniedModels)

If `blocklist` is **not empty**, those models **cannot** use this account:

```json
"modelRule": {
  "allowlist": [],
  "blocklist": ["o1", "o1-preview"]
}
```

This account will handle all models **except** `o1` and `o1-preview`.

### No restrictions

Leave both empty to allow all models:

```json
"modelRule": {
  "allowlist": [],
  "blocklist": []
}
```

### How it works

1. If `allowlist` is not empty: only allowlist models are permitted
2. If `blocklist` is not empty: blocklist models are denied
3. If both are empty: all models are allowed
4. If both have values: allowlist is checked first, then blocklist is applied

When a model request comes in, the plugin skips any account whose model rules don't permit it and rotates to the next eligible account.

### Real-world example

```json
{
  "version": 1,
  "accounts": [
    {
      "id": "work-gpt4",
      "name": "copilot-work-tier1",
      "refreshToken": "gho_xxxx...",
      "priority": 10,
      "enabled": true,
      "modelRule": {
        "allowlist": ["gpt-4o", "gpt-4-turbo"],
        "blocklist": []
      }
    },
    {
      "id": "personal-all",
      "name": "copilot-personal",
      "refreshToken": "gho_yyyy...",
      "priority": 20,
      "enabled": true,
      "modelRule": {
        "allowlist": [],
        "blocklist": []
      }
    },
    {
      "id": "test-no-o1",
      "name": "copilot-test",
      "refreshToken": "gho_zzzz...",
      "priority": 30,
      "enabled": true,
      "modelRule": {
        "allowlist": [],
        "blocklist": ["o1", "o1-preview"]
      }
    }
  ]
}
```

In this setup:
- `gpt-4o` request → tries `work-gpt4` (allowed) → falls back to `personal-all` or `test-no-o1`
- `o1` request → skips `work-gpt4` and `test-no-o1` → only uses `personal-all`
- `gpt-3.5-turbo` request → skips `work-gpt4` → uses `personal-all` or `test-no-o1`

## Account ID and Deduplication

- If `Account ID` is provided during login, it is used as `id`.
- If omitted, the plugin auto-generates an ID from a token hash.
- Re-login updates existing accounts instead of duplicating them when matched by:
  - provided `id`, or
  - token-derived ID, or
  - same `refreshToken`.

## Logging

Logs are sent to stderr and prefixed with `[copilot-multi-auth]`.

Default log level is `warn` (to avoid noisy output).

Set log level with env var:

```bash
COPILOT_MULTI_AUTH_LOG_LEVEL=info
```

Supported levels: `info`, `warn`, `error`.

## Notes

- Provider ID is `github-copilot`, so this plugin overrides built-in Copilot auth behavior when installed.
- Cooldown after quota hit uses `Retry-After` when present, otherwise defaults to 90 seconds.
- Maximum retry attempts are bounded by account count and internal cap.

