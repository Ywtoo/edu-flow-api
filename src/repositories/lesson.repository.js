import pool from '../config/db.js';

export const create = async (module_id, title, content_text) => {
    const query = 'INSERT INTO lessons (module_id, title, content_text) VALUES ($1, $2, $3) RETURNING *';

    const result = await pool.query(query, [module_id, title, content_text]);
    return result.rows[0];
};

export const listAll = async () => {
    const query = 'SELECT * FROM lessons';
    const result = await pool.query(query);
    return result.rows;
}

export const findByID = async (id) => {
    const query = 'SELECT * FROM lessons WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};