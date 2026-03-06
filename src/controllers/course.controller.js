import * as courseRepository from '../repositories/course.repository.js';

export const create = async (req, res) => {
  try {
    const { title, description } = req.body;

    const instructor_id = req.user.userId;

    const courseID = await courseRepository.create(title, description, instructor_id);

    res.status(201).json({ message: 'Curso criado!', courseId: courseID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listAll = async (req, res) => {
  try {
    const courses = await courseRepository.listAll();
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};