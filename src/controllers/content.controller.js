import * as moduleRepository from '../repositories/module.repository.js';
import * as lessonRepository from '../repositories/lesson.repository.js';

//Create -----------------------------------------------------
export const createModule = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, ordering } = req.body;

        const newModule = await moduleRepository.create(courseId, title, ordering);

        res.status(201).json({ message: 'Módulo criado!', module: newModule });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createLesson = async (req, res) => {
    try {
        const { moduleId: module_id } = req.params;
        const { title, content_text } = req.body;

        const lessonID = await lessonRepository.create(module_id, title, content_text);

        res.status(201).json({ message: 'Lição criada!', lessonId: lessonID });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//List -----------------------------------------------------
export const listModulesByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const modules = await moduleRepository.findByCourseID(courseId);
        res.status(200).json(modules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getLessonByID = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const lesson = await lessonRepository.findByID(lessonId);
        if (lesson) {
            res.status(200).json(lesson);
        } else {
            res.status(404).json({ message: 'Lição não encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getFullCourseContent = async (req, res) => {
    try {
        const { courseId } = req.params;
        const content = await moduleRepository.findFullCourseContent(courseId);


        if (content.length === 0) {
            return res.status(404).json({ message: 'Conteúdo do curso não encontrado' });
        }
        res.status(200).json(content);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};