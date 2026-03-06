import pool from '../config/db.js';

export const create = async (title, description, instructor_id) => {
    const query = 'INSERT INTO courses (title, description, instructor_id) VALUES ($1, $2, $3) RETURNING *';

    const result = await pool.query(query, [title, description, instructor_id]);
    return result.rows[0];
};

export const listAll = async () => {
    const query = 'SELECT * FROM courses';
    const result = await pool.query(query);
    return result.rows;
}