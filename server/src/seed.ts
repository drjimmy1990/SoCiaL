import bcrypt from 'bcryptjs';
import { query } from './db';

const seedDatabase = async () => {
  console.log('🌱 Starting database seeding...');

  try {
    // --- Seed API Services ---
    // Using ON CONFLICT DO NOTHING prevents errors if we run the seed script multiple times.
    const serviceSql = `
      INSERT INTO api_services (id, name, description)
      VALUES (1, 'Evolution API', 'The primary API for WhatsApp automation.')
      ON CONFLICT (id) DO NOTHING;
    `;
    await query(serviceSql);
    console.log('✅ API services seeded.');

    // --- Seed Admin User ---
    const adminExistsResult = await query('SELECT id FROM users WHERE username = $1', ['admin']);
    
    if (adminExistsResult.rows.length === 0) {
      const adminPassword = 'admin123';
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      
      const userSql = `
        INSERT INTO users (username, password_hash, role, instance_limit)
        VALUES ($1, $2, $3, $4)
      `;
      await query(userSql, ['admin', passwordHash, 'admin', 99]);
      console.log('✅ Default admin user created (Password: admin123)');
    } else {
      console.log('👍 Admin user already exists.');
    }

    console.log('🎉 Seeding complete!');
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
  } finally {
    // In a real script, you might want to end the pool connection, but for ts-node it's fine.
  }
};

seedDatabase();