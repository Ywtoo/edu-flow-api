export const verifyRole = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ error: 'Acesso negado. Apenas instrutores podem realizar esta ação.' });
        }
        next();
    };
};