/*
# Fix dashboard conversation queries

The `useDashboardSummary` hook queries conversations using `user1_id` / `user2_id` columns which don't exist in the conversations table. The actual schema has `expert_id` and `client_id`.

Also fix the `useDashboardSummary` client query to use the correct column for experts count.

However this is a code fix, not a database fix. Let me focus on the database first.

1. The conversations table has correct columns: expert_id, client_id. No migration needed.
*/

-- No database migration needed - this is a frontend code fix
SELECT 1;
