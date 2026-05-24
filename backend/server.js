const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:5000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5000"
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

const io = new Server(server, {
    cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Local static uploads folder mapping (you can leave this for retro-compatibility if you have existing files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected to: ${process.env.MONGO_URI}`);
    } catch (err) {
        console.error('Failed to connect to Atlas MongoDB, falling back to local database...');
        console.error(err.message);
        try {
            await mongoose.connect('mongodb://127.0.0.1:27017/unimarket');
            console.log('MongoDB Connected to Local fallback (mongodb://127.0.0.1:27017/unimarket)');
        } catch (localErr) {
            console.error('Failed to connect to local MongoDB as well:', localErr.message);
        }
    }
};
connectDB();

// Socket.io Middleware for Authentication
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers['x-auth-token'];
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id);

        if (!user) {
            return next(new Error('Authentication error: User not found'));
        }

        if (user.isBlocked) {
            return next(new Error('Account blocked'));
        }

        socket.user = user; // Attach user to socket
        next();
    } catch (err) {
        next(new Error('Authentication error: Invalid token'));
    }
});

// Expose Socket.IO to routes
app.set('io', io);

// Socket.io Logic
io.on('connection', (socket) => {
    // console.log('New client connected:', socket.id); // Optional log

    socket.on('join_chat', (room) => {
        // Optional: Check if user is part of this chat room (requires DB check or room naming convention)
        // For now, allow join
        socket.join(room);
        // console.log(`User ${socket.user.name} joined room: ${room}`);
    });

    socket.on('send_message', async (data) => {
        // Re-check block status before sending (in case they got blocked while connected)
        try {
            const sender = await User.findById(socket.user._id);
            if (sender.isBlocked) {
                socket.emit('error', 'Your account is blocked');
                return;
            }
            // data: { room, sender, message, time }
            io.to(data.room).emit('receive_message', data);
        } catch (err) {
            console.error(err);
        }
    });

    socket.on('disconnect', () => {
        // console.log('Client disconnected', socket.id);
    });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reports', require('./routes/reports'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
