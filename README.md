# go-chat

Another real-time, group messaging app

I started this project because I wanted to build a polished RESTful API that encompasses all of the design patterns, best practices, and other lessons I have learned, so that I have something to look back on when trying to build RESTful services in the future. Hopefully, this project will be kind of a living document where I will go back and add, remove, or refactor things as I learn them in the future.

I decided on real-time messaging so that I could learn something new while building my "polished" RESTful API. I wanted to learn how to design my server so that it could handle long-lasting WebSocket connections in a clean manner. I ended up deciding on an event-driven architecture, which I will talk about more later.

I also decided on group messaging so that I could work more with Go's concurrency model.

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

## Frontend

- API service functions with axios
- Observer pattern for managing messages from the WebSocket connection
- UI components leveraging shadcn
