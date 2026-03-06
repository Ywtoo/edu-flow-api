import pool from '../config/db.js';

export const create = async (lesson_id, questions) => {

    const query = 'INSERT INTO quizzes (lesson_id, questions, is_ai_generated) VALUES ($1, $2, true) RETURNING *';

    const result = await pool.query(query, [lesson_id, questions]);
    return result.rows[0];
}