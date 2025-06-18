/**
 * Cliente de Criptografia Simplificada para Oblivion RPG
 * Usa AES-256-GCM para compatibilidade total
 */

class SimpleSecureClient {
    constructor() {
        this.clientKey = null;
        this.initialized = false;
    }

    /**
     * Inicializa o cliente com a chave do servidor
     */
    async initialize() {
        if (this.initialized) return true;

        try {
            console.log('Inicializando cliente de criptografia...');
            
            // Buscar chave do servidor
            const response = await fetch('../backend/simple_crypto.php?action=getClientKey');
            if (!response.ok) {
                throw new Error('Erro ao obter chave do servidor');
            }
            
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Erro ao obter chave');
            }

            this.clientKey = data.clientKey;
            this.initialized = true;
            console.log('Cliente de criptografia inicializado com sucesso');
            return true;

        } catch (error) {
            console.error('Erro ao inicializar cliente de criptografia:', error);
            throw error;
        }
    }    /**
     * Criptografa dados usando AES-256-CBC
     */
    encrypt(data) {
        try {
            if (!this.clientKey) {
                throw new Error('Cliente não inicializado');
            }

            // Adicionar timestamp
            data.timestamp = Date.now();
            
            // Usar CryptoJS para criptografia simétrica
            const key = CryptoJS.enc.Base64.parse(this.clientKey);
            const iv = CryptoJS.lib.WordArray.random(16); // 128 bits para CBC
            
            // Usar AES-256-CBC
            const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
            
            // Combinar IV + dados criptografados
            const combined = iv.concat(encrypted.ciphertext);
            
            return CryptoJS.enc.Base64.stringify(combined);
            
        } catch (error) {
            console.error('Erro na criptografia:', error);
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
            const encrypted = this.encrypt(data);
            
            const formData = new FormData();
            formData.append('encrypted_data', encrypted);
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
        console.log('Iniciando cadastro com criptografia...');
        
        try {
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
        console.log('Iniciando login com criptografia...');
        
        try {
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
window.simpleSecureClient = new SimpleSecureClient();

// Auto-inicializar quando as bibliotecas estiverem carregadas
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que as bibliotecas de crypto estão carregadas
    setTimeout(async () => {
        if (typeof CryptoJS !== 'undefined') {
            try {
                await window.simpleSecureClient.initialize();
                console.log('SimpleSecureClient pronto para uso');
            } catch (error) {
                console.warn('Erro ao auto-inicializar SimpleSecureClient:', error);
            }
        }
    }, 1500);
});
