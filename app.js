import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 7000;

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