const express = require('express')
require("dotenv").config();
const app = express();
var morgan = require('morgan')
const mongoose = require('mongoose');
const cors = require('cors');
app.use(morgan('dev'))
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'x-www-form-urlencoded, Origin, X-Requested-With, Content-Type, Accept, Authorization, *');
    // res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE')
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Credentials', true);
        return res.status(200).json({})
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'))
//Database Connection
mongoose.connect("mongodb://127.0.0.1:27017/eventdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("Database connected!"))
    .catch(err => console.log("Cannot connect to the database", err));


// app.use('/', (req, res) =>{
//     res.send('Welcome to Event App')
// });
(async function () {
    console.log('---------------------')
    let axios = require('axios');
    let fs = require('fs')
    try {
        let imageResponse = await axios({
            url: 'https://pilot-hunt.s3.amazonaws.com/profiles/983794168.jpg',
            method: 'GET',
            responseType: 'stream'
        })
        imageResponse.data.pipe(fs.createWriteStream('new-img.jpg'))
        // console.log(imageResponse.data)
    } catch (err) {
        console.log(err);
    }
})();


let apiRouter = require('./src/routes/index')
app.use('/api/v1', apiRouter)

//Server Port 
const port = process.env.PORT || 3001
app.listen(port, () => console.log(`listening on port ${port}`));

