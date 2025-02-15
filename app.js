import express from "express";
import bodyParser from "body-parser";
import pg from 'pg';
import passport from "passport";
import session from "express-session";
import dotenv from "dotenv";
dotenv.config()

const app = express();
const port = 7000;

// configuring database
const db = new pg.Client({
    user: 'postgres',
    host: 'Localhost',
    database: 'Authen-DB',
    password: process.env.PG_PASSWORD,
    port: 5432
});
db.connect();

//Configure session management
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {secure: true}
}));
app.use(passport.initialize());
app.use(passport.session())

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get('/', (req, res)=>{
    res.render('login.ejs');
});

app.get('/register', (req, res)=>{
    res.render('sign_up.ejs')
})

app.listen(port, ()=>{
    console.log(`App runnning on http://localhost:${port} `);
})