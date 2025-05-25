CREATE TABLE profiles (
    user_id UUID PRIMARY KEY,
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE rooms (
    id UUID PRIMARY KEY,
    host UUID,
    FOREIGN KEY (host) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE messages (
    id UUID PRIMARY KEY,
    room_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    author UUID,
    content TEXT NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (author) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE users_rooms (
    user_id UUID,
    room_id UUID,
    PRIMARY KEY (user_id, room_id),
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

CREATE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
