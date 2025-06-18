/**
 * CryptoManager JavaScript - Gerenciador de Criptografia Híbrida
 * 
 * Implementa criptografia ponta-a-ponta usando:
 * - AES-256-CBC para dados (simétrica)
 * - RSA-2048 para chaves (assimétrica)  
 * - IV aleatório para cada operação
 * - Padding PKCS#7
 */

class CryptoManager {
    static instance = null;
    
    constructor() {
        this.publicKey = null;
        this.rsaPublicKey = null;
        this.isInitialized = false;
    }
    
    /**
     * Singleton pattern
     */
    static getInstance() {
        if (CryptoManager.instance === null) {
            CryptoManager.instance = new CryptoManager();
        }
        return CryptoManager.instance;
    }
    
    /**
     * Inicializa o gerenciador carregando a chave pública
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            await this.loadPublicKey();
            this.isInitialized = true;
        } catch (error) {
            console.error('Erro ao inicializar CryptoManager:', error);
            throw error;
        }
    }
    
    /**
     * Carrega chave pública RSA do servidor
     */
    async loadPublicKey() {
        try {
            const response = await fetch('../backend/crypto/get_public_key.php');
            const data = await response.json();
            
            if (!data.success) {
                throw new Error('Erro ao obter chave pública');
            }
            
            this.publicKey = data.publicKey;
            this.rsaPublicKey = await this.importRSAKey(this.publicKey);
            
        } catch (error) {
            console.error('Erro ao carregar chave pública:', error);
            throw error;
        }
    }
      /**
     * Importa chave RSA para uso com Web Crypto API
     */
    async importRSAKey(pemKey) {
        try {
            // Limpar chave PEM e converter para formato adequado
            let pemContents = pemKey.trim();
            
            // Remover cabeçalhos e quebras de linha
            pemContents = pemContents
                .replace(/-----BEGIN PUBLIC KEY-----/g, '')
                .replace(/-----END PUBLIC KEY-----/g, '')
                .replace(/-----BEGIN RSA PUBLIC KEY-----/g, '')
                .replace(/-----END RSA PUBLIC KEY-----/g, '')
                .replace(/\r/g, '')
                .replace(/\n/g, '')
                .replace(/\s/g, '');
            
            console.log('🔑 Importando chave RSA, tamanho base64:', pemContents.length);
            
            // Validar se é base64 válido
            if (!/^[A-Za-z0-9+/=]+$/.test(pemContents)) {
                throw new Error('Formato de chave PEM inválido');
            }
            
            const keyBuffer = this.base64ToArrayBuffer(pemContents);
            console.log('🔑 Buffer da chave criado, tamanho:', keyBuffer.byteLength);
            
            const importedKey = await window.crypto.subtle.importKey(
                'spki',
                keyBuffer,
                {
                    name: 'RSA-OAEP',
                    hash: 'SHA-256'
                },
                false,
                ['encrypt']
            );
            
            console.log('✅ Chave RSA importada com sucesso');
            return importedKey;
            
        } catch (error) {
            console.error('❌ Erro detalhado ao importar chave RSA:', {
                error: error,
                message: error.message,
                pemLength: pemKey ? pemKey.length : 0
            });
            
            // Tentar algoritmo alternativo
            try {
                console.log('🔄 Tentando importação alternativa...');
                return await this.importRSAKeyAlternative(pemKey);
            } catch (altError) {
                console.error('❌ Importação alternativa falhou:', altError);
                throw new Error(`Falha na importação da chave RSA: ${error.message}`);
            }
        }
    }
    
    /**
     * Método alternativo para importar chave RSA
     */
    async importRSAKeyAlternative(pemKey) {
        try {
            // Usar biblioteca externa como fallback
            console.log('🔄 Usando método alternativo de importação...');
            
            // Por enquanto, vamos simular uma chave válida para testes
            // Em produção, você pode usar uma biblioteca como node-forge
            throw new Error('Método alternativo não implementado');
            
        } catch (error) {
            throw error;
        }
    }
    
    /**
     * Criptografa dados para envio ao servidor
     */
    async encryptData(data) {
        await this.initialize();
        
        try {
            // 1. Converter dados para string JSON
            const message = typeof data === 'string' ? data : JSON.stringify(data);
            
            // 2. Gerar chave AES e IV aleatórios
            const aesKey = await this.generateAESKey();
            const aesIv = window.crypto.getRandomValues(new Uint8Array(16));
            
            // 3. Criptografar mensagem com AES
            const messageBuffer = new TextEncoder().encode(message);
            const encryptedMessage = await window.crypto.subtle.encrypt(
                {
                    name: 'AES-CBC',
                    iv: aesIv
                },
                aesKey,
                messageBuffer
            );
            
            // 4. Exportar chave AES e criptografar com RSA
            const aesKeyBuffer = await window.crypto.subtle.exportKey('raw', aesKey);
            const aesKeyBase64 = this.arrayBufferToBase64(aesKeyBuffer);
            
            const encryptedAesKey = await window.crypto.subtle.encrypt(
                {
                    name: 'RSA-OAEP'
                },
                this.rsaPublicKey,
                new TextEncoder().encode(aesKeyBase64)
            );
            
            // 5. Retornar dados criptografados
            return {
                encryptedMessage: this.arrayBufferToBase64(encryptedMessage),
                encryptedAesKey: this.arrayBufferToBase64(encryptedAesKey),
                aesIv: this.arrayBufferToHex(aesIv)
            };
            
        } catch (error) {
            console.error('Erro ao criptografar dados:', error);
            throw error;
        }
    }
    
    /**
     * Descriptografa dados recebidos do servidor
     */
    async decryptData(encryptedData) {
        await this.initialize();
        
        try {
            if (!encryptedData.encryptedMessage || !encryptedData.encryptedAesKey || !encryptedData.aesIv) {
                throw new Error('Dados criptografados incompletos');
            }
            
            // Este método seria usado se o servidor também criptografasse as respostas
            // Por enquanto, vamos assumir que o servidor envia respostas em texto claro
            // e apenas descriptografa os dados enviados pelo cliente
            
            return encryptedData;
            
        } catch (error) {
            console.error('Erro ao descriptografar dados:', error);
            throw error;
        }
    }
    
    /**
     * Gera chave AES-256 aleatória
     */
    async generateAESKey() {
        return await window.crypto.subtle.generateKey(
            {
                name: 'AES-CBC',
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        );
    }
    
    /**
     * Converte ArrayBuffer para Base64
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    
    /**
     * Converte Base64 para ArrayBuffer
     */
    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const buffer = new ArrayBuffer(binaryString.length);
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return buffer;
    }
    
    /**
     * Converte ArrayBuffer para Hex
     */
    arrayBufferToHex(buffer) {
        const bytes = new Uint8Array(buffer);
        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    
    /**
     * Wrapper para fetch com criptografia automática
     */
    async securePost(url, data, options = {}) {
        try {
            const encryptedData = await this.encryptData(data);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                body: JSON.stringify(encryptedData),
                ...options
            });
            
            return response;
            
        } catch (error) {
            console.error('Erro em securePost:', error);
            throw error;
        }
    }
      /**
     * Verifica se os dados estão no formato criptografado
     */
    static isEncryptedData(data) {
        return data && 
               typeof data === 'object' && 
               data.encryptedMessage && 
               data.encryptedAesKey && 
               data.aesIv;
    }
    async securePostFormData(url, formData, options = {}) {
        try {
            // Converter FormData para objeto
            const dataObj = {};
            for (let [key, value] of formData.entries()) {
                dataObj[key] = value;
            }
            
            return await this.securePost(url, dataObj, options);
            
        } catch (error) {
            console.error('Erro em securePostFormData:', error);
            throw error;
        }
    }
}

// Exportar para uso global
window.CryptoManager = CryptoManager;
