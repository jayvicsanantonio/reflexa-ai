// Background service worker entry point
console.log('Reflexa AI background service worker initialized');

// Message listener for communication with content scripts and popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Received message:', message);

  // Message routing will be implemented in later tasks
  sendResponse({ success: true });
  return true;
});

// Check AI availability on startup
chrome.runtime.onInstalled.addListener(() => {
  console.log('Reflexa AI extension installed');
});
