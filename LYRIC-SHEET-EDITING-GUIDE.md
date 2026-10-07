# Lyric Sheet Editing Guide

This guide is for assigning singers to parts in Performance Mode. You do not
need to edit files on your computer or know how Supabase works.

## Sign in and open a sheet

1. Open FortyFive and select **Open Performance Mode**.
2. Select a set list and navigate to the song you want to update.
3. Select **Editor sign in** and sign in with your editor account.
4. On the **Lyrics** view, select **Edit sheet**.

If you do not have an editor account or cannot sign in, ask the app
administrator for help.

## Assign a singer to a part

The editor shows the song sheet as JSON. Each item inside `"sections"` is one
part of the song. Add a `"singer"` line to the part you want to assign, or
change its existing singer. Use the exact lowercase value from this list:

| Singer shown in the app | Value to enter |
|---|---|
| Olivia | `"olivia"` |
| Heather | `"heather"` |
| Steve | `"steve"` |
| Richard | `"richard"` |
| Gang (everyone) | `"gang"` |

For example, to assign the verse to Olivia:

```json
{
  "part": "verse",
  "singer": "olivia",
  "bars": 16,
  "lyrics": ["First line", "Second line"]
}
```

The singer can go anywhere within that part's `{ ... }` braces. Keep the comma
after each line except the last line in the braces. If the part already has a
`"singer"` line, change its value instead of adding a second one.

Singer assignments are optional. To remove an assignment, delete the whole
`"singer": "..."` line and remove the comma at the end of the line above it if
that line becomes the last one in the braces.

## Save and check your change

1. Select **Save sheet**.
2. If the app reports invalid JSON, review commas and quotation marks, then
   save again.
3. After saving, the sheet returns to the performance display. Check that the
   singer badge appears beside the intended part.

The sheet is saved immediately. Please only change the `"singer"` value unless
you intend to update the lyrics, part order, or other song cues. **Cancel**
discards unsaved edits.
