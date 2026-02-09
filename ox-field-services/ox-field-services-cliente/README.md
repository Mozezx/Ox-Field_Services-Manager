<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/13s-_4mwahqMJz-lDBXMmXDFPRdw9FI1T

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set in [.env.local](.env.local): `GEMINI_API_KEY` (Gemini API key) and `VITE_GOOGLE_MAPS_API_KEY` (Google Maps JavaScript API key, for the tracking map). Create the key in Google Cloud Console with Maps JavaScript API enabled.
3. Run the app:
   `npm run dev`
