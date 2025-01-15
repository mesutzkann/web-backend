const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = {
                id: decoded.id,
                userType: decoded.userType,
                isAdmin: decoded.isAdmin
            };

            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.' });
            }
            return res.status(401).json({ message: 'Geçersiz oturum. Lütfen tekrar giriş yapın.' });
        }
    } catch (err) {
        console.error('Auth middleware hatası:', err);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
}; 