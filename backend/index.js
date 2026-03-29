require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
require('./config/passport');
const db = require('./config/db');
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');

const app = express();
const cors = require('cors');

const path = require('path');


app.use(cors({ origin: '*', credentials: true }));


app.use(bodyParser.json());
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`DocShield backend listening on port ${PORT}`));
