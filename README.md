# Pulse Chat

A responsive Slack- and WhatsApp Web-inspired messaging application
built with **React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, and
React Hook Form**.

## Features

- One-to-one and group conversations, including group member
  management
- Conversation search and filters
- Send, reply to, edit, delete, copy, and react to messages
- Message date grouping, typing indicators, unread counts, and
  delivery/read statuses
- Simulated incoming messages without a backend
- Responsive layout and light/dark themes
- Browser persistence with Zustand and LocalStorage

## Tech Stack

Area Technology

---

UI React 19, TypeScript, Vite
Styling Tailwind CSS v4
State Zustand
Forms React Hook Form
Icons Lucide React
Tests Jest, React Testing Library
Persistence LocalStorage via Zustand persist

## Getting Started

```bash
npm install
npm run dev
```

Open the URL printed by Vite.

To run tests:

```bash
npm test
```

## Architecture

```text
src/
├── components/       # Chat sidebar, window, bubbles, composer, group details
├── data/             # Seed conversations and messages
├── hooks/            # Reusable hooks, including debounce
├── services/         # Simulated chat delivery and incoming messages
├── store/            # Zustand chat state and tests
├── types/            # TypeScript domain models
├── App.tsx
└── main.tsx
```

The app separates presentation, shared state, simulated transport, and
domain models. Zustand handles message and conversation updates, while a
mock service simulates asynchronous delivery without a backend.

## Advanced Challenges

The following items are **planned enhancements**, not yet verified as
implemented in the current codebase:

- [ ] Custom message virtualization for 10,000+ messages
- [ ] Cursor-based infinite scrolling and scroll anchoring
- [ ] Failed optimistic sends with retry and deduplication
- [ ] Offline message queue with reconnect processing
- [ ] Attachment selection and local previews
- [ ] Optional WebSocket transport

The following are already present in the initial implementation:

- [x] Optimistic message insertion with a `sending` state
- [x] LocalStorage persistence through Zustand
- [x] Custom debounced conversation search
- [x] Timer-based real-time message simulation

**Implementation approach for future enhancements:** use native browser
APIs, React hooks, and custom TypeScript algorithms rather than
third-party virtualization, pagination, or offline-queue libraries.

## Testing

Jest is configured for store-level tests. Run `npm test` to check the
current test suite. Additional tests should cover pagination,
virtualization calculations, retry logic, and offline synchronization
once those features are implemented.

## Notes

This is a frontend-only demonstration. Messages and simulated delivery
are local to the browser; no production chat server is connected.
