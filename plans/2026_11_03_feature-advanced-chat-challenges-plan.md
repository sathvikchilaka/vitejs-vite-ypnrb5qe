# Advanced chat challenges — plan

No new deps. Keep existing look (slate/indigo).

- [x] Virtualized list: pure `utils/virtualization.ts` (prefix sums) + `VirtualMessageList` measuring rendered rows; "Seed 10k" button
- [x] Optimistic send: message added instantly as `sending`, ack → `sent` → `delivered` → `read`; random fail → `failed` + retry
- [x] Infinite scroll: `useInfiniteMessages` shows last N, loads +PAGE on scroll top (fake latency), scroll anchored
- [x] Persistence: zustand `persist` over hand-written IndexedDB storage (`utils/idbStorage.ts`, localStorage fallback, debounced writes)
- [x] Offline queue: `queued` status; offline toggle + `window` online/offline; flush in order on reconnect; survives reload
- [x] Debounced search: sidebar (name + message content), in-chat message search
- [x] Attachments: file picker, object-URL previews, stored as data URLs (≤2MB)
- [x] Real-time: `FakeSocket` with WebSocket-like API (open/close/send/onmessage) — acks, typing, replies

## Unresolved questions
- Real WS server wanted, or fake ok?
- Restyle to dark design system, or keep current look?
