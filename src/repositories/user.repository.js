import pool from '../config/db.js';

export const createUser = async (name, email, passwordHash, role = "student") => {
    const query = `
        INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role, created_at
    `;

    const values = [name, email, passwordHash, role];

    const result = await pool.query(query, values);

    return result.rows[0];
};

export const findByEmail = async (email) => {
    const query = `SELECT * FROM users WHERE email = $1`;
    const result = await pool.query(query, [email]);
    return result.rows[0];
};

export default {
    createUser,
    findByEmail
};