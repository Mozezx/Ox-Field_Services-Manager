<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1cdyJ7iB5k-_6xDR_7CdMdlIeHUcRjFr8

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. (Optional) For the map on the task execution screen, copy [env.example](env.example) to `.env.local` and set `VITE_GOOGLE_MAPS_API_KEY` to your [Google Maps JavaScript API](https://console.cloud.google.com/apis/credentials) key. If unset, the screen shows "Mapa não disponível". The map uses Advanced Markers (non-deprecated); for testing the default `DEMO_MAP_ID` is used. For production you can set `VITE_GOOGLE_MAPS_MAP_ID` to a map ID from Google Cloud Console (Map Management).
4. Run the app:
   `npm run dev`
