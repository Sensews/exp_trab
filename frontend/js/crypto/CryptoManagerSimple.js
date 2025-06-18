/**
 * CryptoManagerSimple - Versão simplificada funcional
 * 
 * Usa apenas AES-256-GCM para simplicidade e compatibilidade
 */

class CryptoManagerSimple {
    static instance = null;
    
    constructor() {
        this.isInitialized = false;
        this.secretKey = null;
    }
    
    static getInstance() {
        if (CryptoManagerSimple.instance === null) {
            CryptoManagerSimple.instance = new CryptoManagerSimple();
        }
        return CryptoManagerSimple.instance;
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            // Gerar chave secreta compartilhada (em produção, seria derivada de uma troca de chaves)
            this.secretKey = await this.generateSharedKey();
            this.isInitialized = true;
            console.log('✅ CryptoManagerSimple inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao inicializar CryptoManagerSimple:', error);
            throw error;
        }
    }
    
    async generateSharedKey() {
        // Por simplicidade, vamos usar uma chave derivada de uma string conhecida
        // Em produção, isso seria feito com ECDH ou similar
        const encoder = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode('oblivion-rpg-secret-key-2025'),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );
        
        return await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode('oblivion-salt'),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }
    
    async encryptData(data) {
        await this.initialize();
        
        try {
            // Converter dados para string JSON
            const message = typeof data === 'string' ? data : JSON.stringify(data);
            const messageBuffer = new TextEncoder().encode(message);
            
            // Gerar IV aleatório
            const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96 bits para GCM
            
            // Criptografar com AES-GCM
            const encryptedBuffer = await window.crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                this.secretKey,
                messageBuffer
            );
            
            return {
                encryptedMessage: this.arrayBufferToBase64(encryptedBuffer),
                iv: this.arrayBufferToHex(iv),
                algorithm: 'AES-GCM'
            };
            
        } catch (error) {
            console.error('❌ Erro ao criptografar dados:', error);
            throw error;
        }
    }
    
    async decryptData(encryptedData) {
        await this.initialize();
        
        try {
            if (!encryptedData.encryptedMessage || !encryptedData.iv) {
                throw new Error('Dados criptografados incompletos');
            }
            
            const encryptedBuffer = this.base64ToArrayBuffer(encryptedData.encryptedMessage);
            const iv = this.hexToArrayBuffer(encryptedData.iv);
            
            // Descriptografar com AES-GCM
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                this.secretKey,
                encryptedBuffer
            );
            
            const message = new TextDecoder().decode(decryptedBuffer);
            
            // Tentar parsear como JSON
            try {
                return JSON.parse(message);
            } catch {
                return message;
            }
            
        } catch (error) {
            console.error('❌ Erro ao descriptografar dados:', error);
            throw error;
        }
    }
    
    // Utilitários
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    
    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const buffer = new ArrayBuffer(binaryString.length);
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return buffer;
    }
    
    arrayBufferToHex(buffer) {
        const bytes = new Uint8Array(buffer);
        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    
    hexToArrayBuffer(hex) {
        const buffer = new ArrayBuffer(hex.length / 2);
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return buffer;
    }
    
    // Métodos de conveniência para manter compatibilidade
    async encrypt(data) {
        return await this.encryptData(data);
    }
    
    async decrypt(encryptedData) {
        return await this.decryptData(encryptedData);
    }

    static isEncryptedData(data) {
        return data && 
               typeof data === 'object' && 
               data.encryptedMessage && 
               data.iv && 
               data.algorithm === 'AES-GCM';
    }
    
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
            console.error('❌ Erro em securePost:', error);
            throw error;
        }
    }
}

// Exportar para uso global
window.CryptoManagerSimple = CryptoManagerSimple;
