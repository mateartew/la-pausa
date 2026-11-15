// La Pausa · service worker: abre sin conexión y maneja los avisos
const C = "lapausa-v35";
const SHELL = ["./", "manifest.webmanifest", "icons/icon-192.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  const mine = u.origin === location.origin, font = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (mine && /\/cal\.ics$/.test(u.pathname)) {  // evento de calendario armado en el momento (lo abre el Calendario del celular)
    let t = ""; try { const b = (u.searchParams.get("d") || "").replace(/-/g, "+").replace(/_/g, "/"); t = new TextDecoder().decode(Uint8Array.from(atob(b), c => c.charCodeAt(0))); } catch (err) {}
    e.respondWith(new Response(t, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": (u.searchParams.get("a") ? "attachment" : "inline") + '; filename="la-pausa.ics"', "Cache-Control": "no-store" } }));
    return;
  }
  if (!mine && !font) return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok || r.type === "opaque") { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("./"))));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => { for (const c of cs) if ("focus" in c) return c.focus(); return self.clients.openWindow("./#anotar"); }));
});
