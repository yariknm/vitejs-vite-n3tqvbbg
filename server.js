const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Простая база данных в памяти сервера (для продакшена лучше подключить БД, например SQLite или MongoDB)
let registeredUsers = [];

// Регистрация
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  const cleanUsername = username ? username.trim().toLowerCase() : '';

  if (!cleanUsername || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'Заполните все поля' });
  }

  const existingUser = registeredUsers.find(
    (u) => u.username === cleanUsername
  );
  if (existingUser) {
    return res
      .status(400)
      .json({ success: false, message: 'Этот аккаунт уже зарегистрирован!' });
  }

  registeredUsers.push({ username: cleanUsername, password });
  res.json({ success: true, message: 'Аккаунт успешно создан!' });
});

// Вход
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const cleanUsername = username ? username.trim().toLowerCase() : '';

  const user = registeredUsers.find(
    (u) => u.username === cleanUsername && u.password === password
  );
  if (user) {
    res.json({ success: true, message: 'Успешный вход' });
  } else {
    res
      .status(400)
      .json({ success: false, message: 'Неверная почта или пароль' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
