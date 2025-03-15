dev:
    #!/usr/bin/env bash
    cd frontend
    npm run build
    cd ..
    cp -r frontend/dist/* backend/internal/static/
    cd backend
    go build -o server cmd/server/main.go
    ./server
