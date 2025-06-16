<?php

class CriptografiaHibrida {
    private $chavePrivada;
    private $chavePublica;
    private $chavesClientes = [];

    public function __construct() {
        $this->gerarParChaves();
    }

    // Gera par de chaves RSA
    private function gerarParChaves() {
        $config = [
            "digest_alg" => "sha256",
            "private_key_bits" => 2048,
            "private_key_type" => OPENSSL_KEYTYPE_RSA,
        ];

        $res = openssl_pkey_new($config);
        if (!$res) {
            throw new Exception("Erro ao gerar chaves RSA");
        }

        openssl_pkey_export($res, $this->chavePrivada);

        $details = openssl_pkey_get_details($res);
        $this->chavePublica = $details["key"];
    }

    // Retorna chave pública em formato Base64
    public function getChavePublica() {
        $key = openssl_pkey_get_public($this->chavePublica);
        $details = openssl_pkey_get_details($key);
        return base64_encode($details["key"]);
    }

    // Armazena chave pública do cliente
    public function armazenarChaveCliente($clienteId, $chavePublicaBase64) {
        $this->chavesClientes[$clienteId] = base64_decode($chavePublicaBase64);
    }

    // Criptografa dados usando AES-256-GCM
    public function criptografarSimetrico($dados, $chave, $iv) {
        $dadosJson = json_encode($dados);
        
        $encrypted = openssl_encrypt(
            $dadosJson,
            'aes-256-gcm',
            $chave,
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );

        if ($encrypted === false) {
            throw new Exception("Erro na criptografia simétrica");
        }

        return [
            'dados' => $encrypted,
            'tag' => $tag
        ];
    }

    // Descriptografa dados usando AES-256-GCM
    public function descriptografarSimetrico($dadosCriptografados, $chave, $iv, $tag) {
        $decrypted = openssl_decrypt(
            $dadosCriptografados,
            'aes-256-gcm',
            $chave,
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );

        if ($decrypted === false) {
            throw new Exception("Erro na descriptografia simétrica");
        }

        return json_decode($decrypted, true);
    }

    // Criptografa chave simétrica com RSA
    public function criptografarChaveSimetrica($chaveSimetrica, $clienteId) {
        if (!isset($this->chavesClientes[$clienteId])) {
            throw new Exception("Chave do cliente não encontrada");
        }

        $chavePublicaCliente = $this->chavesClientes[$clienteId];
        
        if (!openssl_public_encrypt($chaveSimetrica, $encrypted, $chavePublicaCliente, OPENSSL_PKCS1_OAEP_PADDING)) {
            throw new Exception("Erro ao criptografar chave simétrica");
        }

        return $encrypted;
    }

    // Descriptografa chave simétrica com RSA
    public function descriptografarChaveSimetrica($chaveCriptografada) {
        if (!openssl_private_decrypt($chaveCriptografada, $decrypted, $this->chavePrivada, OPENSSL_PKCS1_OAEP_PADDING)) {
            throw new Exception("Erro ao descriptografar chave simétrica");
        }

        return $decrypted;
    }

    // Gera chave simétrica aleatória
    public function gerarChaveSimetrica() {
        return random_bytes(32); // 256 bits
    }

    // Gera IV aleatório
    public function gerarIV() {
        return random_bytes(12); // 96 bits para GCM
    }

    // Criptografia híbrida completa
    public function criptografarHibrido($dados, $clienteId) {
        // 1. Gera chave simétrica aleatória
        $chaveSimetrica = $this->gerarChaveSimetrica();

        // 2. Gera IV aleatório
        $iv = $this->gerarIV();

        // 3. Criptografa dados com AES-GCM
        $resultado = $this->criptografarSimetrico($dados, $chaveSimetrica, $iv);

        // 4. Criptografa chave simétrica com RSA
        $chaveCriptografada = $this->criptografarChaveSimetrica($chaveSimetrica, $clienteId);

        return [
            'dados' => base64_encode($resultado['dados']),
            'tag' => base64_encode($resultado['tag']),
            'chave' => base64_encode($chaveCriptografada),
            'iv' => base64_encode($iv)
        ];
    }

    // Descriptografia híbrida completa
    public function descriptografarHibrido($pacote) {
        // 1. Decodifica Base64
        $dadosCriptografados = base64_decode($pacote['dados']);
        $tag = base64_decode($pacote['tag']);
        $chaveCriptografada = base64_decode($pacote['chave']);
        $iv = base64_decode($pacote['iv']);

        // 2. Descriptografa chave simétrica
        $chaveSimetrica = $this->descriptografarChaveSimetrica($chaveCriptografada);

        // 3. Descriptografa dados
        $dados = $this->descriptografarSimetrico($dadosCriptografados, $chaveSimetrica, $iv, $tag);

        return $dados;
    }
}