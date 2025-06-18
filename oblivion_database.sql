-- =============================================
-- BANCO DE DADOS: OBLIVION RPG
-- Sistema completo de RPG online com gerenciamento de usuário,
-- parties, chat, mapas, fichas de personagem e comunidade
-- =============================================

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS `oblivion` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `oblivion`;

-- =============================================
-- TABELA: usuarios
-- Gerencia dados de autenticação dos usuários
-- =============================================
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL UNIQUE,
  `telefone` varchar(15) NOT NULL UNIQUE,
  `senha` varchar(255) NOT NULL,
  `confirmado` tinyint(1) DEFAULT 0,
  `token_verificacao` varchar(64) DEFAULT NULL,
  `token_recuperacao` varchar(64) DEFAULT NULL,
  `data_token_recuperacao` datetime DEFAULT NULL,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email` (`email`),
  INDEX `idx_telefone` (`telefone`),
  INDEX `idx_token_verificacao` (`token_verificacao`),
  INDEX `idx_token_recuperacao` (`token_recuperacao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABELA: perfil
-- Perfil público dos usuários dentro do sistema
-- =============================================
CREATE TABLE `perfil` (
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
CREATE TABLE `party` (
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
CREATE TABLE `party_membros` (
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
CREATE TABLE `party_chat` (
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
CREATE TABLE `posts` (
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
CREATE TABLE `comentarios` (
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
CREATE TABLE `curtidas` (
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
CREATE TABLE `personagens` (
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
CREATE TABLE `mapas` (
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
CREATE TABLE `mapa_imagens` (
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
CREATE TABLE `mapa_desenhos` (
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
CREATE TABLE `token_biblioteca` (
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
CREATE TABLE `mapa_tokens` (
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
CREATE TABLE `projetos` (
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
CREATE TABLE `notas` (
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
-- DADOS INICIAIS (OPCIONAL)
-- =============================================

-- Inserir usuário administrador padrão (opcional)
-- SENHA: admin123 (lembre-se de alterar!)
INSERT INTO `usuarios` (`nome`, `email`, `telefone`, `senha`, `confirmado`) VALUES
('Administrador', 'admin@oblivion.com', '11999999999', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1);

-- Criar perfil do administrador
INSERT INTO `perfil` (`id_usuario`, `nome`, `arroba`, `bio`, `tipo`) VALUES
(1, 'Administrador', 'admin', 'Administrador do sistema', 'mestre');

-- =============================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =============================================

-- Índices para otimizar consultas frequentes
CREATE INDEX `idx_party_ativo` ON `party_membros` (`status`, `id_party`);
CREATE INDEX `idx_chat_recente` ON `party_chat` (`id_party`, `criado_em` DESC);
CREATE INDEX `idx_posts_recentes` ON `posts` (`criado_em` DESC);
CREATE INDEX `idx_perfil_tipo` ON `perfil` (`tipo`);

-- =============================================
-- VIEWS ÚTEIS (OPCIONAL)
-- =============================================

-- View para estatísticas básicas
CREATE VIEW `estatisticas_sistema` AS
SELECT 
    (SELECT COUNT(*) FROM usuarios WHERE confirmado = 1) as usuarios_confirmados,
    (SELECT COUNT(*) FROM perfil WHERE tipo = 'jogador') as jogadores,
    (SELECT COUNT(*) FROM perfil WHERE tipo = 'mestre') as mestres,
    (SELECT COUNT(*) FROM party) as parties_ativas,
    (SELECT COUNT(*) FROM posts) as posts_total,
    (SELECT COUNT(*) FROM personagens) as personagens_criados;

-- View para parties com contagem de membros
CREATE VIEW `parties_info` AS
SELECT 
    p.id,
    p.nome,
    p.codigo,
    pf.nome as mestre_nome,
    pf.arroba as mestre_arroba,
    p.limite_jogadores,
    COUNT(pm.id) as membros_atual,
    p.criado_em
FROM party p
LEFT JOIN perfil pf ON p.id_mestre = pf.id_perfil
LEFT JOIN party_membros pm ON p.id = pm.id_party AND pm.status = 'ativo'
GROUP BY p.id;

-- =============================================
-- COMENTÁRIOS FINAIS
-- =============================================

/*
INSTRUÇÕES DE USO:

1. Execute este script no seu MySQL/MariaDB
2. Altere a senha do usuário administrador padrão
3. Configure as credenciais no arquivo backend/conexao.php
4. Teste a conexão executando a aplicação

ESTRUTURA DO BANCO:
- Sistema de usuários com verificação por email/SMS
- Perfis públicos com sistema de tipos (jogador/mestre)  
- Sistema de parties (grupos de jogo) com chat criptografado
- Rede social interna com posts, comentários e curtidas
- Sistema de mapas interativos com desenhos e tokens
- Fichas de personagem D&D completas
- Sistema de anotações organizadas por projetos

SEGURANÇA:
- Senhas são hasheadas com password_hash()
- Mensagens do chat são criptografadas
- Tokens de verificação/recuperação temporários
- Chaves estrangeiras para integridade referencial
*/
