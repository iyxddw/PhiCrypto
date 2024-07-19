const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const port = 8080;

// Key and IV
const key = Buffer.from([
    //REMOVED
]);
const iv = Buffer.from([
    //REMOVED
]);

// Password protection
const correctPassword = 'luobo233'; 

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));
app.get('/check-cookie', async (req, res) => {
    try {
        if (req.cookies.auth && await decryptText(req.cookies.auth) === correctPassword) {
            res.json({ valid: true });
        } else {
            res.json({ valid: false });
        }
    } catch (error) {
        res.json({ valid: false });
    }
});

// Routes
app.get('/', (req, res) => {
    try {
        if (req.cookies.auth && decryptText(req.cookies.auth) === correctPassword) {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        } else {
            res.sendFile(path.join(__dirname, 'public', 'password.html'));
        }
    } catch (error) {
        res.sendFile(path.join(__dirname, 'public', 'password.html'));
    }
});

app.post('/check-password', async (req, res) => {
    const { password } = req.body;
    console.log(encodeURIComponent(await encryptText(password)));
    if (password === correctPassword) {
        const encryptedPassword = encodeURIComponent(await encryptText(password));
        res.cookie('auth', encryptedPassword, { maxAge: 36000000 }); // Cookie valid for 10 hour
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});


// encryption
async function encryptText(plainText) {
    let encrypted;
    try {
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        encrypted = cipher.update(plainText, 'utf8', 'base64');
        encrypted += cipher.final('base64');
    } catch (error) {
        // if encryption fails, return "ERROR"
        return "ERROR";
    }
    return encrypted;
}

app.post('/encrypt', async (req, res) => {
    const plainTexts = req.body.text;
    const encryptedTexts = await Promise.all(plainTexts.map(encryptText));
    res.json({ result: encryptedTexts });
    // console.log(encryptedTexts);
});
//decryption
async function decryptText(cipherText) {
    let decodedCipherText;
    try {
        decodedCipherText = decodeURIComponent(cipherText);
    } catch (error) {
        // if decoding fails, return "ERROR"
        return "ERROR";
    }

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted;
    try {
        decrypted = decipher.update(decodedCipherText, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
    } catch (error) {
        // if decryption fails, return "ERROR"
        return "ERROR";
    }
    return decrypted;
}

app.post('/decrypt', async (req, res) => {
    const cipherTexts = req.body.text;
    const decryptedTexts = await Promise.all(cipherTexts.map(decryptText));
    res.json({ result: decryptedTexts });
    // console.log(decryptedTexts);
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});