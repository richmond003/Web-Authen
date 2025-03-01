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
    email = email.trim();
    const query = `
    SELECT * FROM logins 
    WHERE email = $1`;
    const response = await db.query(query, [email]);
    return response.rows;
}

async function addUser(email, password, fname, lname){
    email = email.trim();
    password = password.trim();
    fname = fname.trim();
    lname = lname.trim();
    const login_query = `
    INSERT INTO logins (email, password)
    VALUES ($1, $2) RETURNING *`;

    const client_query = `
    INSERT INTO clientDATA (fName, lName, clientID)
    VALUES ($1, $2, $3)
    `;
    const login_response = await db.query(login_query, [email, password]);
    const user_id = login_response.rows[0].id;
    await db.query(client_query, [fname, lname, user_id])
    return login_response.rows;
}


// GET route
app.get('/', (req, res)=>{
    res.render('login.ejs');
});

app.get('/login', (req, res)=>{
    res.render('login.ejs');
});

app.get('/register', (req, res)=>{
    if (req.isAuthenticated()){
        res.render("landing.ejs")
    }else{
        res.render('sign_up.ejs')
    }
})

app.get('/main', (req,res)=>{
    // if(req.isAuthenticated()){
    //     res.render('landing.ejs');
    // }else{
    //     res.redirect('/');
    // }
    res.render("landing.ejs");
});

app.get('/auth/google', passport.authenticate('google', {scope: 
    ['profile', 'email']
}));

app.get('/auth/google/authen', passport.authenticate('google', {
    successRedirect: '/main',
    failureRedirect: '/register'
}));


//POST Methods 
app.post('/sign_up', async (req, res)=>{
    const {fname, lname, email, password} = req.body;
    console.log(req.body)
    try{
        const user = await getUser(email);
        console.log(user)
        if(user.length > 0){
            res.redirect('/')
        }else{
            bcrypt.hash(password.trim(), 10, async (err, hash)=>{
                if(err){
                    console.error(err)
                }else{
                    const newUser = await addUser(email, hash, fname, lname);
                    req.login(newUser[0], (err)=>{
                        if(err){
                            console.log(err);
                        }
                        res.redirect('/main')
                    })
                }
            })
        }
    }catch(err){
        console.error(err.message)
    }
    
});

// app.post('/login', passport.authenticate('local',{
//     failureMessage: true,
//     failureRedirect: '/',
//     successRedirect: '/main'}),

//     (req, res)=>{
//         console.log(req.failureMessage)
//     }
// );
app.post('/login', (req, res)=>{
    passport.authenticate('local', function(err, user, info){
        if(err){
            console.log(err);
            return res.status(500).send("Internal server error")
        }
        if(!user){
            console.log(`Authentication Failed: ${info.message}`);
            return res.status(500).render("login.ejs");
        }else{
            req.login(user, (err)=>{
                if(err){
                    console.log(err)
                   
                }else{
                    res.redirect('/');
                }
            });
        }
    })(req, res);
});

app.post('/logout', (req, res)=>{
    req.logout(err=>{
        if (err){
            console.log(err)
        }
        res.redirect('/')
    });
})

//Registering local strategy 
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



//Registering Google Strategy
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
            const newUser = addUser(email, ("Google: "+id), given_name, family_name);
            done(null, newUser[0]);
        }else{
            done(null, user[0]);
        }
    }catch(err){
        console.error(err.message)
    }
}));

passport.serializeUser(function(user, cb){
    cb(null, user);
});

passport.deserializeUser(function(user,cb){
    cb(null, user);
});

//send a 404 page when the url is not defined route method
app.all("*", (req, res)=>{
    res.render("404.ejs");
});


app.listen(port, ()=>{
    console.log(`App runnning on http://localhost:${port} `);
});