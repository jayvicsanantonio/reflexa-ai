// Background service worker entry point
import { AIManager } from './aiManager';

console.log('Reflexa AI background service worker initialized');

// Initialize AI Manager
const aiManager = new AIManager();

// Message listener for communication with content scripts and popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Received message:', message);

  // Message routing will be implemented in later tasks
  sendResponse({ success: true });
  return true;
});

// Check AI availability on startup
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Reflexa AI extension installed');

  // Check if Gemini Nano is available
  const available = await aiManager.checkAvailability();
  console.log('Gemini Nano available:', available);
});
