import * as quizRepository from '../repositories/quiz.repository.js';
import * as lessonRepository from '../repositories/lesson.repository.js';
import { generateQuiz } from '../services/ai.service.js';

export const create = async (req, res) => {
    try {
        const { lessonId } = req.params;

        const lesson = await lessonRepository.findByID(lessonId);
        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        const quizQuestions = await generateQuiz(lesson.content_text);

        const newQuiz = await quizRepository.create(lessonId, quizQuestions);

        res.status(201).json({ message: 'Quiz criado!', quiz: newQuiz });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
