# PhiCrypto

PhiCrypto is a **secure web application** designed to encrypt and decrypt save files for the game Phigros, built with modern security practices and an enhanced user interface.

![Password Interface](https://github.com/user-attachments/assets/c0f4f076-3a44-4cd4-b074-d60615b80522)

![Main Interface](https://github.com/user-attachments/assets/26b965e1-b362-47c1-adb9-92082e1786a1)

## ✨ Features

### 🔐 Security Enhancements
- **Secure Authentication**: Enhanced session management with proper timeouts
- **Rate Limiting**: Protection against brute force attacks (5 attempts per 15 minutes)
- **Security Headers**: CSP, XSS protection, and other security headers
- **Timing Attack Protection**: Constant-time password comparison
- **Input Validation**: Comprehensive validation and sanitization
- **Session Security**: Secure cookies with HttpOnly and SameSite flags

### 🎨 UI/UX Improvements
- **Modern Design**: Beautiful gradient backgrounds and animations
- **Responsive Layout**: Optimized for all device sizes
- **Interactive Feedback**: Toast notifications and visual state indicators
- **Keyboard Shortcuts**: Ctrl+Enter (encrypt), Ctrl+Shift+Enter (decrypt), Ctrl+L (clear)
- **Enhanced Accessibility**: Better contrast, focus indicators, and screen reader support
- **Loading States**: Visual feedback during operations

### 🚀 Functionality
- **File Processing**: Automatic detection of encrypted/unencrypted Phigros save files
- **Bulk Operations**: Process multiple text strings simultaneously
- **Error Handling**: Comprehensive error messages and recovery
- **Copy to Clipboard**: One-click copying of results
- **File Validation**: Type and size validation for uploads

## 🛡️ Security Measures

This version includes several security improvements to prevent unauthorized access:

- **Authentication bypass protection**: Robust session validation
- **CSRF protection**: Secure headers and validation
- **Rate limiting**: Prevents brute force attacks
- **Input sanitization**: Prevents injection attacks
- **Secure session management**: Proper token generation and validation

## 📋 Requirements

- **Node.js**: Version 14.0.0 or higher
- **Dependencies**: Express, body-parser, cookie-parser

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PhiCrypto
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure encryption keys** (Important!)
   
   For production use, you MUST provide your own encryption keys. Edit `index.js` and replace the demo keys:
   ```javascript
   // Replace these with your own secure keys
   const key = Buffer.from([/* your 32-byte key */]);
   const iv = Buffer.from([/* your 16-byte IV */]);
   ```

4. **Configure password** (Optional)
   
   Set a custom password via environment variable:
   ```bash
   export PHICRYPTO_PASSWORD="your-secure-password"
   ```
   Or modify the default in `index.js`.

5. **Start the application**
   ```bash
   npm start
   ```

6. **Access the application**
   ```
   http://localhost:8080/
   ```

## 🎮 Usage

1. **Authentication**: Enter the password (default: `luobo233`)
2. **Text Encryption/Decryption**: 
   - Enter text in either textarea
   - Click Encrypt/Decrypt buttons or use keyboard shortcuts
3. **File Processing**: 
   - Upload XML save files using the file upload area
   - The application automatically detects if the file is encrypted or not
4. **Copy Results**: Click on textarea labels to copy content to clipboard

## ⌨️ Keyboard Shortcuts

- `Ctrl + Enter`: Encrypt text
- `Ctrl + Shift + Enter`: Decrypt text  
- `Ctrl + L`: Clear all fields

## 🧪 Testing

Run the included security tests:
```bash
./test-security.sh
```

## 🔧 Configuration

### Environment Variables
- `PHICRYPTO_PASSWORD`: Custom password (default: `luobo233`)
- `NODE_ENV`: Set to `production` for secure cookies

### Security Settings
- **Session timeout**: 1 hour
- **Rate limit**: 5 attempts per 15 minutes
- **Max file size**: 10MB
- **Supported formats**: XML, TXT

## 📖 API Endpoints

- `GET /` - Main application (requires authentication)
- `POST /check-password` - Authentication endpoint
- `POST /encrypt` - Encrypt text (requires authentication)
- `POST /decrypt` - Decrypt text (requires authentication)
- `POST /logout` - Logout and clear session
- `GET /check-cookie` - Validate current session

## 🤝 Contributing

Contributions are welcome! Please ensure all security measures are maintained when making changes.

## 🙏 Acknowledgments

- [PhigrosLibrary](https://github.com/7aGiven/PhigrosLibrary) by [@7aGiven](https://github.com/7aGiven)
- Original PhiCrypto concept by luobo233

## 📞 Contact

- **QQ Group**: Developer: 855374626; Chat: 736770364
- **Discord**: [Join Here](https://discord.gg/phigros-and-rhythm-gaming-1039084623260569631)

## ⚖️ License

MIT License - See LICENSE file for details.
