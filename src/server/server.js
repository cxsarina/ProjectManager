const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const session = require('express-session');
const authRouter = require('./auth');

const app = express();
const port = 5000;

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Підключення до бази даних
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '11111111',
    database: 'project_manager'
});

// Перевірка підключення до бази даних
db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Database connected!');
});

// Маршрути для аутентифікації
app.use('/auth', authRouter);

app.get('/projects', (req, res) => {
    const userId = req.session.userId; // Отримуємо ID користувача з сесії

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    db.query('SELECT role FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        const role = results[0].role;

        if (role === 'admin') {
            // Якщо admin, повертаємо всі проекти
            db.query('SELECT * FROM projects', (err, projects) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(projects);
            });
        } else {
            // Якщо не admin, повертаємо проекти, до яких має доступ користувач
            db.query('SELECT p.* FROM projects p JOIN project_users pu ON p.id = pu.project_id WHERE pu.user_id = ?', [userId], (err, projects) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(projects);
            });
        }
    });
});

app.get('/projects/:id', (req, res) => {
    const userId = req.session.userId; // Отримуємо ID користувача з сесії
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    db.query('SELECT * FROM projects WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Project not found' });
        res.json(results[0]);
    });
});

app.post('/projects', (req, res) => {
    const { name } = req.body;
    const userId = req.session.userId;

    db.query('SELECT role FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0 || results[0].role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        db.query('INSERT INTO projects (name) VALUES (?)', [name], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });

            const projectId = results.insertId;

            db.query('INSERT INTO project_users (user_id, project_id, role) VALUES (?, ?, ?)', [userId, projectId, 'admin'], (err) => {
                if (err) return res.status(500).json({ error: err.message });

                res.status(201).json({ id: projectId, name });
            });
        });
    });
});

app.put('/projects/:id', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    db.query('UPDATE projects SET name = ? WHERE id = ?', [name, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ id, name });
    });
});

app.delete('/projects/:id', (req, res) => {
    const projectId = req.params.id;
    const userId = req.session.userId;

    db.query('SELECT role FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0 || results[0].role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        db.query('DELETE FROM project_users WHERE project_id = ?', [projectId], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            db.query('DELETE FROM projects WHERE id = ?', [projectId], (err) => {
                if (err) return res.status(500).json({ error: err.message });

                res.status(204).send();
            });
        });
    });
});

// Маршрути для роботи із завданнями

app.get('/tasks/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM tasks WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Task not found' });
        res.json(results[0]);
    });
});
app.get('/tasks', (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const projectId = req.query.project_id;
    db.query('SELECT * FROM project_users WHERE user_id = ? AND project_id = ?', [userId, projectId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        db.query('SELECT * FROM tasks WHERE project_id = ?', [projectId], (err, tasks) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(tasks);
        });
    });
});
app.post('/tasks', (req, res) => {
    const { name, status, project_id } = req.body;
    const userId = req.session.userId;

    db.query('SELECT role FROM project_users WHERE user_id = ? AND project_id = ?', [userId, project_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0 || results[0].role !== 'teamlead') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        db.query('INSERT INTO tasks (name, status, project_id) VALUES (?, ?, ?)', [name, status, project_id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: results.insertId, name, status, project_id });
        });
    });
});

app.put('/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { name, status } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    db.query('SELECT role FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error("Error querying user role:", err);
            return res.status(500).json({ error: err.message });
        }

        const userRole = results[0]?.role;

        db.query('SELECT * FROM tasks WHERE id = ?', [id], (err, results) => {
            if (err) {
                console.error("Error querying task:", err);
                return res.status(500).json({ error: err.message });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'Task not found' });
            }

            if (userRole === 'admin' || userRole === 'teamlead') {
                const updateFields = [];
                const values = [];

                if (name) {
                    updateFields.push('name = ?');
                    values.push(name);
                }

                if (status) {
                    updateFields.push('status = ?');
                    values.push(status);
                }

                if (updateFields.length === 0) {
                    return res.status(400).json({ message: 'No fields to update' });
                }

                values.push(id);

                db.query(`UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`, values, (err) => {
                    if (err) {
                        console.error("Error updating task:", err);
                        return res.status(500).json({ error: err.message });
                    }
                    console.log(`Task updated: Task ID = ${id}, Name = ${name || 'No change'}, Status = ${status || 'No change'}`);
                    res.status(200).json({ message: 'Task updated successfully' });
                });
            } else {
                res.status(403).json({ message: 'Forbidden' });
            }
        });
    });
});



app.delete('/tasks/:id', (req, res) => {
    const { id } = req.params;
    const userId = req.session.userId;

    db.query('SELECT pu.role FROM tasks t JOIN project_users pu ON t.project_id = pu.project_id WHERE t.id = ? AND pu.user_id = ?', [id, userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0 || results[0].role !== 'teamlead') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        db.query('DELETE FROM tasks WHERE id = ?', [id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(200).json({ message: 'Task deleted successfully' });
        });
    });
});
app.get('/auth/me', (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
});
// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

