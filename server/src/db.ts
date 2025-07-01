import { Pool } from 'pg';
import config from './config';

// Create a new connection pool.
// A connection pool is much more efficient than creating a new client
// for every query, as it manages a set of active connections.
const pool = new Pool({
  connectionString: config.databaseUrl,
});

/**
 * A centralized function to query the database.
 * This helps with logging and consistent error handling.
 * @param text The SQL query string.
 * @param params The parameters to pass to the SQL query.
 * @returns The result of the query.
 */
export const query = (text: string, params?: any[]) => {
  console.log('[db]: Executing query:', text);
  return pool.query(text, params);
};

export default pool;