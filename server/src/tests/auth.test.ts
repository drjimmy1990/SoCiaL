import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../app';
import pool from '../db';

// --- Test Setup ---
const testUser = {
  username: 'testloginuser',
  password: 'password123',
};

// This block runs ONCE before all tests in this file.
// Its only job is to create persistent data needed for the tests.
beforeAll(async () => {
  // We clear the users table to ensure a clean slate, just in case.
  await pool.query('DELETE FROM users WHERE username = $1', [testUser.username]);
  
  const passwordHash = await bcrypt.hash(testUser.password, 10);
  await pool.query(
    'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
    [testUser.username, passwordHash, 'user']
  );
});

// This block runs ONCE after all tests in this file are complete.
afterAll(async () => {
  // Clean up the user we created
  await pool.query('DELETE FROM users WHERE username = $1', [testUser.username]);
  // Close the database connection pool
  await pool.end();
});


// 'describe' groups related tests together.
describe('Authentication API - /api/auth', () => {
  
  // These hooks manage transactions for EACH test case, ensuring perfect isolation.
  beforeEach(async () => {
    await pool.query('BEGIN'); // Start a transaction
  });

  afterEach(async () => {
    await pool.query('ROLLBACK'); // Undo any changes made by the test
  });


  it('should log in a user with correct credentials and return a token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: testUser.password,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.username).toBe(testUser.username);
  });

  it('should fail to log in with an incorrect password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: 'wrongpassword',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials.');
  });

  it('should fail to log in with a non-existent username', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'nouser',
        password: 'somepassword',
      });

    expect(response.status).toBe(401);
  });

  it('should fail with a bad request if password is not provided', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUser.username,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Username and password are required.');
  });

});