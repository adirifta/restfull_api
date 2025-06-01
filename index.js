require('dotenv').config();
const express = require('express');
const limiter = require('./config/rateLimiter');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const articleRoutes = require('./routes/articleRouter');
const commentRoutes = require('./routes/commentRouter');
const authRoutes = require('./routes/authRouter');
const fileUpload = require('express-fileupload');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');


const app = express();
// Middleware
app.use(helmet());
app.use(cors());
app.use(limiter);
app.use(express.json());    
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());


app.use('/api/images', express.static(path.join(__dirname, 'public/images')));
app.use('/api/avatars', express.static(path.join(__dirname, 'public/avatars')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', articleRoutes);
app.use('/api/v1', require('./routes/v1/userRouter'));
app.use('/api/v2', require('./routes/v2/userRouter'));
app.use('/api', commentRoutes);
app.use('/api/orders', require('./routes/orderRoutes'));

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;