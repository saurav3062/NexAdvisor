ALTER TABLE bookings ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX bookings_expiry ON bookings(status,expires_at);
