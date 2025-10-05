import { app, initializeApp } from '../dist/index.js';

// Initialize the app once
let initialized = false;

export default async function handler(req, res) {
  if (!initialized) {
    await initializeApp();
    initialized = true;
  }

  return app(req, res);
}
