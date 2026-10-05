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
| Data | Static JSON (`public/songs.json`) |
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

## Deployment (Netlify)

This app is a static site — no server required.

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

### Performance Lyric Sheets

Select **Open Performance Mode** to navigate the existing ordered set lists with Previous/Next buttons or the left/right arrow keys. Set lists are JSON files in `public/sets/`; add a new file there and register it in `src/lib/sets.js` to make it available in performance mode.

Performance sheets are editable JSON in `public/lyric-sheets.json`, keyed by song ID. Sections render in the order listed. `lyrics` can be a multiline string or an array of lines; instrumental/solo cues can include a bar count and notes. The singer is optional. Suggested part and singer values are shown below; custom part and singer labels are also supported.

```json
{
  "867-5309-jenny": {
    "sections": [
      { "part": "verse", "singer": "richard", "lyrics": "Add the band's lyric text here." },
      { "part": "chorus", "singer": "gang", "lyrics": ["First line", "Second line"] },
      { "part": "instrumental", "bars": 8, "notes": "Guitar solo" },
      { "part": "bassSolo", "bars": 4 }
    ]
  }
}
```

Suggested parts: `verse`, `preChorus`, `chorus`, `bridge`, `instrumental`, `bassSolo`, `guitarSolo`, `intro`, `outro`, `tag`, `vamp`, `breakdown`, `interlude`, `ending`. Suggested singers: `olivia`, `heather`, `steve`, `richard`, `gang`. Commit and deploy JSON changes to publish them. Lyrics and cues are styled differently in performance mode; cues remain labeled, not color-only.

### Finding Lyrics URLs

Use [Genius](https://genius.com/) for lyrics links. Search for the song and copy the URL directly:

```
https://genius.com/Artist-name-song-title-lyrics
```

Use the version the band performs (e.g. a cover version) rather than the original if the performance differs meaningfully.
