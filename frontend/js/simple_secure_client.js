/**
 * Cliente de Criptografia Simplificada para Oblivion RPG
 * Usa AES-256-GCM para compatibilidade total
 */

class SimpleSecureClient {
    constructor() {
        this.clientKey = null;
        this.initialized = false;
    }    /**
     * Inicializa o cliente (agora apenas marca como inicializado)
     */
    async initialize() {
        if (this.initialized) return true;

        try {
            console.log('Inicializando cliente de criptografia...');
            
            // Não precisa mais buscar chave do servidor - usando chave fixa
            this.initialized = true;
            console.log('Cliente de criptografia inicializado com sucesso');
            return true;

        } catch (error) {
            console.error('Erro ao inicializar cliente de criptografia:', error);
            throw error;
        }
    }/**
     * Criptografa dados usando AES-256-CBC
     */
    encrypt(data) {
        try {
            // Adicionar timestamp
            data.timestamp = Date.now();
            
            // Usar chave fixa para compatibilidade (em produção, usar chave do servidor)
            const keyString = 'MySecretKey12345MySecretKey12345'; // 32 caracteres = 256 bits
            const key = CryptoJS.enc.Utf8.parse(keyString);
            const iv = CryptoJS.lib.WordArray.random(16); // 128 bits para CBC
            
            // Criptografar usando AES-256-CBC
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
    }    /**
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
            
            // Primeiro, verificar se é um redirecionamento HTML (sucesso)
            if (responseText.includes('sucesso=1') || response.url.includes('sucesso=1')) {
                return { success: true, message: 'Operação realizada com sucesso' };
            }
            
            // Se contém HTML com erro, extrair a mensagem
            if (responseText.includes('<b>Fatal error</b>') || responseText.includes('Fatal error')) {
                console.error('Erro do servidor:', responseText);
                throw new Error('Erro interno do servidor na criptografia');
            }
            
            // Tentar fazer parse do JSON
            try {
                const jsonResponse = JSON.parse(responseText);
                return jsonResponse;
            } catch (parseError) {
                console.error('Resposta não é JSON válido:', responseText.substring(0, 200));
                throw new Error('Resposta inválida do servidor');
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
