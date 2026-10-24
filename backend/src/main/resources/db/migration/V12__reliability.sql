ALTER TABLE bookings ADD COLUMN original_start TIMESTAMP WITH TIME ZONE;
UPDATE bookings SET original_start=COALESCE((SELECT r.original_start FROM reschedule_requests r WHERE r.booking_id=bookings.id AND r.status='ACCEPTED' ORDER BY r.created_at,r.id LIMIT 1),starts_at);
ALTER TABLE bookings ALTER COLUMN original_start SET NOT NULL;
CREATE TABLE auth_rate_limits (
 key_hash VARCHAR(64) NOT NULL, window_start BIGINT NOT NULL, attempts INTEGER NOT NULL CHECK(attempts BETWEEN 1 AND 30),
 PRIMARY KEY(key_hash,window_start)
);
CREATE INDEX auth_rate_expiry ON auth_rate_limits(window_start);
CREATE INDEX bookings_status_start ON bookings(status,starts_at);
CREATE INDEX outbox_booking_kind ON mail_outbox(booking_id,notification_kind,expires_at);
CREATE INDEX support_booking_status ON support_cases(booking_id,status);
CREATE INDEX reschedule_pending ON reschedule_requests(status,booking_id);
ALTER TABLE messages ADD COLUMN request_key UUID;
CREATE UNIQUE INDEX message_request_key ON messages(sender_id,request_key);
