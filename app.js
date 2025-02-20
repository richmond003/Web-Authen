import express from "express";
import bodyParser from "body-parser";
import pg from 'pg';
import passport from "passport";
import { Strategy }  from "passport-local";
import session from "express-session";
import env from "dotenv";
import bcrypt from "bcrypt";
import GoogleStrategy from "passport-google-oauth2";
env.config();

const app = express();
const port = 7000;

// configuring database
const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT
});
db.connect();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Configure session management
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    //cookie: {secure: true}
}));
app.use(passport.initialize());
app.use(passport.session());

async function getUser(email){
    const query = `
    SELECT * FROM logins 
    WHERE email = $1`;
    const response = await db.query(query, [email]);
    return response.rows;
}

async function addUser(email, password, fname, lname){
    const login_query = `
    INSERT INTO logins (email, password)
    VALUES ($1, $2) RETURNING *`;

    const client_query = `
    INSERT INTO clientDATA (fName, lName, clientID)
    VALUES ($1, $2, $3)
    `;
    const login_response = await db.query(login_query, [email, password]);
    //console.log(login_response.rows);
    const user_id = login_response.rows[0].id;
    //console.log(user_id);
    const client_response = await db.query(client_query, [fname, lname, user_id])
    return login_response.rows;
}

// GET Methods
app.get('/', (req, res)=>{
    res.render('login.ejs');
});

// app.get('/register', (req, res)=>{
//     res.render('sign_up.ejs');
// });

app.get('/sign-in', (req, res)=>{
    res.render('login.ejs');
});

app.get('/register', (req, res)=>{
    if (req.isAuthenticated()){
        res.render("landing.ejs")
    }else{
        res.render('sign_up.ejs')
    }
})

app.get('/landing_page', (req,res)=>{
    if(req.isAuthenticated()){
        res.render('landing.ejs');
    }else{
        res.redirect('/sigh-in');
    }
});

app.get('/auth/google', passport.authenticate('google', {scope: 
    ['profile', 'email']
}));

app.get('/auth/google/authen', passport.authenticate('google', {
    successRedirect: '/landing',
    failureRedirect: '/register'
}));

/* 
app.get("/auth/google", passport.authenticate("google",{
    scope: ["profile", "email"]
}));

app.get("/auth/google/secrets", passport.authenticate("google",{
    successRedirect: "/secrets",
    failureRedirect: "/login"
}));
*/

//POST Methods 
app.post('/sign_up', async (req, res)=>{
    const {fname, lname, email, password, verpassword} = req.body;
    console.log(req.body)
    try{
        const user = await getUser(email);
        console.log(user)
        if(user.length > 0){
            res.redirect('/')
        }else{
            
            bcrypt.hash(password, 10, async (err, hash)=>{
                if(err){
                    console.error(err)
                }else{
                    console.log(hash)
                    const newUser = await addUser(email, hash, fname, lname);
                    req.login(newUser[0], (err)=>{
                        console.log(err);
                        res.redirect('/landing')
                    })
                }
            })
        }
    }catch(err){
        console.error(err.message)
    }
});

app.post('/login/authen', passport.authenticate('local',{
   successRedirect: '/landing',
   failureRedirect: '/'
}));

// app.post('/login', (req, res)=>{
//     console.log(req.body)
// })

//Registering local strategy for clients
passport.use('local', new Strategy(async function verify(email, password, cb){
    console.log(email);
    console.log(password);
    try{
        const user = await getUser(email);
        console.log(user)
        if(user.length > 0){
            bcrypt.compare(password, user[0].password, function(err, result){
                if(err){
                    cb(err)
                }else{
                    if(result){
                        cb(null, user[0])
                    }else{
                        cb(null, false, {message: "Incorrect Password"})
                    }
                }
            });
        }else{
            cb(null, false, {message: "Incorrect email or password"})
        }
    }catch(err){
        console.error(err)
    }
}));

//Registering Google Strategyn for google users
passport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENTID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:7000/auth/google/authen",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
}, async function(accessToken, refreshToken, profile, done){
    console.log(profile)
    const {email, id, given_name, family_name} = profile;
    try{
        const user = await getUser(email);
        if(user.length === 0){
            const newUser = addUser(email, ("Google "+id), given_name, family_name);
            done(null, newUser[0])
        }else{

        }
    }catch(err){
        console.error(err.message)
    }
}))

passport.serializeUser(function(user, cb){
    cb(null, user);
});

passport.deserializeUser(function(user,cb){
    cb(null, user);
});

app.listen(port, ()=>{
    console.log(`App runnning on http://localhost:${port} `);
});