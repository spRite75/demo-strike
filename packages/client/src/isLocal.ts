export const isLocal = ["localhost", "127.0.0.1", ""].includes(
  window.location.hostname
);

if (isLocal) console.warn("Running in local mode...");
