# Gemini/Genkit removed

This project no longer uses Google Gemini / Genkit for AI summarization.

The alert summarization flow now prefers Deepseek when `DEEPSEEK_API_KEY` is provided, and will fall back to a deterministic local summarizer when no external API key is configured.

If you previously followed instructions in this file, you can safely remove any `GOOGLE_API_KEY`, `GEMINI_API_KEY` or Genkit CLI steps from your local setup.

To test the AI flow now:

1. (optional) Add `DEEPSEEK_API_KEY` to `.env.local` if you want remote AI summaries.
2. Restart the dev server: `npm run dev`
3. Open the dashboard and click the "AI Summary" button — the app will use Deepseek or the local summarizer.

If you'd like, I can also:
- Remove Genkit-related text from README and other docs
- Remove `@genkit-*` packages from lockfiles / node_modules (requires running `npm install` locally)

Tell me which of those you'd like me to do next.
