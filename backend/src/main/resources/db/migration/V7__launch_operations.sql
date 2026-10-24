ALTER TABLE experts ALTER COLUMN currency SET DEFAULT 'INR';
CREATE TABLE finance_accounts (
 booking_id UUID PRIMARY KEY REFERENCES bookings(id), gross_minor BIGINT NOT NULL,
 commission_bps INTEGER NOT NULL CHECK(commission_bps BETWEEN 0 AND 10000),
 commission_minor BIGINT NOT NULL, net_minor BIGINT NOT NULL, currency VARCHAR(3) NOT NULL,
 payout_status VARCHAR(24) NOT NULL DEFAULT 'HELD',
 CHECK(gross_minor=commission_minor+net_minor)
);
CREATE TABLE finance_events (
 id UUID PRIMARY KEY, booking_id UUID NOT NULL REFERENCES bookings(id),
 kind VARCHAR(32) NOT NULL, amount_minor BIGINT NOT NULL, currency VARCHAR(3) NOT NULL,
 created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(booking_id,kind)
);
-- Preserve historical charges with zero commission; do not retroactively charge experts.
INSERT INTO finance_accounts(booking_id,gross_minor,commission_bps,commission_minor,net_minor,currency,payout_status)
 SELECT booking_id,amount_minor,0,0,amount_minor,currency,CASE WHEN status='SIMULATED_REFUNDED' THEN 'REVERSED' ELSE 'HELD' END FROM payments;
INSERT INTO finance_events(id,booking_id,kind,amount_minor,currency)
 SELECT id,booking_id,'COLLECTION',amount_minor,currency FROM payments;
CREATE TABLE support_cases (
 id UUID PRIMARY KEY, booking_id UUID NOT NULL REFERENCES bookings(id), reporter_id UUID NOT NULL REFERENCES accounts(id),
 category VARCHAR(32) NOT NULL, description VARCHAR(2000) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
 resolution VARCHAR(32) NOT NULL DEFAULT '', response VARCHAR(2000) NOT NULL DEFAULT '',
 created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(booking_id,reporter_id)
);
CREATE TABLE deletion_requests (
 account_id UUID PRIMARY KEY REFERENCES accounts(id), status VARCHAR(24) NOT NULL DEFAULT 'OPEN',
 reason VARCHAR(1000) NOT NULL, response VARCHAR(2000) NOT NULL DEFAULT '',
 created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE accounts ADD COLUMN disabled BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE operations_audit (
 id UUID PRIMARY KEY, actor_id UUID NOT NULL REFERENCES accounts(id), target_id UUID NOT NULL,
 action VARCHAR(50) NOT NULL, note VARCHAR(2000) NOT NULL,
 created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE launch_checks (
 check_key VARCHAR(60) PRIMARY KEY, evidence VARCHAR(2000) NOT NULL, actor_id UUID NOT NULL REFERENCES accounts(id),
 checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
