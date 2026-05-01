# go-chat

https://go-chat-frontend-3glj.onrender.com

## Tech stack

### Backend

- Go
- Fiber
- Supabase

### Frontend

- TypeScript
- React

## Backend

- CRUD endpoints with Fiber handlers
- JWT auth with Supabase + golang-jwt
- Caching with Fiber middleware
- Supabase database
- Storage operations with pgx
- WebSocket handling with custom library "eventsocket"

WebSocket connections are managed by a combination of an event-driven system (eventsocket) + "plugins". Eventsocket exposes a public API that allows consumers of the library to register message handlers on client connections, and register event handlers for lifecycle events such as clients joining/disconnecting and rooms being created/destroyed. A "plugin" encapsulates logic for a feature that leverages the WebSocket connection. This keeps the design modular as each plugin manages its own logic, and promotes extensibility as adding functionality can be done by simply adding more plugins.

## Frontend

- API service functions with axios
- Observer pattern for managing messages from the WebSocket connection
- UI components leveraging shadcn
