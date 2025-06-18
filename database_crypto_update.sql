-- Script SQL para adicionar suporte à criptografia híbrida
-- Execute este script no seu banco de dados MySQL 'oblivion'

-- Adicionar colunas para criptografia híbrida na tabela usuarios
ALTER TABLE usuarios 
ADD COLUMN encrypted_data LONGTEXT AFTER senha,
ADD COLUMN aes_key TEXT AFTER encrypted_data,
ADD COLUMN iv_data VARCHAR(32) AFTER aes_key;

-- Adicionar colunas para criptografia híbrida na tabela personagens
ALTER TABLE personagens 
ADD COLUMN encrypted_json LONGTEXT AFTER dados_json,
ADD COLUMN aes_key TEXT AFTER encrypted_json,
ADD COLUMN iv_data VARCHAR(32) AFTER aes_key;

-- Adicionar colunas para criptografia híbrida na tabela party_chat (se existir)
-- Descomente as linhas abaixo se você tiver essa tabela
-- ALTER TABLE party_chat 
-- ADD COLUMN encrypted_message LONGTEXT AFTER mensagem,
-- ADD COLUMN aes_key TEXT AFTER encrypted_message,
-- ADD COLUMN iv_data VARCHAR(32) AFTER aes_key;

-- Adicionar colunas para criptografia híbrida na tabela posts (se existir)
-- Descomente as linhas abaixo se você tiver essa tabela
-- ALTER TABLE posts 
-- ADD COLUMN encrypted_texto LONGTEXT AFTER texto,
-- ADD COLUMN aes_key TEXT AFTER encrypted_texto,
-- ADD COLUMN iv_data VARCHAR(32) AFTER aes_key;

-- Criar índices para performance
CREATE INDEX idx_usuarios_email_hash ON usuarios(email);
CREATE INDEX idx_usuarios_telefone_hash ON usuarios(telefone);

-- Criar tabela para logs de criptografia (opcional, para auditoria)
CREATE TABLE IF NOT EXISTS crypto_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    operation VARCHAR(20) NOT NULL, -- 'encrypt', 'decrypt', 'error'
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Comentário das mudanças
-- Esta estrutura permite:
-- 1. Armazenar dados sensíveis criptografados (encrypted_data/encrypted_json/encrypted_message)
-- 2. Armazenar a chave AES criptografada com RSA (aes_key)
-- 3. Armazenar o IV usado na criptografia AES (iv_data)
-- 4. Manter compatibilidade com dados não criptografados existentes
-- 5. Usar hashes para busca em campos sensíveis (email, telefone)

-- Instruções de uso:
-- 1. Execute este script no seu banco de dados
-- 2. Os dados existentes não serão afetados
-- 3. Novos cadastros usarão criptografia automaticamente
-- 4. O sistema manterá compatibilidade com dados antigos

SHOW TABLES;
DESCRIBE usuarios;
