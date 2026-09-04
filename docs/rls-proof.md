# Client isolation proof

The database test in `supabase/tests/clients_rls.sql` creates two consultant identities and executes all client operations while switching the authenticated Postgres claim.

It verifies:

1. Account A creates and reads its own client.
2. Account A cannot insert a row owned by account B.
3. Account B gets zero rows when listing or directly searching for account A's herd number.
4. Account B cannot update or delete account A's row.
5. Account B can create and read its own row.
6. Account A's row remains unchanged and can be archived by A.
7. Account A cannot transfer its row to account B.

This exercises the same RLS policies used by the application through the `authenticated` database role. A direct URL containing another tenant's client UUID resolves as not found because the row is filtered before it reaches the application.

