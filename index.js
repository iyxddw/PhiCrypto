const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const port = 8080;

// Security configurations
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour

// Track login attempts
const loginAttempts = new Map();

// Security middleware
app.use((req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");
    next();
});

// Rate limiting for login attempts
function checkRateLimit(ip) {
    const attempts = loginAttempts.get(ip);
    if (!attempts) return true;
    
    const { count, lastAttempt } = attempts;
    const now = Date.now();
    
    if (now - lastAttempt > LOCKOUT_TIME) {
        loginAttempts.delete(ip);
        return true;
    }
    
    return count < MAX_LOGIN_ATTEMPTS;
}

function recordFailedAttempt(ip) {
    const now = Date.now();
    const attempts = loginAttempts.get(ip);
    
    if (!attempts || now - attempts.lastAttempt > LOCKOUT_TIME) {
        loginAttempts.set(ip, { count: 1, lastAttempt: now });
    } else {
        loginAttempts.set(ip, { count: attempts.count + 1, lastAttempt: now });
    }
}

function clearFailedAttempts(ip) {
    loginAttempts.delete(ip);
}

// Key and IV - For development/testing only
// In production, these should be loaded from environment variables or secure configuration
const key = Buffer.from([
    0x2b, 0x7e, 0x15, 0x16, 0x28, 0xae, 0xd2, 0xa6,
    0xab, 0xf7, 0x15, 0x88, 0x09, 0xcf, 0x4f, 0x3c,
    0x2b, 0x7e, 0x15, 0x16, 0x28, 0xae, 0xd2, 0xa6,
    0xab, 0xf7, 0x15, 0x88, 0x09, 0xcf, 0x4f, 0x3c
]);
const iv = Buffer.from([
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
    0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f
]);

// Password protection - In production, use environment variables
const correctPassword = process.env.PHICRYPTO_PASSWORD || 'luobo233';

// Secure session storage
const activeSessions = new Map();

// Generate secure session token
function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Validate session
async function validateSession(req) {
    try {
        const authCookie = req.cookies.auth;
        if (!authCookie) return false;
        
        const sessionData = await decryptText(authCookie);
        if (!sessionData) return false;
        
        const [token, timestamp] = sessionData.split('|');
        if (!token || !timestamp) return false;
        
        const sessionInfo = activeSessions.get(token);
        if (!sessionInfo) return false;
        
        const now = Date.now();
        if (now - parseInt(timestamp) > SESSION_TIMEOUT) {
            activeSessions.delete(token);
            return false;
        }
        
        // Update last activity
        activeSessions.set(token, { ...sessionInfo, lastActivity: now });
        return true;
    } catch (error) {
        return false;
    }
}

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));
app.get('/check-cookie', async (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    try {
        const isValid = await validateSession(req);
        res.json({ valid: isValid });
    } catch (error) {
        console.error('Session validation error:', error);
        res.json({ valid: false });
    }
});

// Routes
app.get('/', async (req, res) => {
    try {
        const isAuthenticated = await validateSession(req);
        if (isAuthenticated) {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        } else {
            res.sendFile(path.join(__dirname, 'public', 'password.html'));
        }
    } catch (error) {
        console.error('Authentication error:', error);
        res.sendFile(path.join(__dirname, 'public', 'password.html'));
    }
});

app.post('/check-password', async (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const { password } = req.body;
    
    // Input validation
    if (!password || typeof password !== 'string') {
        return res.status(400).json({ success: false, error: 'Invalid password format' });
    }
    
    // Rate limiting check
    if (!checkRateLimit(clientIP)) {
        return res.status(429).json({ 
            success: false, 
            error: 'Too many failed attempts. Please try again later.',
            retryAfter: LOCKOUT_TIME / 1000
        });
    }
    
    // Constant time comparison to prevent timing attacks
    // Pad buffers to ensure same length for timingSafeEqual
    const maxLength = Math.max(password.length, correctPassword.length);
    const userBuffer = Buffer.alloc(maxLength);
    const correctBuffer = Buffer.alloc(maxLength);
    
    userBuffer.write(password);
    correctBuffer.write(correctPassword);
    
    const isValidPassword = crypto.timingSafeEqual(userBuffer, correctBuffer) && 
                           password.length === correctPassword.length;
    
    if (isValidPassword) {
        try {
            const sessionToken = generateSessionToken();
            const timestamp = Date.now().toString();
            const sessionData = `${sessionToken}|${timestamp}`;
            
            // Store session
            activeSessions.set(sessionToken, {
                ip: clientIP,
                createdAt: Date.now(),
                lastActivity: Date.now()
            });
            
            const encryptedSession = await encryptText(sessionData);
            if (encryptedSession === "ERROR") {
                throw new Error('Encryption failed');
            }
            
            res.cookie('auth', encodeURIComponent(encryptedSession), { 
                maxAge: SESSION_TIMEOUT,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
            
            // Clear failed attempts on success
            clearFailedAttempts(clientIP);
            
            res.json({ success: true });
        } catch (error) {
            console.error('Session creation error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    } else {
        recordFailedAttempt(clientIP);
        res.json({ success: false, error: 'Invalid password' });
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

// Decryption function
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

app.post('/encrypt', async (req, res) => {
    // Check authentication
    const isAuthenticated = await validateSession(req);
    if (!isAuthenticated) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
        const { text } = req.body;
        
        // Input validation
        if (!text || !Array.isArray(text)) {
            return res.status(400).json({ error: 'Invalid input format' });
        }
        
        // Limit array size to prevent abuse
        if (text.length > 1000) {
            return res.status(400).json({ error: 'Input array too large' });
        }
        
        const encryptedTexts = await Promise.all(text.map(encryptText));
        res.json({ result: encryptedTexts });
    } catch (error) {
        console.error('Encryption error:', error);
        res.status(500).json({ error: 'Encryption failed' });
    }
});

app.post('/decrypt', async (req, res) => {
    // Check authentication
    const isAuthenticated = await validateSession(req);
    if (!isAuthenticated) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
        const { text } = req.body;
        
        // Input validation
        if (!text || !Array.isArray(text)) {
            return res.status(400).json({ error: 'Invalid input format' });
        }
        
        // Limit array size to prevent abuse
        if (text.length > 1000) {
            return res.status(400).json({ error: 'Input array too large' });
        }
        
        const decryptedTexts = await Promise.all(text.map(decryptText));
        res.json({ result: decryptedTexts });
    } catch (error) {
        console.error('Decryption error:', error);
        res.status(500).json({ error: 'Decryption failed' });
    }
});

// Logout route
app.post('/logout', async (req, res) => {
    try {
        const authCookie = req.cookies.auth;
        if (authCookie) {
            const sessionData = await decryptText(authCookie);
            if (sessionData) {
                const [token] = sessionData.split('|');
                if (token) {
                    activeSessions.delete(token);
                }
            }
        }
        res.clearCookie('auth');
        res.json({ success: true });
    } catch (error) {
        res.clearCookie('auth');
        res.json({ success: true });
    }
});

// Cleanup expired sessions
setInterval(() => {
    const now = Date.now();
    for (const [token, session] of activeSessions.entries()) {
        if (now - session.lastActivity > SESSION_TIMEOUT) {
            activeSessions.delete(token);
        }
    }
}, 5 * 60 * 1000); // Clean up every 5 minutes

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});