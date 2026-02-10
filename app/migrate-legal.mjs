// Migration: Add consent management and GDPR tables
// Run: node migrate-legal.mjs

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://n8n_app:n8nBuild3r_2024!@localhost:5432/email_manager',
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. user_consents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_consents (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        consent_type VARCHAR(50) NOT NULL,
        granted BOOLEAN NOT NULL DEFAULT false,
        granted_at TIMESTAMPTZ DEFAULT NOW(),
        revoked_at TIMESTAMPTZ,
        ip_address VARCHAR(45),
        user_agent TEXT,
        version VARCHAR(20) DEFAULT '1.0',
        UNIQUE(user_id, consent_type)
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);`);

    // 2. gdpr_requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gdpr_requests (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        request_type VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        requested_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        notes TEXT
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user_id ON gdpr_requests(user_id);`);

    // 3. Add columns to clients table
    await client.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS ai_processing_enabled BOOLEAN DEFAULT true;`);
    await client.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS auto_reply_enabled BOOLEAN DEFAULT true;`);

    await client.query('COMMIT');
    console.log('Migration completed successfully!');
    console.log('  - Created table: user_consents');
    console.log('  - Created table: gdpr_requests');
    console.log('  - Added column: clients.ai_processing_enabled (default: true)');
    console.log('  - Added column: clients.auto_reply_enabled (default: true)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
