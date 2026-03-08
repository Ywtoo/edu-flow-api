import pool from '../config/db.js';

export const create = async (lesson_id, questions) => {

    const query = 'INSERT INTO quizzes (lesson_id, questions, ai_generated) VALUES ($1, $2, true) RETURNING *';

    const result = await pool.query(query, [lesson_id, JSON.stringify(questions)]);
    return result.rows[0];
}