<p align="center">
  <img src="https://res.cloudinary.com/crcbzpw6/image/upload/v1786529766/lore-ledger/storyboard/sdniavu2yeigjupqxgou.png" width="260" alt="5e Utility logo">
</p>

<h3 align="center">
  a D&D Companion App
</h3>

<p align="center">
5e Utility is an all-in-one companion for tabletop fantasy campaigns. It brings player tools and Dungeon Master prep into one shared, campaign-based website, helping groups keep character details, session notes, worldbuilding, and play aids together.
The app has tailored experiences for players and DMs, with shared campaign data keeping everyone on the same page. Use it to prepare between sessions, then keep useful references and interactive tools close at the table.
</p>

<img width="1504" height="774" alt="image" src="https://github.com/user-attachments/assets/41ab2ef8-3d75-4258-b8b8-7adb0dcf3b2a" />


<h2 align="center">
Features
</h2>

### Player pages

- **Journal** — Record session recaps and character-facing notes in a campaign journal.
- **Character** — Manage character sheets, stats, hit points, backstory, notes, and D&D Beyond links.
- **Inventory** — Track equipment, quantities, equipped items, item notes, and currency.
- **Roleplay Assistant** — Build a character profile and generate a personalized session plan with roleplay prompts and a checklist.

### Dungeon Master pages

- **Sessions** — Create and organize session plans, including encounters, NPCs, pacing, hooks, and table notes.
- **DM Board** — Privately map campaign ideas with notes, images, links, and ink. Boards autosave per campaign and are accessible only to its DM owner; edits in another tab or device can cause a save conflict. The save limit is 8 MB per board, including images.
- **Campaign Guide** — Keep campaign details, NPCs, and quests organized, with character-specific information to support tailored sessions.
- **Lore** — Store campaign reference entries for important people, places, and other details.
- **Storyboard** — Present campaign scenes as an illustrated, book-style sequence.
- **Battle Map** — Draw and edit maps with ground and object layers, then play together with synchronized tokens. Includes mobile-friendly controls, doors, linked stairs, lighting, darkvision, and fog of war.
- **Combat** — Track combatants and hit points, and apply damage or healing during encounters.
- **Ideas** — Generate quick prompts and inspiration for the campaign.

### Shared table tools

- **Dice** — Roll an animated d20.
- **Rules** — Search a quick-reference guide to common 5e rules and conditions.
- **Music** — Organize and play campaign music sessions and cues.
- **Themes** — Personalize the app’s appearance; the DM Board follows the chosen theme, including dark and light.
- **Player / DM mode** — Switch the same account between player and DM in Settings. Each mode shows its own tools and campaigns (joined as a player, or run as a DM); nothing is deleted when switching.
- **Premium** — View the available premium upgrade and plan information.

## Built for the whole campaign

5e Utility is designed to support a campaign from prep through play: DMs can organize sessions and campaign material, while players can maintain their characters and journal. Shared maps and campaign tools help bring those pieces together at the table.

## Account verification and two-factor

New accounts verify at sign-up in one of two ways, and either one becomes the account's two-factor method automatically:

- **Gmail** ("Sign up with Google"): verified instantly.
- **Email code**: we email a 6-digit code to confirm the address, and the account is only created once it's entered.

From then on, signing in on a **new device** asks for a Google confirmation or an emailed code, and a device that passed it is remembered for 30 days. There's no toggle to turn it off. Existing accounts keep working unchanged: they can verify with Google from Settings → Security, or keep the older opt-in "email code on new devices" switch.

If neither option is configured, sign-up falls back to plain email + password.

| Where | Variable | Purpose |
| --- | --- | --- |
| Render (API) | `CLIENT_URL` | Site address(es) allowed to call the API, comma-separated, e.g. `https://www.5eutility.com,https://5eutility.com`. The first one is used for links in emails and Stripe redirects. Use `https://` and no trailing slash. If the site says it can't reach the server, this is the first thing to check. |
| Render (API) | `GOOGLE_CLIENT_ID` | Google Cloud OAuth **Web** client ID. The client fetches it from `/api/auth/config`, so no frontend variable is needed. |
| Render (API) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Outgoing email (password resets and email codes). The **Email code** option only appears in production once `SMTP_HOST` is set. A free tier at [Brevo](https://www.brevo.com) or [Resend](https://resend.com) works; verify your domain with them first. Use `SMTP_FROM` like `5e Utility <no-reply@5eutility.com>`. |
| Netlify (optional) | `VITE_GOOGLE_CLIENT_ID` | Only used if the API can't be reached for config; same value as `GOOGLE_CLIENT_ID`. |

In the Google Cloud console, add your site (e.g. `https://5e-utility.netlify.app`) and `http://localhost:5173` as **Authorized JavaScript origins** for the Web client, and publish the app on the Audience page so anyone can sign in. No client secret is needed (ID-token flow). Outside production, email codes are printed in the server log instead of sent.
