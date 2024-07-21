async function encrypt(plaintext) {
    const response = await fetch('/encrypt', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: Array.isArray(plaintext) ? plaintext : [plaintext] }) // 判断 plaintext 是否为数组
    });
    const data = await response.json();
    return data.result;
}
async function decrypt(ciphertext) {
    const response = await fetch('/decrypt', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: Array.isArray(ciphertext) ? ciphertext : [ciphertext] }) // 判断 ciphertext 是否为数组
    });
    const data = await response.json();
    return data.result;
}
document.getElementById('encrypt').addEventListener('click', async () => {
    const plaintext = document.getElementById('plaintext').value;
    const result = await encrypt(plaintext);
    document.getElementById('ciphertext').value = result;
});
document.getElementById('decrypt').addEventListener('click', async () => {
    const ciphertext = document.getElementById('ciphertext').value;
    const result = await decrypt(ciphertext);
    document.getElementById('plaintext').value = result;
});
document.addEventListener('DOMContentLoaded', function () {
    // 检查cookie
    fetch('/check-cookie')
        .then(response => response.json())
        .then(data => {
            if (!data.valid) {
                window.location.href = '/password.html';
            }
        });
    // 处理文件上传
    const uploadForm = document.getElementById('uploadForm');
    uploadForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const fileInput = document.getElementById('file');
        const file = fileInput.files[0];
        if (!file) {
            alert('请选择一个文件');
            return;
        }
        const reader = new FileReader();
        reader.onload = async function (e) {
            let text = e.target.result;
            //处理一些特殊字符
            text = text.replace(/&/g, '&amp;');
            text = text.replace(/><([^>]+)></g, '>$1<');
            text = text.replace(/<([^>]+)>/g, (match, p1) => {
                // 将属性值中的 < 替换为 &lt;
                const newValue = p1.replace(/</g, '&lt;');
                return `<${newValue}>`;
            });
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, 'text/xml');
            const items = Array.from(xmlDoc.getElementsByTagName('string'));
            const keys = [];
            const values = [];
            items.forEach(item => {
                const name = item.getAttribute('name');
                const value = item.textContent;
                keys.push(name);
                values.push(value);
            });
            //检查是否为加密文件
            if (keys.indexOf("bright") != -1) {
                //加密部分
                const keysToRemove = ['unity.player_session_count', 'unity.player_sessionid'];
                const OringinalCountValue = values[keys.indexOf('unity.player_session_count')];
                const OringinalIDValue = values[keys.indexOf('unity.player_sessionid')];
                keysToRemove.forEach(key => {
                    const index = keys.indexOf(key);
                    if (index !== -1) {
                        keys.splice(index, 1);
                        values.splice(index, 1);
                    }
                });
                //加密键和值
                const OringinalKeys = await encrypt(keys);
                const encryptedKeys = OringinalKeys.map(value => encodeURIComponent(value))
                const OringinalValue = await encrypt(values);
                const encryptedValues = OringinalValue.map(value => encodeURIComponent(value))
                //组装为xml喵喵
                let xml = "<?xml version='1.0' encoding='utf-8' standalone='yes' ?>\n<map>\n";
                for (let i = 0; i < keys.length; i++) {
                    xml += `    <string name="${encryptedKeys[i]}">${encryptedValues[i]}</string>\n`;
                }
                xml += `    <string name="unity.player_session_count">${OringinalCountValue}</string>\n    <string name="unity.player_sessionid">${OringinalIDValue}</string>\n`;
                xml += "</map>";
                document.getElementById('ciphertext').value = xml;
            } else {
                // 解密部分
                const keysToRemove = ['unity.player_session_count', 'unity.player_sessionid'];
                const OringinalCountValue = values[keys.indexOf('unity.player_session_count')];
                const OringinalIDValue = values[keys.indexOf('unity.player_sessionid')];
                keysToRemove.forEach(key => {
                    const index = keys.indexOf(key);
                    if (index !== -1) {
                        keys.splice(index, 1);
                        values.splice(index, 1);
                    }
                });
                //解密键和值
                const decryptedKeys = await decrypt(keys);
                const decryptedValues = await decrypt(values);
                // 组装为xml喵喵
                let xml = "<?xml version='1.0' encoding='utf-8' standalone='yes' ?>\n<map>\n";
                for (let i = 0; i < keys.length; i++) {
                    xml += `    <string name="${decryptedKeys[i]}">${decryptedValues[i]}</string>\n`;
                }
                xml +=`    <string name="unity.player_session_count">${OringinalCountValue}</string>\n    <string name="unity.player_sessionid">${OringinalIDValue}</string>\n`;
                xml += "</map>";
                document.getElementById('plaintext').value = xml;
            }
        };
        reader.readAsText(file, 'utf-8');
    });
});
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function clean() {
    document.getElementById('plaintext').value = '';
    document.getElementById('ciphertext').value = '';
};
async function copy(cipherorplain) {
    let textToCopy = '';
    if(cipherorplain =='c'){
        const ciphertext = document.getElementById('ciphertext');
        textToCopy = ciphertext.value;
    }else if(cipherorplain =='p'){
        const plaintext = document.getElementById('plaintext');
        textToCopy = plaintext.value;
    }

    if (navigator.clipboard) {
        //Clipboard API
        try {
            await navigator.clipboard.writeText(textToCopy);
        } catch (err) {
            alert('Failed to copy text: ', err);
        }
    } else if (document.execCommand) {
        //document.execCommand('copy')
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            alert('Failed to copy text: ', err);
        }
        document.body.removeChild(textarea);
    } else {
        alert('Copy not supported on this browser');
    }
}
