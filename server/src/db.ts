import { Pool } from 'pg';
import config from './config';

// Determine which database URL to use.
// Jest automatically sets NODE_ENV to 'test' when running tests.
const isTestEnvironment = process.env.NODE_ENV === 'test';
const connectionString = isTestEnvironment 
  ? config.testDatabaseUrl 
  : config.databaseUrl;

// Add a check to prevent running tests without a test database configured.
if (isTestEnvironment && !connectionString) {
  throw new Error(
    'TEST_DATABASE_URL is not set in the .env file. Please configure it to run tests.'
  );
}

const pool = new Pool({
  connectionString,
});

/**
 * A centralized function to query the database.
 */
export const query = (text: string, params?: any[]) => {
  // We can optionally disable logging during tests to keep the output clean.
  if (!isTestEnvironment) {
    console.log('[db]: Executing query:', text);
  }
  return pool.query(text, params);
};

export default pool;