CREATE TABLE profiles (
    user_id UUID PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE rooms (
    id UUID PRIMARY KEY,
    host UUID NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    FOREIGN KEY (host) REFERENCES profiles(user_id) ON DELETE SET NULL
);

CREATE TABLE messages (
    id UUID PRIMARY KEY,
    room_id UUID NOT NULL,
    author UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (author) REFERENCES profiles(user_id) ON DELETE SET NULL
);

CREATE TABLE users_rooms (
    user_id UUID,
    room_id UUID,
    PRIMARY KEY (user_id, room_id),
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
