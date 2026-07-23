# Lore & Ledger — D&D Companion App
## Auth environment variables (server/.env)

| Var | Required | Purpose |
| --- | --- | --- |
| `JWT_SECRET` | yes | Signs auth tokens |
| `MONGO_URI` | yes | Database connection |
| `GOOGLE_CLIENT_ID` | for Google sign-in | Same value is used client-side as `VITE_GOOGLE_CLIENT_ID` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | for 2FA emails | If unset, verification codes are logged to the server console instead (dev fallback) |

## Client environment variables (client/.env)

| Var | Purpose |
| --- | --- |
| `VITE_GOOGLE_CLIENT_ID` | Enables the "Continue with Google" button on the sign-in page |
| `VITE_API_URL` | Override API base URL if not proxied |

### Notes on 2FA
Two-factor authentication currently delivers a 6-digit code via email (no SMS
provider is configured). A phone number field is captured on registration/
settings for future SMS-based 2FA (e.g. via Twilio) — wiring that up just
requires adding a Twilio client call inside `sendOtp` in
`server/routes/auth.js` alongside/instead of the email path.

### Notes on image generation
Storyboard scene art uses [Pollinations.ai](https://pollinations.ai) (free,
no API key, scales fine for small/medium traffic). Generating a scene now
produces 4 candidate images (different seeds) so you can pick your favourite
before it's saved. The prompt is tuned for a painterly fantasy
landscape-portrait art style. Alternatives considered:
- Hugging Face Inference API — free tier has rate limits + cold-start
  latency, and requires an API token.
- Aggregator repos like `free-image-generation-api` — ultimately proxy to
  similar free providers (including Pollinations), so no extra benefit was
  found for this app's scale.