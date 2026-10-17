CREATE TABLE availability_blocks (
 id UUID PRIMARY KEY,
 expert_id UUID NOT NULL REFERENCES experts(id),
 starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
 ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
 CHECK (ends_at > starts_at)
);
CREATE INDEX availability_blocks_expert_time ON availability_blocks(expert_id,starts_at,ends_at);
