/**
 * Cliente de Criptografia Híbrida para Oblivion RPG
 * Implementa RSA + AES para segurança máxima
 */

class SecureClient {
    constructor() {
        this.publicKey = null;
        this.initialized = false;
    }

    /**
     * Inicializa o cliente com a chave pública do servidor
     */
    async initialize() {
        if (this.initialized) return true;

        try {
            console.log('Inicializando cliente de criptografia...');
            
            // Buscar chave pública do servidor
            const response = await fetch('../backend/crypto_handler.php?action=getPublicKey');
            if (!response.ok) {
                throw new Error('Erro ao obter chave pública do servidor');
            }
            
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Erro ao obter chave pública');
            }

            this.publicKey = data.publicKey;
            this.initialized = true;
            console.log('Cliente de criptografia inicializado com sucesso');
            return true;

        } catch (error) {
            console.error('Erro ao inicializar cliente de criptografia:', error);
            throw error;
        }
    }    /**
     * Gera uma chave AES-256 aleatória
     */
    generateAESKey() {
        // Gerar 32 bytes (256 bits) para AES-256
        return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
    }/**
     * Criptografa dados usando AES-256-CBC (compatível com PHP)
     */
    encryptAES(data, key) {
        try {
            // Converter chave para WordArray se necessário
            const keyWordArray = typeof key === 'string' ? CryptoJS.enc.Utf8.parse(key) : key;
            
            // Gerar IV aleatório
            const iv = CryptoJS.lib.WordArray.random(16);
            
            // Criptografar dados
            const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), keyWordArray, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
            
            // Combinar IV + dados criptografados
            const combined = iv.concat(encrypted.ciphertext);
            
            return CryptoJS.enc.Base64.stringify(combined);
            
        } catch (error) {
            console.error('Erro na criptografia AES:', error);
            throw error;
        }
    }

    /**
     * Criptografa a chave AES usando RSA
     */
    encryptRSA(data) {
        if (!this.publicKey) {
            throw new Error('Chave pública não foi carregada');
        }

        const encrypt = new JSEncrypt();
        encrypt.setPublicKey(this.publicKey);
        return encrypt.encrypt(data);
    }

    /**
     * Criptografa dados usando criptografia híbrida (RSA + AES)
     */
    hybridEncrypt(data) {
        try {
            // 1. Gerar chave AES aleatória
            const aesKey = this.generateAESKey();
            
            // 2. Criptografar dados com AES
            const encryptedData = this.encryptAES(data, aesKey);
            
            // 3. Criptografar chave AES com RSA
            const encryptedKey = this.encryptRSA(aesKey);
            
            if (!encryptedKey) {
                throw new Error('Erro ao criptografar chave AES com RSA');
            }

            return {
                encryptedData: encryptedData,
                encryptedKey: encryptedKey
            };

        } catch (error) {
            console.error('Erro na criptografia híbrida:', error);
            throw error;
        }
    }

    /**
     * Envia dados criptografados para o servidor
     */
    async sendEncryptedData(endpoint, data) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            const encrypted = this.hybridEncrypt(data);
            
            const formData = new FormData();
            formData.append('encrypted_data', encrypted.encryptedData);
            formData.append('encrypted_key', encrypted.encryptedKey);
            formData.append('action', 'decrypt');

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const responseText = await response.text();
            
            // Tentar fazer parse do JSON
            try {
                return JSON.parse(responseText);
            } catch (parseError) {
                // Se não for JSON, assumir que é uma resposta de sucesso (redirecionamento)
                if (responseText.includes('sucesso=1') || response.url.includes('sucesso=1')) {
                    return { success: true, message: 'Operação realizada com sucesso' };
                }
                throw new Error('Resposta inválida do servidor: ' + responseText);
            }

        } catch (error) {
            console.error('Erro ao enviar dados criptografados:', error);
            throw error;
        }
    }

    /**
     * Registra um novo usuário com criptografia
     */
    async registerUser(userData) {
        console.log('Iniciando cadastro com criptografia híbrida...');
        
        try {
            // Adicionar timestamp para evitar replay attacks
            userData.timestamp = Date.now();
            
            const result = await this.sendEncryptedData('../backend/cadastro.php', userData);
            console.log('Cadastro realizado com sucesso:', result);
            return result;

        } catch (error) {
            console.error('Erro no cadastro criptografado:', error);
            throw error;
        }
    }

    /**
     * Faz login com criptografia
     */
    async loginUser(credentials) {
        console.log('Iniciando login com criptografia híbrida...');
        
        try {
            // Adicionar timestamp para evitar replay attacks
            credentials.timestamp = Date.now();
            
            const result = await this.sendEncryptedData('../backend/login.php', credentials);
            console.log('Login realizado com sucesso:', result);
            return result;

        } catch (error) {
            console.error('Erro no login criptografado:', error);
            throw error;
        }
    }
}

// Criar instância global
window.secureClient = new SecureClient();

// Auto-inicializar quando as bibliotecas estiverem carregadas
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que as bibliotecas de crypto estão carregadas
    setTimeout(async () => {
        if (typeof CryptoJS !== 'undefined' && typeof JSEncrypt !== 'undefined') {
            try {
                await window.secureClient.initialize();
                console.log('SecureClient pronto para uso');
            } catch (error) {
                console.warn('Erro ao auto-inicializar SecureClient:', error);
            }
        }
    }, 1500);
});
