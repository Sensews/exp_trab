class CriptografiaHibrida {
    constructor() {
        this.chavePublica = null;
        this.chavePrivada = null;
        this.chaveServidor = null;
    }

    // Gera par de chaves RSA
    async gerarParChaves() {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            true,
            ["encrypt", "decrypt"]
        );

        this.chavePrivada = keyPair.privateKey;
        this.chavePublica = keyPair.publicKey;

        return keyPair;
    }

    // Exporta chave pública para envio ao servidor
    async exportarChavePublica() {
        const exported = await window.crypto.subtle.exportKey(
            "spki",
            this.chavePublica
        );
        return this.arrayBufferToBase64(exported);
    }

    // Importa chave pública do servidor
    async importarChaveServidor(chaveBase64) {
        const keyData = this.base64ToArrayBuffer(chaveBase64);
        this.chaveServidor = await window.crypto.subtle.importKey(
            "spki",
            keyData,
            {
                name: "RSA-OAEP",
                hash: "SHA-256"
            },
            false,
            ["encrypt"]
        );
    }

    // Gera chave simétrica AES aleatória
    async gerarChaveSimetrica() {
        return await window.crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: 256
            },
            true,
            ["encrypt", "decrypt"]
        );
    }

    // Gera IV (Vetor de Inicialização) aleatório
    gerarIV() {
        return window.crypto.getRandomValues(new Uint8Array(12)); // 96 bits para AES-GCM
    }

    // Criptografa dados usando AES-GCM
    async criptografarSimetrico(dados, chave, iv) {
        const encoder = new TextEncoder();
        const dadosBuffer = encoder.encode(JSON.stringify(dados));

        const encrypted = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv,
                tagLength: 128 // 128 bits de autenticação
            },
            chave,
            dadosBuffer
        );

        return encrypted;
    }

    // Descriptografa dados usando AES-GCM
    async descriptografarSimetrico(dadosCriptografados, chave, iv) {
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv,
                tagLength: 128
            },
            chave,
            dadosCriptografados
        );

        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted));
    }

    // Criptografa chave simétrica com RSA
    async criptografarChaveSimetrica(chaveSimetrica) {
        const chaveExportada = await window.crypto.subtle.exportKey("raw", chaveSimetrica);
        
        const encrypted = await window.crypto.subtle.encrypt(
            {
                name: "RSA-OAEP"
            },
            this.chaveServidor,
            chaveExportada
        );

        return encrypted;
    }

    // Descriptografa chave simétrica com RSA
    async descriptografarChaveSimetrica(chaveCriptografada) {
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "RSA-OAEP"
            },
            this.chavePrivada,
            chaveCriptografada
        );

        return await window.crypto.subtle.importKey(
            "raw",
            decrypted,
            {
                name: "AES-GCM",
                length: 256
            },
            false,
            ["encrypt", "decrypt"]
        );
    }

    // Criptografia híbrida completa
    async criptografarHibrido(dados) {
        // 1. Gera chave simétrica aleatória
        const chaveSimetrica = await this.gerarChaveSimetrica();

        // 2. Gera IV aleatório
        const iv = this.gerarIV();

        // 3. Criptografa dados com AES-GCM
        const dadosCriptografados = await this.criptografarSimetrico(dados, chaveSimetrica, iv);

        // 4. Criptografa chave simétrica com RSA
        const chaveCriptografada = await this.criptografarChaveSimetrica(chaveSimetrica);

        return {
            dados: this.arrayBufferToBase64(dadosCriptografados),
            chave: this.arrayBufferToBase64(chaveCriptografada),
            iv: this.arrayBufferToBase64(iv)
        };
    }

    // Descriptografia híbrida completa
    async descriptografarHibrido(pacote) {
        // 1. Converte de Base64
        const dadosCriptografados = this.base64ToArrayBuffer(pacote.dados);
        const chaveCriptografada = this.base64ToArrayBuffer(pacote.chave);
        const iv = this.base64ToArrayBuffer(pacote.iv);

        // 2. Descriptografa chave simétrica
        const chaveSimetrica = await this.descriptografarChaveSimetrica(chaveCriptografada);

        // 3. Descriptografa dados
        const dados = await this.descriptografarSimetrico(dadosCriptografados, chaveSimetrica, iv);

        return dados;
    }

    // Utilitários
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binary = window.atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
}

// Instância global
window.cryptoHibrida = new CriptografiaHibrida();