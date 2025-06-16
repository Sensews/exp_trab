class SecureFetch {
    constructor() {
        this.initialized = false;
    }

    // Inicializa o sistema de criptografia
    async initialize() {
        if (this.initialized) return;

        try {
            // 1. Gera par de chaves do cliente
            await window.cryptoHibrida.gerarParChaves();

            // 2. Obtém chave pública do servidor
            const serverKeyResponse = await fetch('../backend/troca-chaves.php?action=getServerKey');
            const serverKeyData = await serverKeyResponse.json();
            
            if (!serverKeyData.success) {
                throw new Error('Erro ao obter chave do servidor');
            }

            await window.cryptoHibrida.importarChaveServidor(serverKeyData.publicKey);

            // 3. Envia chave pública do cliente para o servidor
            const clientKey = await window.cryptoHibrida.exportarChavePublica();
            
            const setKeyResponse = await fetch('../backend/troca-chaves.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `action=setClientKey&publicKey=${encodeURIComponent(clientKey)}`
            });

            const setKeyData = await setKeyResponse.json();
            
            if (!setKeyData.success) {
                throw new Error('Erro ao enviar chave para servidor');
            }

            this.initialized = true;
            console.log('✅ Sistema de criptografia híbrida inicializado');

        } catch (error) {
            console.error('❌ Erro na inicialização da criptografia:', error);
            throw error;
        }
    }

    // Fetch seguro com criptografia híbrida
    async securePost(url, data) {
        await this.initialize();

        try {
            // Criptografa os dados
            const pacoteCriptografado = await window.cryptoHibrida.criptografarHibrido(data);

            // Envia dados criptografados
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Encrypted': 'true'
                },
                body: JSON.stringify(pacoteCriptografado)
            });

            // Verifica se a resposta está criptografada
            const isEncrypted = response.headers.get('X-Encrypted') === 'true';
            
            if (isEncrypted) {
                const pacoteResposta = await response.json();
                const dadosDescriptografados = await window.cryptoHibrida.descriptografarHibrido(pacoteResposta);
                return dadosDescriptografados;
            } else {
                // Resposta não criptografada (fallback)
                return await response.json();
            }

        } catch (error) {
            console.error('Erro no fetch seguro:', error);
            throw error;
        }
    }

    // GET seguro (menos comum, mas possível)
    async secureGet(url) {
        await this.initialize();
        
        const response = await fetch(url, {
            headers: {
                'X-Crypto-Ready': 'true'
            }
        });

        const isEncrypted = response.headers.get('X-Encrypted') === 'true';
        
        if (isEncrypted) {
            const pacoteResposta = await response.json();
            return await window.cryptoHibrida.descriptografarHibrido(pacoteResposta);
        } else {
            return await response.json();
        }
    }
}

// Instância global
window.secureFetch = new SecureFetch();