dev:
    #!/usr/bin/env bash
    cd frontend
    npm run build
    cd ..
    cp -r frontend/dist/* backend/internal/static/
    cd backend
    go build -o bin/server cmd/server/main.go
    ./bin/server
