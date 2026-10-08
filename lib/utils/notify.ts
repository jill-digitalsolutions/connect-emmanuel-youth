// Tells the server to send phone/browser alerts for something an admin just
// created. Best effort: the in-app bell works either way.
export function notifyServer(kind: "banner" | "fellowship" | "announcement", id: string) {
  fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, id }),
  }).catch(() => {});
}
