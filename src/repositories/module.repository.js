import pool from '../config/db.js';

export const create = async (courseId, title, ordering) => {
    const query = 'INSERT INTO modules (course_id, title, ordering) VALUES ($1, $2, $3) RETURNING *';

    const result = await pool.query(query, [courseId, title, ordering]);
    return result.rows[0];
};

export const listAll = async () => {
    const query = 'SELECT * FROM modules ORDER BY ordering ASC;';
    const result = await pool.query(query);
    return result.rows;
};

export const findByCourseID = async (id) => {
    const query = 'SELECT * FROM modules WHERE course_id = $1 ORDER BY ordering ASC;';
    const result = await pool.query(query, [id]);
    return result.rows;
};

export const findFullCourseContent = async (id) => {
    const query = `
        SELECT
            m.id          AS module_id,
            m.title       AS module_title,
            m.ordering    AS module_order,
            l.id          AS lesson_id,
            l.title       AS lesson_title,
            l.content_text AS lesson_content
        FROM modules m
        LEFT JOIN lessons l ON m.id = l.module_id
        WHERE m.course_id = $1
        ORDER BY m.ordering ASC, l.id ASC;
    `;
    const result = await pool.query(query, [id]);
    
    const content = result.rows.reduce((acc, row) => {
        let module = acc.find(m => m.id === row.module_id);
        if (!module) {
            module = { id: row.module_id, title: row.module_title, lessons: [] };
            acc.push(module);
        }
        if (row.lesson_id) {
            module.lessons.push({ id: row.lesson_id, title: row.lesson_title });
        }
        return acc;
    }, []);
    
    return content;
};