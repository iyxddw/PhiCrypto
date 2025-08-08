// Enhanced PhiCrypto Frontend Script with Security and UX Improvements

// Toast notification system
function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        padding: 12px 20px;
        margin-bottom: 10px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        min-width: 300px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        animation: slideInRight 0.3s ease-out;
        position: relative;
        cursor: pointer;
    `;
    
    const colors = {
        success: 'linear-gradient(135deg, #48bb78, #38a169)',
        error: 'linear-gradient(135deg, #f56565, #e53e3e)',
        warning: 'linear-gradient(135deg, #ed8936, #d69e2e)',
        info: 'linear-gradient(135deg, #667eea, #5a67d8)'
    };
    
    toast.style.background = colors[type] || colors.info;
    toast.textContent = message;
    
    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 20px;
        cursor: pointer;
        opacity: 0.7;
    `;
    closeBtn.onclick = () => removeToast(toast);
    toast.appendChild(closeBtn);
    
    toastContainer.appendChild(toast);
    
    // Auto remove
    setTimeout(() => removeToast(toast), duration);
    
    // Click to remove
    toast.onclick = () => removeToast(toast);
}

function removeToast(toast) {
    if (toast && toast.parentNode) {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// Add required CSS for toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// API Helper functions with improved error handling
async function encrypt(plaintext) {
    try {
        const response = await fetch('/encrypt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: Array.isArray(plaintext) ? plaintext : [plaintext] })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `Server error: ${response.status}`);
        }
        
        return data.result;
    } catch (error) {
        console.error('Encryption error:', error);
        showToast('Encryption failed: ' + error.message, 'error');
        throw error;
    }
}

async function decrypt(ciphertext) {
    try {
        const response = await fetch('/decrypt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: Array.isArray(ciphertext) ? ciphertext : [ciphertext] })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `Server error: ${response.status}`);
        }
        
        return data.result;
    } catch (error) {
        console.error('Decryption error:', error);
        showToast('Decryption failed: ' + error.message, 'error');
        throw error;
    }
}

// Enhanced UI feedback functions
function setElementState(elementId, state, originalText = '') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const states = {
        loading: { class: 'loading', disabled: true },
        success: { class: 'success', disabled: false },
        error: { class: 'error', disabled: false },
        normal: { class: '', disabled: false }
    };
    
    const currentState = states[state] || states.normal;
    
    // Remove all state classes
    Object.values(states).forEach(s => {
        if (s.class) { // Only remove non-empty class names
            element.classList.remove(s.class);
        }
    });
    
    // Add new state class
    if (currentState.class) {
        element.classList.add(currentState.class);
    }
    
    element.disabled = currentState.disabled;
    
    if (originalText && state !== 'loading') {
        element.textContent = originalText;
    }
    
    // Auto-clear success/error states
    if (state === 'success' || state === 'error') {
        setTimeout(() => setElementState(elementId, 'normal', originalText), 2000);
    }
}

// Enhanced copy functionality
async function copyText(textareaId) {
    const textarea = document.getElementById(textareaId);
    if (!textarea) {
        showToast('Text area not found', 'error');
        return;
    }
    
    const textToCopy = textarea.value.trim();
    
    if (!textToCopy) {
        showToast('No text to copy', 'warning');
        return;
    }
    
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(textToCopy);
        } else {
            // Fallback for older browsers or non-secure contexts
            textarea.select();
            textarea.setSelectionRange(0, 99999); // For mobile devices
            document.execCommand('copy');
            
            // Clear selection
            if (window.getSelection) {
                window.getSelection().removeAllRanges();
            }
        }
        
        showToast('Text copied to clipboard!', 'success');
        setElementState(textareaId, 'success');
    } catch (error) {
        console.error('Copy failed:', error);
        showToast('Failed to copy text', 'error');
    }
}

// Enhanced clear function
function clearAll() {
    const textareas = ['plaintext', 'ciphertext'];
    textareas.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
            setElementState(id, 'normal');
        }
    });
    
    // Clear file input
    const fileInput = document.getElementById('file');
    if (fileInput) {
        fileInput.value = '';
    }
    
    showToast('All fields cleared', 'info');
}

// Logout function
async function logout() {
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            showToast('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } else {
            throw new Error('Logout failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Logout failed', 'error');
    }
}

// Main functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    // Check authentication
    fetch('/check-cookie')
        .then(response => response.json())
        .then(data => {
            if (!data.valid) {
                window.location.href = '/password.html';
            }
        })
        .catch(error => {
            console.error('Auth check failed:', error);
            window.location.href = '/password.html';
        });
    
    // Encrypt button handler
    const encryptBtn = document.getElementById('encrypt');
    encryptBtn?.addEventListener('click', async () => {
        const plaintext = document.getElementById('plaintext').value.trim();
        
        if (!plaintext) {
            showToast('Please enter text to encrypt', 'warning');
            return;
        }
        
        const originalText = encryptBtn.textContent;
        setElementState('encrypt', 'loading');
        
        try {
            const result = await encrypt(plaintext);
            document.getElementById('ciphertext').value = result[0] || '';
            showToast('Text encrypted successfully!', 'success');
            setElementState('encrypt', 'success', originalText);
        } catch (error) {
            setElementState('encrypt', 'error', originalText);
        }
    });
    
    // Decrypt button handler
    const decryptBtn = document.getElementById('decrypt');
    decryptBtn?.addEventListener('click', async () => {
        const ciphertext = document.getElementById('ciphertext').value.trim();
        
        if (!ciphertext) {
            showToast('Please enter text to decrypt', 'warning');
            return;
        }
        
        const originalText = decryptBtn.textContent;
        setElementState('decrypt', 'loading');
        
        try {
            const result = await decrypt(ciphertext);
            document.getElementById('plaintext').value = result[0] || '';
            showToast('Text decrypted successfully!', 'success');
            setElementState('decrypt', 'success', originalText);
        } catch (error) {
            setElementState('decrypt', 'error', originalText);
        }
    });
    
    // Enhanced file upload handler
    const uploadForm = document.getElementById('uploadForm');
    uploadForm?.addEventListener('submit', function (event) {
        event.preventDefault();
        
        const fileInput = document.getElementById('file');
        const file = fileInput.files[0];
        const processBtn = document.getElementById('process-btn');
        
        if (!file) {
            showToast('Please select a file first', 'warning');
            return;
        }
        
        // Validate file type
        const validTypes = ['.xml', '.txt'];
        const fileName = file.name.toLowerCase();
        const isValidType = validTypes.some(type => fileName.endsWith(type));
        
        if (!isValidType) {
            showToast('Please select a valid XML or TXT file', 'error');
            return;
        }
        
        // Check file size (limit to 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showToast('File size too large. Maximum 10MB allowed.', 'error');
            return;
        }
        
        const originalText = processBtn.textContent;
        setElementState('process-btn', 'loading');
        showToast('Processing file...', 'info');
        
        const reader = new FileReader();
        reader.onload = async function (e) {
            try {
                let text = e.target.result;
                
                // Handle special characters
                text = text.replace(/&/g, '&amp;');
                text = text.replace(/><([^>]+)></g, '>$1<');
                text = text.replace(/<([^>]+)>/g, (match, p1) => {
                    const newValue = p1.replace(/</g, '&lt;');
                    return `<${newValue}>`;
                });
                
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, 'text/xml');
                
                // Check for parsing errors
                const parseError = xmlDoc.querySelector('parsererror');
                if (parseError) {
                    throw new Error('Invalid XML format');
                }
                
                const items = Array.from(xmlDoc.getElementsByTagName('string'));
                const keys = [];
                const values = [];
                
                items.forEach(item => {
                    const name = item.getAttribute('name');
                    const value = item.textContent;
                    if (name !== null) {
                        keys.push(name);
                        values.push(value);
                    }
                });
                
                if (keys.length === 0) {
                    throw new Error('No valid string elements found in XML');
                }
                
                // Check if this is an encrypted file (presence of "bright" indicates unencrypted)
                const isEncrypted = keys.indexOf("bright") === -1;
                
                if (isEncrypted) {
                    // Decrypt the file
                    const keysToRemove = ['unity.player_session_count', 'unity.player_sessionid'];
                    const originalCountValue = values[keys.indexOf('unity.player_session_count')] || '';
                    const originalIDValue = values[keys.indexOf('unity.player_sessionid')] || '';
                    
                    // Remove special keys
                    keysToRemove.forEach(key => {
                        const index = keys.indexOf(key);
                        if (index !== -1) {
                            keys.splice(index, 1);
                            values.splice(index, 1);
                        }
                    });
                    
                    const decryptedKeys = await decrypt(keys);
                    const decryptedValues = await decrypt(values);
                    
                    // Build decrypted XML
                    let xml = "<?xml version='1.0' encoding='utf-8' standalone='yes' ?>\n<map>\n";
                    for (let i = 0; i < decryptedKeys.length; i++) {
                        xml += `    <string name="${decryptedKeys[i]}">${decryptedValues[i]}</string>\n`;
                    }
                    xml += `    <string name="unity.player_session_count">${originalCountValue}</string>\n`;
                    xml += `    <string name="unity.player_sessionid">${originalIDValue}</string>\n`;
                    xml += "</map>";
                    
                    document.getElementById('plaintext').value = xml;
                    showToast('File decrypted successfully!', 'success');
                } else {
                    // Encrypt the file
                    const keysToRemove = ['unity.player_session_count', 'unity.player_sessionid'];
                    const originalCountValue = values[keys.indexOf('unity.player_session_count')] || '';
                    const originalIDValue = values[keys.indexOf('unity.player_sessionid')] || '';
                    
                    // Remove special keys
                    keysToRemove.forEach(key => {
                        const index = keys.indexOf(key);
                        if (index !== -1) {
                            keys.splice(index, 1);
                            values.splice(index, 1);
                        }
                    });
                    
                    const encryptedKeys = await encrypt(keys);
                    const encryptedKeysEncoded = encryptedKeys.map(value => encodeURIComponent(value));
                    const encryptedValues = await encrypt(values);
                    const encryptedValuesEncoded = encryptedValues.map(value => encodeURIComponent(value));
                    
                    // Build encrypted XML
                    let xml = "<?xml version='1.0' encoding='utf-8' standalone='yes' ?>\n<map>\n";
                    for (let i = 0; i < encryptedKeysEncoded.length; i++) {
                        xml += `    <string name="${encryptedKeysEncoded[i]}">${encryptedValuesEncoded[i]}</string>\n`;
                    }
                    xml += `    <string name="unity.player_session_count">${originalCountValue}</string>\n`;
                    xml += `    <string name="unity.player_sessionid">${originalIDValue}</string>\n`;
                    xml += "</map>";
                    
                    document.getElementById('ciphertext').value = xml;
                    showToast('File encrypted successfully!', 'success');
                }
                
                setElementState('process-btn', 'success', originalText);
            } catch (error) {
                console.error('File processing error:', error);
                showToast('File processing failed: ' + error.message, 'error');
                setElementState('process-btn', 'error', originalText);
            }
        };
        
        reader.onerror = function() {
            showToast('Failed to read file', 'error');
            setElementState('process-btn', 'error', originalText);
        };
        
        reader.readAsText(file, 'utf-8');
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        // Ctrl/Cmd + Enter to encrypt
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            if (event.shiftKey) {
                decryptBtn?.click();
            } else {
                encryptBtn?.click();
            }
        }
        
        // Ctrl/Cmd + L to clear
        if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
            event.preventDefault();
            clearAll();
        }
    });
    
    // Add keyboard shortcut hints
    const hints = document.createElement('div');
    hints.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(45, 55, 72, 0.9);
        color: white;
        padding: 10px;
        border-radius: 8px;
        font-size: 0.8rem;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        z-index: 1000;
    `;
    hints.innerHTML = `
        <strong>Keyboard Shortcuts:</strong><br>
        Ctrl+Enter: Encrypt | Ctrl+Shift+Enter: Decrypt | Ctrl+L: Clear
    `;
    document.body.appendChild(hints);
    
    showToast('Welcome to PhiCrypto! Ready to process Phigros save files.', 'success', 4000);
});
