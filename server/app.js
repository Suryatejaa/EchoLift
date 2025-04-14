const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const bodyParser = require('body-parser');
const qs = require('qs');
const axios = require('axios');

const userRoutes = require('./Routes/userRoutes');
const feedRoutes = require('./Routes/feedRoutes');
const postRoutes = require('./Routes/postRoutes');
const profileRoutes = require('./Routes/profileRoutes');
const searchRoutes = require('./Routes/searchRoutes');
const notificationsRouter = require('./Routes/notifications');
const instagramApi = require('./SocialMediaAPI/instagramApi');
const youtubeApi = require('./SocialMediaAPI/youtubeApi');
const authRoutes = require('./Middleware/refreshToken');


dotenv.config();

const app = express();
const server = http.createServer(app);

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const SOCIAL_MEDIA_API_URL = process.env.SOCIAL_MEDIA_API_URL || 'https://your-socialmedia-api-domain.com';

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cookieParser());
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'], // Your frontend URL
    credentials: true // Allow credentials (cookies) to be sent and received
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/users', userRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationsRouter);
app.use('/api/refresh-token', authRoutes);


mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000 // Increase timeout to 30s
}
)
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.log('MongoDb connection error', err));

app.get('/', (req, res) => {
    const token = req.cookies.token;  // Check if token exists in cookies
    console.log('Received token:', token);  // Log token to verify it was sent with the request
    res.send('Check the console for token.');
});

app.get('/api/auth/check', (req, res) => {
    console.log('Cookies received:', req.cookies);
    const token = req.cookies.token; // Read token from HttpOnly cookie
    if (!token) {
        return res.json({ isAuthenticated: false });
    }
    return res.json({ isAuthenticated: true });
});

app.get('/auth/callback', instagramApi.callback);
app.get('/auth/redirect', instagramApi.redirect);
app.get('/auth/callbackapp', instagramApi.callback_app1);
app.get('/auth/redirectapp', instagramApi.redirect_app1);
app.get('/auth/youtube', youtubeApi.youtube);
app.get('/auth/youtube/callback', youtubeApi.callback);


const io = socketIo(server, {
    cors: {
        origin: [BASE_URL, SOCIAL_MEDIA_API_URL],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// WebSocket connection
io.on('connection', (socket) => {
    console.log('New client connected', socket.id);

    socket.on("join", (userId) => {
        if (!userId) {
            console.log('No user ID found');
            return;
        }

        console.log('User joined:', userId);
        socket.join(userId.toString());
    });

    socket.on('new_notification', (notification) => {
        console.log('New notification received:', notification);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log('App running on ' + PORT);
});

module.exports = { app, io };