import * as authService from '../services/auth.service.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const user = await authService.register(name, email, password, role);

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const data = await authService.login(email, password);

    res.json({ message: 'Login successful', ...data });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
