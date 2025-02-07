const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '11111111',
    database: 'project_manager'
});

const authRouter = express.Router();

authRouter.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Логін
authRouter.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        req.session.userId = results[0].id; // Зберігаємо ID користувача в сесії
        console.log('User logged in with ID:', req.session.userId); // Логування ID користувача
        res.json({ message: 'Logged in successfully' });
    });
});

// Вихід
authRouter.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

// Отримати інформацію про поточного користувача
authRouter.get('/me', (req, res) => {
    console.log('Session user ID:', req.session.userId); // Логування ID користувача
    if (!req.session.userId) return res.status(401).json({ message: 'Unauthorized' });
    db.query('SELECT * FROM users WHERE id = ?', [req.session.userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
});

module.exports = authRouter;