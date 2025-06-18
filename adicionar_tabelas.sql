-- =============================================
-- OBLIVION RPG - ADICIONAR TABELAS FALTANTES
-- Script para adicionar apenas as tabelas que não existem
-- =============================================

USE `oblivion`;

-- =============================================
-- TABELA: perfil
-- Perfil público dos usuários dentro do sistema
-- =============================================
CREATE TABLE IF NOT EXISTS `perfil` (
  `id_perfil` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `arroba` varchar(50) NOT NULL UNIQUE,
  `bio` text DEFAULT NULL,
  `local` varchar(100) DEFAULT NULL,
  `aniversario` date DEFAULT NULL,
  `avatar` longtext DEFAULT NULL,
  `banner` longtext DEFAULT NULL,
  `tipo` enum('jogador','mestre') DEFAULT 'jogador',
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_perfil`),
  UNIQUE KEY `arroba` (`arroba`),
  KEY `fk_perfil_usuario` (`id_usuario`),
  CONSTRAINT `fk_perfil_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABELA: party
-- Grupos de jogo criados pelos mestres
-- =============================================
CREATE TABLE IF NOT EXISTS `party` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `senha` varchar(100) NOT NULL,
  `codigo` varchar(10) NOT NULL UNIQUE,
  `id_mestre` int(11) NOT NULL,
  `limite_jogadores` int(11) DEFAULT 5,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `fk_party_mestre` (`id_mestre`),
  CONSTRAINT `fk_party_mestre` FOREIGN KEY (`id_mestre`) REFERENCES `perfil` (`id_perfil`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABELA: party_membros
-- Jogadores membros de uma party
-- =============================================
CREATE TABLE IF NOT EXISTS `party_membros` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_party` int(11) NOT NULL,
  `id_perfil` int(11) NOT NULL,
  `status` enum('ativo','inativo','banido') DEFAULT 'ativo',
  `entrou_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_party_membro` (`id_party`, `id_perfil`),
  KEY `fk_party_membros_party` (`id_party`),
  KEY `fk_party_membros_perfil` (`id_perfil`),
  CONSTRAINT `fk_party_membros_party` FOREIGN KEY (`id_party`) REFERENCES `party` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_party_membros_perfil` FOREIGN KEY (`id_perfil`) REFERENCES `perfil` (`id_perfil`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABELA: party_chat
-- Mensagens do chat da party (criptografadas)
-- =============================================
CREATE TABLE IF NOT EXISTS `party_chat` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_party` int(11) NOT NULL,
  `id_perfil` int(11) NOT NULL,
  `mensagem` text NOT NULL,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_party_chat_party` (`id_party`),
  KEY `fk_party_chat_perfil` (`id_perfil`),
  KEY `idx_party_chat_data` (`id_party`, `criado_em`),
  CONSTRAINT `fk_party_chat_party` FOREIGN KEY (`id_party`) REFERENCES `party` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_party_chat_perfil` FOREIGN KEY (`id_perfil`) REFERENCES `perfil` (`id_perfil`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABELA: posts
-- Posts da comunidade (rede social interna)
-- =============================================
CREATE TABLE IF NOT EXISTS `posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_perfil` int(11) NOT NULL,
  `texto` text NOT NULL,
  `imagem` longtext DEFAULT NULL,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_posts_perfil` (`id_perfil`),
  KEY `idx_posts_data` (`criado_em`),
  CONSTRAINT `fk_posts_perfil` FOREIGN KEY (`id_perfil`) REFERENCES `perfil` (`id_perfil`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABELA: comentarios
-- Comentários nos posts da comunidade
-- =============================================
CREATE TABLE IF NOT EXISTS `comentarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_post` int(11) NOT NULL,
  `id_perfil` int(11) NOT NULL,
  `texto` text NOT NULL,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_comentarios_post` (`id_post`),
  KEY `fk_comentarios_perfil` (`id_perfil`),
  CONSTRAINT `fk_comentarios_post` FOREIGN KEY (`id_post`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comentarios_perfil` FOREIGN KEY (`id_perfil`) REFERENCES `perfil` (`id_perfil`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABELA: curtidas
-- Sistema de curtidas nos posts
-- =============================================
CREATE TABLE IF NOT EXISTS `curtidas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_post` int(11) NOT NULL,
  `id_perfil` int(11) NOT NULL,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_curtida` (`id_post`, `id_perfil`),
  KEY `fk_curtidas_post` (`id_post`),
  KEY `fk_curtidas_perfil` (`id_perfil`),
  CONSTRAINT `fk_curtidas_post` FOREIGN KEY (`id_post`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_curtidas_perfil` FOREIGN KEY (`id_perfil`) REFERENCES `perfil` (`id_perfil`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABELA: personagens
-- Fichas de personagem D&D dos jogadores
-- =============================================
CREATE TABLE IF NOT EXISTS `personagens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_perfil` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `classe` varchar(50) DEFAULT NULL,
  `nivel` int(11) DEFAULT 1,
  `raca` varchar(50) DEFAULT NULL,
  `dados_json` longtext DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_personagens_perfil` (`id_perfil`),
  KEY `idx_personagem_nome` (`nome`),
  CONSTRAINT `fk_personagens_perfil` FOREIGN KEY (`id_perfil`) REFERENCES `perfil` (`id_perfil`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABELA: mapas
-- Mapas criados pelos mestres
-- =============================================
CREATE TABLE IF NOT EXISTS `mapas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_perfil` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_mapas_perfil` (`id_perfil`),
  CONSTRAINT `fk_mapas_perfil` FOREIGN KEY (`id_perfil`) REFERENCES `perfil` (`id_perfil`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABELA: mapa_imagens
-- Imagens de fundo nos mapas
-- =============================================
CREATE TABLE IF NOT EXISTS `mapa_imagens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_mapa` int(11) NOT NULL,
  `url` longtext NOT NULL,
  `posicao_x` double NOT NULL,
  `posicao_y` double NOT NULL,
  `largura` double NOT NULL,
  `altura` double NOT NULL,
  `rotacao` double DEFAULT 0,
  `z_index` int(11) DEFAULT 0,
  `trancada` tinyint(1) DEFAULT 0,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_mapa_imagens_mapa` (`id_mapa`),
  CONSTRAINT `fk_mapa_imagens_mapa` FOREIGN KEY (`id_mapa`) REFERENCES `mapas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABELA: mapa_desenhos
-- Desenhos feitos nos mapas (linhas, formas)
-- =============================================
CREATE TABLE IF NOT EXISTS `mapa_desenhos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_mapa` int(11) NOT NULL,
  `path_data` longtext NOT NULL,
  `cor` varchar(20) NOT NULL,
  `espessura` double NOT NULL,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_mapa_desenhos_mapa` (`id_mapa`),
  CONSTRAINT `fk_mapa_desenhos_mapa` FOREIGN KEY (`id_mapa`) REFERENCES `mapas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABELA: token_biblioteca
-- Biblioteca de tokens/miniaturas dos usuários
-- =============================================
CREATE TABLE IF NOT EXISTS `token_biblioteca` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_perfil` int(11) NOT NULL,
  `url` longtext NOT NULL,
  `nome` varchar(100) NOT NULL,
  `tamanho` int(11) DEFAULT 1,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_token_biblioteca_perfil` (`id_perfil`),
  CONSTRAINT `fk_token_biblioteca_perfil` FOREIGN KEY (`id_perfil`) REFERENCES `perfil` (`id_perfil`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABELA: mapa_tokens
-- Tokens/miniaturas posicionados nos mapas
-- =============================================
CREATE TABLE IF NOT EXISTS `mapa_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_mapa` int(11) NOT NULL,
  `id_token_biblioteca` int(11) DEFAULT NULL,
  `url` longtext NOT NULL,
  `posicao_x` double NOT NULL,
  `posicao_y` double NOT NULL,
  `tamanho` int(11) DEFAULT 1,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_mapa_tokens_mapa` (`id_mapa`),
  KEY `fk_mapa_tokens_biblioteca` (`id_token_biblioteca`),
  CONSTRAINT `fk_mapa_tokens_mapa` FOREIGN KEY (`id_mapa`) REFERENCES `mapas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mapa_tokens_biblioteca` FOREIGN KEY (`id_token_biblioteca`) REFERENCES `token_biblioteca` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABELA: projetos
-- Projetos de anotações dos usuários
-- =============================================
CREATE TABLE IF NOT EXISTS `projetos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_perfil` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_projetos_perfil` (`id_perfil`),
  CONSTRAINT `fk_projetos_perfil` FOREIGN KEY (`id_perfil`) REFERENCES `perfil` (`id_perfil`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABELA: notas
-- Anotações dentro dos projetos
-- =============================================
CREATE TABLE IF NOT EXISTS `notas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_projeto` int(11) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `conteudo` longtext DEFAULT NULL,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_notas_projeto` (`id_projeto`),
  CONSTRAINT `fk_notas_projeto` FOREIGN KEY (`id_projeto`) REFERENCES `projetos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- VERIFICAR SE USUARIOS TEM COLUNAS NECESSÁRIAS
-- =============================================

-- Adicionar colunas que podem estar faltando na tabela usuarios
ALTER TABLE `usuarios` 
ADD COLUMN IF NOT EXISTS `confirmado` tinyint(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS `token_verificacao` varchar(64) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `token_recuperacao` varchar(64) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `data_token_recuperacao` datetime DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS `atualizado_em` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Adicionar índices se não existirem
ALTER TABLE `usuarios` 
ADD INDEX IF NOT EXISTS `idx_email` (`email`),
ADD INDEX IF NOT EXISTS `idx_telefone` (`telefone`),
ADD INDEX IF NOT EXISTS `idx_token_verificacao` (`token_verificacao`),
ADD INDEX IF NOT EXISTS `idx_token_recuperacao` (`token_recuperacao`);

-- =============================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS `idx_party_ativo` ON `party_membros` (`status`, `id_party`);
CREATE INDEX IF NOT EXISTS `idx_chat_recente` ON `party_chat` (`id_party`, `criado_em` DESC);
CREATE INDEX IF NOT EXISTS `idx_posts_recentes` ON `posts` (`criado_em` DESC);
CREATE INDEX IF NOT EXISTS `idx_perfil_tipo` ON `perfil` (`tipo`);

-- =============================================
-- DADOS INICIAIS (OPCIONAL)
-- =============================================

-- Verificar se já existe um perfil administrador
INSERT IGNORE INTO `perfil` (`id_usuario`, `nome`, `arroba`, `bio`, `tipo`) 
SELECT u.id, u.nome, 'admin', 'Administrador do sistema', 'mestre'
FROM `usuarios` u 
WHERE u.email = 'admin@oblivion.com' OR u.nome = 'Administrador'
LIMIT 1;

SELECT 'Banco de dados atualizado com sucesso!' as status;
