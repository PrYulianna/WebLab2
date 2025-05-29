const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./pomodoro.db', (err) => {
    if (err) {
        console.error('Помилка підключення до бази даних:', err.message);
    } else {
        console.log('Підключено до SQLite бази даних');
        initDatabase();
    }
});

function initDatabase() {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        work_duration INTEGER DEFAULT 25,
        short_break_duration INTEGER DEFAULT 5,
        long_break_duration INTEGER DEFAULT 15,
        sessions_before_long_break INTEGER DEFAULT 4,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        estimated_pomodoros INTEGER DEFAULT 1,
        completed_pomodoros INTEGER DEFAULT 0,
        completed BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS session_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        task_id INTEGER,
        mode TEXT NOT NULL,
        duration INTEGER NOT NULL,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (task_id) REFERENCES tasks (id)
    )`);
}

app.get('/api/settings/:userId', (req, res) => {
    const userId = req.params.userId;
    
    db.get(`SELECT * FROM user_settings WHERE user_id = ?`, [userId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!row) {
            const defaultSettings = {
                work_duration: 25,
                short_break_duration: 5,
                long_break_duration: 15,
                sessions_before_long_break: 4
            };
            
            db.run(`INSERT INTO user_settings (user_id, work_duration, short_break_duration, long_break_duration, sessions_before_long_break) 
                    VALUES (?, ?, ?, ?, ?)`,
                [userId, defaultSettings.work_duration, defaultSettings.short_break_duration, 
                 defaultSettings.long_break_duration, defaultSettings.sessions_before_long_break],
                function(err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    res.json(defaultSettings);
                });
        } else {
            res.json({
                work_duration: row.work_duration,
                short_break_duration: row.short_break_duration,
                long_break_duration: row.long_break_duration,
                sessions_before_long_break: row.sessions_before_long_break
            });
        }
    });
});

app.put('/api/settings/:userId', (req, res) => {
    const userId = req.params.userId;
    const { work_duration, short_break_duration, long_break_duration, sessions_before_long_break } = req.body;
    
    db.run(`UPDATE user_settings 
            SET work_duration = ?, short_break_duration = ?, long_break_duration = ?, sessions_before_long_break = ?
            WHERE user_id = ?`,
        [work_duration, short_break_duration, long_break_duration, sessions_before_long_break, userId],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (this.changes === 0) {
                db.run(`INSERT INTO user_settings (user_id, work_duration, short_break_duration, long_break_duration, sessions_before_long_break) 
                        VALUES (?, ?, ?, ?, ?)`,
                    [userId, work_duration, short_break_duration, long_break_duration, sessions_before_long_break],
                    function(err) {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        res.json({ message: 'Налаштування збережено', id: this.lastID });
                    });
            } else {
                res.json({ message: 'Налаштування оновлено' });
            }
        });
});

app.get('/api/tasks/:userId', (req, res) => {
    const userId = req.params.userId;
    
    db.all(`SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC`, [userId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const tasks = rows.map(row => ({
            id: row.id,
            name: row.name,
            estimated_pomodoros: row.estimated_pomodoros,
            completed_pomodoros: row.completed_pomodoros,
            completed: Boolean(row.completed),
            is_active: Boolean(row.is_active),
            created_at: row.created_at
        }));
        
        res.json(tasks);
    });
});

app.post('/api/tasks/:userId', (req, res) => {
    const userId = req.params.userId;
    const { name, estimated_pomodoros } = req.body;
    
    db.run(`INSERT INTO tasks (user_id, name, estimated_pomodoros) VALUES (?, ?, ?)`,
        [userId, name, estimated_pomodoros],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({
                id: this.lastID,
                name,
                estimated_pomodoros,
                completed_pomodoros: 0,
                completed: false,
                is_active: false,
                created_at: new Date().toISOString()
            });
        });
});

app.put('/api/tasks/:taskId', (req, res) => {
    const taskId = req.params.taskId;
    const { name, estimated_pomodoros, completed_pomodoros, completed, is_active } = req.body;
    
    db.run(`UPDATE tasks 
            SET name = ?, estimated_pomodoros = ?, completed_pomodoros = ?, completed = ?, is_active = ?
            WHERE id = ?`,
        [name, estimated_pomodoros, completed_pomodoros, completed ? 1 : 0, is_active ? 1 : 0, taskId],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Завдання оновлено', changes: this.changes });
        });
});

app.put('/api/tasks/:userId/active/:taskId', (req, res) => {
    const userId = req.params.userId;
    const taskId = req.params.taskId;
    
    db.run(`UPDATE tasks SET is_active = FALSE WHERE user_id = ?`, [userId], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        db.run(`UPDATE tasks SET is_active = TRUE WHERE id = ? AND user_id = ?`, [taskId, userId], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Активне завдання встановлено', changes: this.changes });
        });
    });
});

app.delete('/api/tasks/:taskId', (req, res) => {
    const taskId = req.params.taskId;
    
    db.run(`DELETE FROM tasks WHERE id = ?`, [taskId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Завдання видалено', changes: this.changes });
    });
});
app.post('/api/sessions/:userId', (req, res) => {
    const userId = req.params.userId;
    const { task_id, mode, duration } = req.body;
    
    db.run(`INSERT INTO session_history (user_id, task_id, mode, duration) VALUES (?, ?, ?, ?)`,
        [userId, task_id, mode, duration],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, message: 'Сесія збережена' });
        });
});

app.get('/api/sessions/:userId', (req, res) => {
    const userId = req.params.userId;
    
    db.all(`SELECT sh.*, t.name as task_name 
            FROM session_history sh 
            LEFT JOIN tasks t ON sh.task_id = t.id 
            WHERE sh.user_id = ? 
            ORDER BY sh.completed_at DESC 
            LIMIT 50`, [userId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const sessions = rows.map(row => ({
            id: row.id,
            task_id: row.task_id,
            task_name: row.task_name,
            mode: row.mode,
            duration: row.duration,
            completed_at: row.completed_at
        }));
        
        res.json(sessions);
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
});

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('База даних закрита');
        process.exit(0);
    });
});