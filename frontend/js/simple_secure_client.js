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
        if (this.initialized) return true;        try {
            // Não precisa mais buscar chave do servidor - usando chave fixa
            this.initialized = true;
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
            // Garantir que data é um objeto (não string)
            let dataObj;
            if (typeof data === 'string') {
                try {
                    dataObj = JSON.parse(data);
                } catch (e) {
                    throw new Error('Data deve ser um objeto ou JSON válido');
                }
            } else {
                dataObj = { ...data }; // Clonar para não modificar original
            }
            
            // Adicionar timestamp
            dataObj.timestamp = Date.now();
            
            // Usar chave fixa para compatibilidade (em produção, usar chave do servidor)
            const keyString = 'MySecretKey12345MySecretKey12345'; // 32 caracteres = 256 bits
            const key = CryptoJS.enc.Utf8.parse(keyString);
            const iv = CryptoJS.lib.WordArray.random(16); // 128 bits para CBC
            
            // Criptografar usando AES-256-CBC
            const encrypted = CryptoJS.AES.encrypt(JSON.stringify(dataObj), key, {
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
    }/**
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
    }    /**
     * Registra um novo usuário com criptografia
     */
    async registerUser(userData) {
        try {
            const result = await this.sendEncryptedData('../backend/cadastro.php', userData);
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
        try {
            const result = await this.sendEncryptedData('../backend/login.php', credentials);
            return result;

        } catch (error) {
            console.error('Erro no login criptografado:', error);
            throw error;
        }
    }    /**
     * Salva perfil com criptografia
     */
    async saveProfile(profileData) {
        try {
            const result = await this.sendEncryptedData('../backend/perfil.php?action=salvar', profileData);
            return result;

        } catch (error) {
            console.error('Erro ao salvar perfil criptografado:', error);
            throw error;
        }
    }    /**
     * Cria post com criptografia (apenas texto - imagem continua não criptografada)
     */
    async createPost(postData, imageFile = null) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            // Criar FormData para envio
            const formData = new FormData();
            formData.append('action', 'criarPost');
            
            // Se houver imagem comprimida, adicionar como base64
            if (imageFile && imageFile.base64) {
                // Criar um blob da imagem comprimida
                const byteCharacters = atob(imageFile.base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: imageFile.type || 'image/jpeg' });
                
                // Criar arquivo a partir do blob
                const file = new File([blob], imageFile.name || 'compressed_image.jpg', {
                    type: imageFile.type || 'image/jpeg'
                });
                
                formData.append('imagem', file);
            } else if (imageFile) {
                // Imagem não comprimida (fallback)
                formData.append('imagem', imageFile);
            }
            
            // Criptografar apenas os dados de texto
            const encrypted = this.encrypt(postData);
            formData.append('encrypted_data', encrypted);

            const response = await fetch('../backend/teste_post.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const responseText = await response.text();
            
            // Tentar fazer parse do JSON
            try {
                const jsonResponse = JSON.parse(responseText);
                return jsonResponse;
            } catch (parseError) {
                console.error('Resposta não é JSON válido:', responseText.substring(0, 200));
                throw new Error('Resposta inválida do servidor');
            }

        } catch (error) {
            console.error('Erro ao criar post criptografado:', error);
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
        if (typeof CryptoJS !== 'undefined') {            try {
                await window.simpleSecureClient.initialize();
            } catch (error) {
                console.warn('Erro ao auto-inicializar SimpleSecureClient:', error);
            }
        }
    }, 1500);
});
