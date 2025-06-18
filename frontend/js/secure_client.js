class SecureClient {
    constructor() {
        this.rsaPublicKey = '';
        this.init();
    }
    
    async init() {
        await this.fetchPublicKey();
    }
    
    async fetchPublicKey() {
        try {
            const response = await fetch('../api/publicKey.php');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.rsaPublicKey = await response.text();
            console.log('Chave Pública RSA obtida');
            return this.rsaPublicKey;
        } catch (error) {
            console.error('Erro ao obter a chave pública:', error);
            throw error;
        }
    }
    
    generateAesKey() {
        const key = CryptoJS.lib.WordArray.random(32); // 256 bits
        const iv = CryptoJS.lib.WordArray.random(16);  // 128 bits
        
        return {
            key: key.toString(CryptoJS.enc.Base64),
            iv: iv.toString(CryptoJS.enc.Hex)
        };
    }
    
    encryptMessageAes(message, aesKeyBase64, aesIvHex) {
        const aesKey = CryptoJS.enc.Base64.parse(aesKeyBase64);
        const aesIv = CryptoJS.enc.Hex.parse(aesIvHex);
        
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(message), aesKey, {
            iv: aesIv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        
        return encrypted.toString();
    }
    
    decryptMessageAes(encryptedMessage, aesKeyBase64, aesIvHex) {
        const aesKey = CryptoJS.enc.Base64.parse(aesKeyBase64);
        const aesIv = CryptoJS.enc.Hex.parse(aesIvHex);
        
        const decrypted = CryptoJS.AES.decrypt(encryptedMessage, aesKey, {
            iv: aesIv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        
        return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
    }
    
    encryptAesKeyWithRsa(aesKeyBase64) {
        const encrypt = new JSEncrypt();
        encrypt.setPublicKey(this.rsaPublicKey);
        
        const encryptedAesKey = encrypt.encrypt(aesKeyBase64);
        if (!encryptedAesKey) {
            throw new Error("Falha ao criptografar a chave AES com RSA");
        }
        return encryptedAesKey;
    }
    
    async sendSecureData(action, data) {
        if (!this.rsaPublicKey) {
            await this.fetchPublicKey();
        }
        
        const aesPair = this.generateAesKey();
        const encryptedMessage = this.encryptMessageAes(data, aesPair.key, aesPair.iv);
        const encryptedAesKey = this.encryptAesKeyWithRsa(aesPair.key);
        
        try {
            const response = await fetch('../api/secure_endpoint.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: action,
                    encryptedMessage: encryptedMessage,
                    encryptedAesKey: encryptedAesKey,
                    aesIv: aesPair.iv
                }),
            });
            
            const result = await response.json();
            
            // Se a resposta contém dados criptografados, descriptografar
            if (result.success && result.encryptedData) {
                const decryptedData = this.decryptMessageAes(
                    result.encryptedData,
                    aesPair.key,
                    result.iv
                );
                result.data = decryptedData;
            }
            
            return result;
            
        } catch (error) {
            console.error('Erro ao enviar dados criptografados:', error);
            throw error;
        }
    }
    
    // Métodos específicos para seu sistema
    async registerUser(userData) {
        return await this.sendSecureData('save_encrypted_user', userData);
    }
    
    async getUser(email) {
        return await this.sendSecureData('get_user', { email: email });
    }
    
    async saveCharacter(characterData) {
        return await this.sendSecureData('save_encrypted_character', characterData);
    }
    
    async saveMessage(messageData) {
        return await this.sendSecureData('save_encrypted_message', messageData);
    }
    
    async getMessages(partyId) {
        return await this.sendSecureData('get_encrypted_messages', { id_party: partyId });
    }
    
    // Método para teste de criptografia
    async testEncryption(testData) {
        return await this.sendSecureData('decrypt_message', testData);
    }
}

// Instância global
const secureClient = new SecureClient();
