/**
 * OblivionCrypto - Configuração Global de Criptografia
 * 
 * Carrega automaticamente o sistema de criptografia em todas as páginas
 * Basta incluir este script para ter acesso à criptografia híbrida
 */

class OblivionCrypto {
    static instance = null;
    static cryptoManager = null;
    static isInitialized = false;
    
    static async initialize() {
        if (this.isInitialized) return this.cryptoManager;
        
        try {
            console.log('🔒 Inicializando Oblivion Crypto...');
            
            this.cryptoManager = CryptoManager.getInstance();
            await this.cryptoManager.initialize();
            
            this.isInitialized = true;
            console.log('✅ Oblivion Crypto inicializado com sucesso!');
            
            return this.cryptoManager;
        } catch (error) {
            console.error('❌ Erro ao inicializar Oblivion Crypto:', error);
            throw error;
        }
    }
    
    static async securePost(url, data, options = {}) {
        const crypto = await this.initialize();
        return crypto.securePost(url, data, options);
    }
    
    static async securePostFormData(url, formData, options = {}) {
        const crypto = await this.initialize();
        return crypto.securePostFormData(url, formData, options);
    }
    
    static isEncryptedData(data) {
        return CryptoManager.isEncryptedData(data);
    }
    
    static async decryptResponse(encryptedData) {
        const crypto = await this.initialize();
        return crypto.decryptData(encryptedData);
    }
}

// Auto-inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await OblivionCrypto.initialize();
    } catch (error) {
        console.warn('⚠️ Sistema continuará funcionando sem criptografia');
    }
});

// Exportar para uso global
window.OblivionCrypto = OblivionCrypto;
