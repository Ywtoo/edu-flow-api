import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as userRepository from "../repositories/user.repository.js";

export const register = async (name, email, password, role) => {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
        throw new Error("Email already in use");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await userRepository.createUser(name, email, passwordHash, role);
    return newUser;
};

export const login = async (email, password) => {
    const user = await userRepository.findByEmail(email);
    if (!user) {
        throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token };
};

export default {
    register,
    login
};