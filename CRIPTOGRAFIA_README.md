# Sistema de Criptografia Híbrida do Oblivion RPG

## Visão Geral

O sistema de criptografia do Oblivion RPG implementa uma solução robusta para proteger dados sensíveis durante a transmissão entre o frontend e backend. Utiliza criptografia AES-256-CBC para garantir a confidencialidade e integridade dos dados.

## Arquitetura

### Frontend (JavaScript)
- **Arquivo**: `frontend/js/simple_secure_client.js`
- **Biblioteca**: CryptoJS para implementação AES
- **Funcionalidade**: Criptografia dos dados antes do envio

### Backend (PHP)
- **Arquivo**: `backend/simple_crypto.php`
- **Biblioteca**: OpenSSL nativo do PHP
- **Funcionalidade**: Descriptografia e processamento dos dados

## Fluxo de Funcionamento

### 1. Inicialização
1. O backend gera uma chave secreta de 256 bits (se não existir)
2. A chave é armazenada em `backend/crypto_keys/secret.key`
3. O frontend solicita uma chave derivada via AJAX

### 2. Processo de Criptografia (Frontend)
1. Dados do usuário são coletados do formulário
2. Timestamp é adicionado para prevenir ataques de replay
3. Dados são serializados em JSON
4. IV (Initialization Vector) aleatório de 128 bits é gerado
5. Dados são criptografados usando AES-256-CBC
6. IV + dados criptografados são codificados em Base64

### 3. Transmissão
- Dados criptografados são enviados via POST
- Campo `encrypted_data` contém os dados
- Campo `action=decrypt` identifica requisição criptografada

### 4. Processo de Descriptografia (Backend)
1. Dados Base64 são decodificados
2. IV é extraído dos primeiros 16 bytes
3. Dados restantes são descriptografados usando AES-256-CBC
4. JSON é decodificado e validado
5. Timestamp é verificado (máximo 5 minutos)

## Implementação no Cadastro

### Modificações no Backend (`cadastro.php`)
```php
// Função para processar dados criptografados ou tradicionais
function processarDados() {
    if (isset($_POST['encrypted_data'])) {
        $cryptoHandler = new SimpleCryptoHandler();
        return $cryptoHandler->decrypt($_POST['encrypted_data']);
    }
    return $_POST; // Fallback tradicional
}
```

### Modificações no Frontend (`cadastro.js`)
```javascript
// Envio com criptografia
try {
    response = await simpleSecureClient.registerUser(formData);
} catch (cryptoError) {
    // Fallback para método tradicional
    response = await envioTradicional(formData);
}
```

## Segurança Implementada

### 1. Prevenção de Ataques de Replay
- Timestamp é incluído em todas as mensagens
- Mensagens expiram em 5 minutos
- Validação temporal no backend

### 2. Criptografia Robusta
- AES-256-CBC (Advanced Encryption Standard)
- Chave de 256 bits gerada criptograficamente
- IV único para cada mensagem

### 3. Fallback Gracioso
- Sistema funciona com ou sem criptografia
- Compatibilidade com clientes antigos
- Logging detalhado para debug

## Vantagens

1. **Compatibilidade**: Funciona em todos os navegadores modernos
2. **Performance**: Criptografia simétrica é muito rápida
3. **Simplicidade**: Implementação direta sem dependências complexas
4. **Transparência**: Funcionalidades existentes não são afetadas
5. **Escalabilidade**: Fácil de aplicar a outros endpoints

## Arquivos Modificados

### Backend
- `cadastro.php`: Suporte a dados criptografados
- `simple_crypto.php`: Implementação da criptografia
- `crypto_keys/secret.key`: Chave secreta (gerada automaticamente)

### Frontend
- `cadastro.html`: Remoção da biblioteca JSEncrypt
- `cadastro.js`: Uso do novo cliente de criptografia
- `simple_secure_client.js`: Cliente de criptografia simplificado

## Testes

Execute `php backend/test_simple_crypto.php` para verificar:
- Geração de chaves
- Criptografia/descriptografia
- Validação de timestamp
- Integridade dos dados

## Próximos Passos

1. Aplicar a mesma criptografia ao login
2. Implementar rotação de chaves
3. Adicionar logs de auditoria
4. Expandir para outros formulários

## Considerações de Produção

- **Chaves**: Gerar novas chaves para produção
- **HTTPS**: Sempre usar junto com SSL/TLS
- **Logs**: Implementar logging de segurança
- **Monitoramento**: Alertas para tentativas de replay

---

*Sistema implementado para maximum security com backward compatibility.*
