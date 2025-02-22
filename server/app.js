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
const authRoutes = require('./Middleware/refreshToken');

const userRoutes = require('./Routes/userRoutes');
const feedRoutes = require('./Routes/feedRoutes');
const postRoutes = require('./Routes/postRoutes');
const profileRoutes = require('./Routes/profileRoutes');
const searchRoutes = require('./Routes/searchRoutes');
const notificationsRouter = require('./routes/notifications');
const facebookApi = require('./SocialMediaAPI/facebookApi');
const { use } = require('passport');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }

});

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:3000', // Your frontend URL
    credentials: true // Allow credentials (cookies) to be sent and received
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/users', userRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationsRouter);
app.use('/api/auth', authRoutes);

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.log('MongoDb connection error', err));

app.get('/', (req, res) => {
    const token = req.cookies.token;  // Check if token exists in cookies
    console.log('Received token:', token);  // Log token to verify it was sent with the request
    res.send('Check the console for token.');
});

app.get('/api/auth/check', (req, res) => {
    const token = req.cookies.token; // Read token from HttpOnly cookie
    if (!token) {
        return res.json({ isAuthenticated: false });
    }
    return res.json({ isAuthenticated: true });
});

app.get('/auth/callback', facebookApi.callback);
app.get('/auth/facebook', facebookApi.oAuthFb);

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

// const PORT = process.env.PORT || 5000;
// if (process.env.NODE_ENV !== 'test') {
//     server.listen(PORT, () => {
//         console.log('App running on ' + PORT);
//     });
// }
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log('App running on ' + PORT);
});

module.exports = { app, io };