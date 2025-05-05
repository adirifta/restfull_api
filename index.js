const express = require('express');
const path = require('path');
const articleRoutes = require('./routes/articleRouter');
const userRoutes = require('./routes/userRouter');
const commentRoutes = require('./routes/commentRouter');
const authRoutes = require('./routes/authRouter');
const fileUpload = require('express-fileupload');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());    
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use('/api/images', express.static(path.join(__dirname, 'public/images')));
app.use('/api/avatars', express.static(path.join(__dirname, 'public/avatars')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', articleRoutes);
app.use('/api', userRoutes);
app.use('/api', commentRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});