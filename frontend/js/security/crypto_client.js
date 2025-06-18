/**
 * OBLIVION RPG - CRYPTO CLIENT
 * Cliente de Criptografia Híbrida Ponta-a-Ponta
 * 
 * Funcionalidades:
 * - Implementação Web Crypto API
 * - Geração de chaves do lado cliente
 * - Interface unificada para criptografia
 * - Fallbacks para compatibilidade
 * 
 * @version 1.0
 * @author Oblivion Security Team
 */

class CryptoClient {
    // Configurações
    static RSA_KEY_SIZE = 4096;
    static AES_KEY_SIZE = 256;
    static IV_SIZE = 16;
    static TAG_SIZE = 16;
    
    // Estado interno
    static isInitialized = false;
    static serverPublicKey = null;
    static sessionKey = null;
    static keyId = null;
    
    /**
     * Inicializa o cliente de criptografia
     * @param {Object} options - Opções de configuração
     * @returns {Promise<boolean>} - True se inicializado com sucesso
     */
    static async initialize(options = {}) {
        try {
            // Verifica suporte ao Web Crypto API
            if (!window.crypto || !window.crypto.subtle) {
                throw new Error('Web Crypto API não suportada neste navegador');
            }
            
            // Configurações padrão
            const config = {
                autoHandshake: true,
                baseUrl: '../backend/security/session_crypto.php',
                ...options
            };
            
            this.baseUrl = config.baseUrl;
            
            // Executa handshake automático se habilitado
            if (config.autoHandshake) {
                await this.performHandshake();
            }
            
            this.isInitialized = true;
            console.log('CryptoClient inicializado com sucesso');
            
            return true;
            
        } catch (error) {
            console.error('Erro ao inicializar CryptoClient:', error);
            return false;
        }
    }
    
    /**
     * Executa handshake completo com o servidor
     * @returns {Promise<boolean>} - True se handshake bem-sucedido
     */
    static async performHandshake() {
        try {
            console.log('Iniciando handshake de criptografia...');
            
            // 1. Solicita chave pública do servidor
            const publicKeyResponse = await fetch(`${this.baseUrl}?crypto_action=get_public_key`);
            const publicKeyData = await publicKeyResponse.json();
            
            if (publicKeyData.status !== 'success') {
                throw new Error('Falha ao obter chave pública: ' + publicKeyData.message);
            }
            
            this.serverPublicKey = publicKeyData.public_key;
            
            // 2. Gera chave simétrica AES
            this.sessionKey = await this.generateAESKey();
            
            // 3. Criptografa chave simétrica com RSA público do servidor
            const encryptedKey = await this.encryptWithRSA(this.sessionKey, this.serverPublicKey);
            
            // 4. Envia chave criptografada para o servidor
            const keyExchangeResponse = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `crypto_action=exchange_key&encrypted_key=${encodeURIComponent(encryptedKey)}`
            });
            
            const keyExchangeData = await keyExchangeResponse.json();
            
            // 5. Verifica resposta criptografada do servidor
            if (keyExchangeData.encrypted_response) {
                const decryptedResponse = await this.decryptData(keyExchangeData.encrypted_response);
                
                if (decryptedResponse && decryptedResponse.status === 'key_exchange_success') {
                    this.keyId = decryptedResponse.keyId;
                    console.log('Handshake concluído com sucesso. KeyID:', this.keyId);
                    return true;
                } else {
                    throw new Error('Resposta de troca de chaves inválida');
                }
            } else {
                throw new Error('Resposta de troca de chaves não criptografada');
            }
            
        } catch (error) {
            console.error('Erro no handshake:', error);
            return false;
        }
    }
    
    /**
     * Gera chave AES-256 usando Web Crypto API
     * @returns {Promise<CryptoKey>} - Chave AES gerada
     */
    static async generateAESKey() {
        return await window.crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: this.AES_KEY_SIZE
            },
            true, // Extraível
            ['encrypt', 'decrypt']
        );
    }
    
    /**
     * Exporta chave AES para formato raw
     * @param {CryptoKey} key - Chave AES
     * @returns {Promise<ArrayBuffer>} - Chave em formato raw
     */
    static async exportAESKey(key) {
        return await window.crypto.subtle.exportKey('raw', key);
    }
    
    /**
     * Importa chave AES de formato raw
     * @param {ArrayBuffer} keyData - Dados da chave
     * @returns {Promise<CryptoKey>} - Chave AES importada
     */
    static async importAESKey(keyData) {
        return await window.crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );
    }
    
    /**
     * Criptografa dados com RSA (chave pública do servidor)
     * @param {CryptoKey} aesKey - Chave AES a ser criptografada
     * @param {string} publicKeyPem - Chave pública RSA em formato PEM (base64)
     * @returns {Promise<string>} - Dados criptografados em base64
     */
    static async encryptWithRSA(aesKey, publicKeyPem) {
        try {
            // Converte chave pública PEM para formato binário
            const publicKeyBinary = atob(publicKeyPem);
            const publicKeyArray = new Uint8Array(publicKeyBinary.length);
            for (let i = 0; i < publicKeyBinary.length; i++) {
                publicKeyArray[i] = publicKeyBinary.charCodeAt(i);
            }
            
            // Importa chave pública RSA
            const rsaKey = await window.crypto.subtle.importKey(
                'spki',
                publicKeyArray,
                {
                    name: 'RSA-OAEP',
                    hash: 'SHA-256'
                },
                false,
                ['encrypt']
            );
            
            // Exporta chave AES para raw
            const aesKeyRaw = await this.exportAESKey(aesKey);
            
            // Criptografa chave AES com RSA
            const encrypted = await window.crypto.subtle.encrypt(
                { name: 'RSA-OAEP' },
                rsaKey,
                aesKeyRaw
            );
            
            // Converte para base64
            return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
            
        } catch (error) {
            console.error('Erro ao criptografar com RSA:', error);
            throw error;
        }
    }
    
    /**
     * Criptografa dados com AES-GCM
     * @param {*} data - Dados a serem criptografados
     * @returns {Promise<Object>} - Objeto com dados criptografados
     */
    static async encryptData(data) {
        try {
            if (!this.sessionKey) {
                throw new Error('Chave de sessão não estabelecida');
            }
            
            // Serializa dados se necessário
            const jsonData = typeof data === 'string' ? data : JSON.stringify(data);
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(jsonData);
            
            // Gera IV aleatório
            const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_SIZE));
            
            // Adiciona timestamp para prevenir replay attacks
            const timestamp = Date.now();
            const payload = JSON.stringify({
                data: jsonData,
                timestamp: timestamp
            });
            
            const payloadBuffer = encoder.encode(payload);
            
            // Criptografa dados
            const encrypted = await window.crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv,
                    tagLength: this.TAG_SIZE * 8 // Em bits
                },
                this.sessionKey,
                payloadBuffer
            );
            
            // Separa dados criptografados e tag de autenticação
            const encryptedArray = new Uint8Array(encrypted);
            const dataLength = encryptedArray.length - this.TAG_SIZE;
            const encryptedData = encryptedArray.slice(0, dataLength);
            const tag = encryptedArray.slice(dataLength);
            
            return {
                data: btoa(String.fromCharCode(...encryptedData)),
                iv: btoa(String.fromCharCode(...iv)),
                tag: btoa(String.fromCharCode(...tag)),
                method: 'aes-256-gcm'
            };
            
        } catch (error) {
            console.error('Erro ao criptografar dados:', error);
            throw error;
        }
    }
    
    /**
     * Descriptografa dados com AES-GCM
     * @param {Object} encryptedData - Dados criptografados
     * @returns {Promise<*>} - Dados descriptografados
     */
    static async decryptData(encryptedData) {
        try {
            if (!this.sessionKey) {
                throw new Error('Chave de sessão não estabelecida');
            }
            
            if (!encryptedData.data || !encryptedData.iv || !encryptedData.tag) {
                throw new Error('Dados criptografados incompletos');
            }
            
            // Decodifica componentes
            const data = new Uint8Array(atob(encryptedData.data).split('').map(c => c.charCodeAt(0)));
            const iv = new Uint8Array(atob(encryptedData.iv).split('').map(c => c.charCodeAt(0)));
            const tag = new Uint8Array(atob(encryptedData.tag).split('').map(c => c.charCodeAt(0)));
            
            // Combina dados + tag para Web Crypto API
            const combinedData = new Uint8Array(data.length + tag.length);
            combinedData.set(data);
            combinedData.set(tag, data.length);
            
            // Descriptografa
            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv,
                    tagLength: this.TAG_SIZE * 8
                },
                this.sessionKey,
                combinedData
            );
            
            // Decodifica resultado
            const decoder = new TextDecoder();
            const decryptedText = decoder.decode(decrypted);
            
            // Parse do payload com timestamp
            const payload = JSON.parse(decryptedText);
            
            // Verifica timestamp (máximo 5 minutos)
            const age = Date.now() - payload.timestamp;
            if (age > 300000) { // 5 minutos
                throw new Error(`Dados expirados (idade: ${age}ms)`);
            }
            
            // Retorna dados decodificados
            const finalData = payload.data;
            try {
                return JSON.parse(finalData);
            } catch {
                return finalData; // Retorna string se não for JSON
            }
            
        } catch (error) {
            console.error('Erro ao descriptografar dados:', error);
            throw error;
        }
    }
    
    /**
     * Prepara dados para envio criptografado
     * @param {*} data - Dados a serem enviados
     * @returns {Promise<Object>} - Dados prontos para envio
     */
    static async prepareEncryptedData(data) {
        try {
            const encryptedData = await this.encryptData(data);
            return {
                encrypted_data: encryptedData,
                key_id: this.keyId
            };
        } catch (error) {
            console.error('Erro ao preparar dados criptografados:', error);
            throw error;
        }
    }
    
    /**
     * Envia requisição criptografada
     * @param {string} url - URL de destino
     * @param {Object} options - Opções da requisição
     * @returns {Promise<*>} - Resposta descriptografada
     */
    static async secureRequest(url, options = {}) {
        try {
            // Prepara dados criptografados se houver body
            if (options.body && typeof options.body === 'object') {
                const encryptedData = await this.prepareEncryptedData(options.body);
                options.body = new URLSearchParams(encryptedData);
                options.headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    ...options.headers
                };
            }
            
            // Envia requisição
            const response = await fetch(url, options);
            const responseData = await response.json();
            
            // Verifica se resposta está criptografada
            if (responseData.encrypted_response) {
                return await this.decryptData(responseData.encrypted_response);
            }
            
            return responseData;
            
        } catch (error) {
            console.error('Erro na requisição segura:', error);
            throw error;
        }
    }
    
    /**
     * Verifica se o cliente está pronto para criptografia
     * @returns {boolean} - True se pronto
     */
    static isReady() {
        return this.isInitialized && this.sessionKey && this.keyId;
    }
    
    /**
     * Obtém informações de status do cliente
     * @returns {Object} - Status atual
     */
    static getStatus() {
        return {
            isInitialized: this.isInitialized,
            hasServerPublicKey: !!this.serverPublicKey,
            hasSessionKey: !!this.sessionKey,
            keyId: this.keyId,
            isReady: this.isReady()
        };
    }
    
    /**
     * Força renovação da chave de sessão
     * @returns {Promise<boolean>} - True se renovada com sucesso
     */
    static async renewSessionKey() {
        try {
            console.log('Renovando chave de sessão...');
            this.sessionKey = null;
            this.keyId = null;
            return await this.performHandshake();
        } catch (error) {
            console.error('Erro ao renovar chave:', error);
            return false;
        }
    }
    
    /**
     * Limpa dados sensíveis da memória
     */
    static cleanup() {
        this.sessionKey = null;
        this.keyId = null;
        this.serverPublicKey = null;
        this.isInitialized = false;
        console.log('CryptoClient limpo');
    }
}

// Exporta para uso global
window.CryptoClient = CryptoClient;
