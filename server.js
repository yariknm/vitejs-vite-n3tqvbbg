const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

// База данных в памяти сервера (реальные аккаунты и сообщения)
let users = []; // { username, password }
let messages = []; // { from, to, text, time }
let activeSockets = {}; // username -> socket.id

io.on('connection', (socket) => {
    console.log('Пользователь подключился:', socket.id);

    // Регистрация
    socket.on('register', (data) => {
        const { username, password } = data;
        if (!username || !password) {
            return socket.emit('auth_error', 'Заполните все поля');
        }
        if (users.find(u => u.username === username)) {
            return socket.emit('auth_error', 'Такой логин уже занят');
        }
        users.push({ username, password });
        socket.emit('auth_success', { username });
        io.emit('users_list', users.map(u => u.username));
    });

    // Вход
    socket.on('login', (data) => {
        const { username, password } = data;
        const user = users.find(u => u.username === username && u.password === password);
        if (!user) {
            return socket.emit('auth_error', 'Неверный логин или пароль');
        }
        activeSockets[username] = socket.id;
        socket.username = username;
        
        socket.emit('auth_success', { username });
        io.emit('users_list', users.map(u => u.username));
        // Отправляем всю историю чата при входе
        socket.emit('load_messages', messages);
    });

    // Отправка сообщения
    socket.on('send_message', (data) => {
        const { to, text } = data;
        const newMessage = {
            from: socket.username,
            to: to, // если 'all', то общий чат, если имя пользователя — личный
            text: text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        messages.push(newMessage);
        
        // Рассылаем всем подключенным клиентам новое сообщение
        io.emit('new_message', newMessage);
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            delete activeSockets[socket.username];
        }
        console.log('Пользователь отключился');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер мессенджера запущен на порту ${PORT}`);
});
