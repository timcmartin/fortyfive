# FortyFive — Band Song Catalog

A web app for browsing and managing a band's song repertoire. Search by title or artist, filter by status, and view per-song details including performance notes, musical key, and learning resources.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React 19](https://react.dev/) |
| Build tool | [Vite 8](https://vitejs.dev/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) + [DaisyUI v5](https://daisyui.com/) |
| Theme | DaisyUI `lemonade` (configurable in `src/index.css`) |
| Icons | [Lucide React](https://lucide.dev/) |
| Font | [Geist Variable](https://vercel.com/font) |
| Song catalog and setlists | [Supabase](https://supabase.com/) (with static JSON fallback) |
| Editable lyric sheets | Supabase (with static JSON fallback) |
| Media storage | Amazon S3 buckets for song audio and chart PDFs |
| Hosting | [Netlify](https://netlify.com/) |

---

## Local Development

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## Deployment

This app is a static site — no server required. It is hosted on Netlify, while song audio files and chart PDFs are stored in Amazon S3 buckets and referenced by URL in `public/songs.json`.

**Deploy via Netlify UI:**
1. Push the repo to GitHub
2. In Netlify: **Add new site → Import an existing project**
3. Connect your GitHub repo
4. Build settings are auto-detected:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click **Deploy site**

**Deploy via Netlify CLI:**
```bash
npm install -g netlify-cli
netlify deploy --build --prod
```

---

## Changing the Theme

Open `src/index.css` and change `lemonade` to any [DaisyUI theme](https://daisyui.com/docs/themes/):

```css
@plugin "daisyui" {
  themes: lemonade --default;
}
```

Popular options: `cupcake`, `nord`, `dracula`, `sunset`, `emerald`, `retro`

---

## Song Data

Songs live in `public/songs.json`. Each song is a JSON object:

```json
{
  "id": "unique-kebab-case-id",
  "title": "Song Title",
  "artistInfo": {
    "performanceVersion": "Artist we perform it like",
    "originalArtist": "Original recording artist"
  },
  "musicalDetails": {
    "key": "E major"
  },
  "performanceNotes": {
    "arrangement": "Any arrangement notes",
    "leadSinger": "Name of lead vocalist",
    "specialNotes": "e.g. gang vocals on the chorus",
    "generalNotes": "General context or history"
  },
  "resources": {
    "youtubeUrl": "https://youtu.be/...",
    "mp3Url": null,
    "lyricsUrl": "https://genius.com/...",
    "chartPdfUrl": null
  },
  "status": "active",
  "dateAdded": "2025-01-15",
  "lastUpdated": "2025-06-15"
}
```

`chartPdfUrl` may be either a single URL string or an array of chart URLs for medleys/mashups that need more than one PDF.

### Status Values

| Status | Meaning |
|---|---|
| `active` | In regular rotation |
| `learning` | Being worked on |
| `retired` | No longer playing |
| `on-hold` | Temporarily shelved |

To add a new status, edit `src/lib/statuses.js` — it controls the filter buttons, table badges, and modal display everywhere.

### Database-backed catalog and setlists

The app loads the song catalog from `public/songs.json` and overlays rows from Supabase's `songs` table by song ID. Setlists work the same way: the checked-in files in `public/sets/` provide defaults, and rows in Supabase's `setlists` table override those defaults or add new setlists. If Supabase is unavailable or a read fails, the app reports a warning and uses the JSON data. Database deletions are recorded as tombstones so deleted JSON-backed entries do not reappear while Supabase is available.

Sign in as an editor from the catalog page to add, edit, and delete songs, or create, rename, categorize, reorder, and delete setlists. Performance setlists appear in Performance Mode; catalog groupings are available as catalog filters only. Song records use the same object shape as `public/songs.json`. Setlist song order is stored as an array of song IDs.

Run `supabase/schema.sql` to create the `songs` and `setlists` tables and editor policies alongside the lyric-sheet schema. Existing JSON data does not need to be imported: it remains the default layer, and edits are saved as database overrides.

### Performance Lyric Sheets

Select **Open Performance Mode** to navigate performance setlists with Previous/Next buttons, the left/right arrow keys, or the set-list drawer. Switch between the Lyrics and Charts views without leaving the current song; charts use the song's existing `chartPdfUrl` resource and render as scrollable pages, with an option to open the PDF in a new tab. Multiple chart URLs can be selected within the Charts view. A metronome remains available above either view, defaults to a song's BPM when that value is a single tempo, and accents beat one in 4/4. Adjust the tempo with the BPM input, +/- controls, or Tap; changing tempo stops playback until restarted, and changing songs also stops playback. Ambiguous catalog tempos (such as ranges or slash-separated values) are shown as notes and require a playable tempo to be entered or tapped in. The metronome's tempo adjustment is temporary and does not change the catalog. Since the app fetches chart PDFs for rendering, configure the S3 bucket's CORS policy to allow GET requests from the deployed app origin.

Lyric sheets are stored in Supabase's `lyric_sheets` table as a `sections` JSON array. Performance Mode checks Supabase first and falls back to `public/lyric-sheets/{song-id}.json` while existing files are being migrated. Editors can sign in from Performance Mode and edit a sheet as JSON; saving creates or updates its database row. Each sheet contains a `sections` array, rendered in order. `lyrics` can be a multiline string or an array of lines; instrumental/solo cues can include a bar count and notes. The singer is optional. Suggested part and singer values are shown below; custom part and singer labels are also supported.

For a nontechnical walkthrough focused on assigning singers to parts, see the [Lyric Sheet Editing Guide](LYRIC-SHEET-EDITING-GUIDE.md).

#### Supabase setup and editor access

1. In the Supabase SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql) to create the tables and row-level security policies. Catalog data and sheets are publicly readable; only authenticated users whose trusted `app_metadata.role` is `editor` can make changes.
2. Set `VITE_SUPABASE_URL` to the project URL (for example, `https://your-project.supabase.co`) and `VITE_SUPABASE_ANON_KEY` to the project's publishable/anon key in `.env.local` for local development and as build environment variables in Netlify. Start from `.env.example`. These are browser-side settings; never put a service-role key in the client app.
3. Create the editor's account in Supabase **Authentication → Users**, setting its password there. Then run the following in the SQL Editor, replacing the email with the account's email:

   ```sql
   update auth.users
   set raw_app_meta_data =
     coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"editor"}'::jsonb
   where email = 'you@example.com';
   ```

   This only updates an existing Auth user. After granting the role, sign out and sign back in so the app receives a refreshed session token. Do not use user-editable `user_metadata` for authorization.

For example, `public/lyric-sheets/index.json` contains an array of IDs such as `["867-5309-jenny", "mashup"]`, and `public/lyric-sheets/mashup.json` contains that song's sections:

```json
{
  "sections": [
    { "part": "verse", "singer": "richard", "lyrics": "Add the band's lyric text here." },
    { "part": "chorus", "singer": "gang", "lyrics": ["First line", "Second line"] },
    { "part": "instrumental", "bars": 8, "notes": "Guitar solo" },
    { "part": "bassSolo", "bars": 4 }
  ]
}
```

Suggested parts: `verse`, `preChorus`, `chorus`, `bridge`, `instrumental`, `bassSolo`, `guitarSolo`, `intro`, `outro`, `tag`, `vamp`, `breakdown`, `interlude`, `ending`. Suggested singers: `olivia`, `heather`, `steve`, `richard`, `gang`. Existing JSON files remain as a fallback during migration; new or edited sheets are saved to Supabase. Lyrics and cues are styled differently in performance mode; cues remain labeled, not color-only.

### Finding Lyrics URLs

Use [Genius](https://genius.com/) for lyrics links. Search for the song and copy the URL directly:

```
https://genius.com/Artist-name-song-title-lyrics
```

Use the version the band performs (e.g. a cover version) rather than the original if the performance differs meaningfully.
