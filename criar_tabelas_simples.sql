-- =============================================
-- OBLIVION RPG - CRIAR TABELAS PASSO A PASSO
-- =============================================

USE `oblivion`;

-- Criar tabela perfil (sem constraints primeiro)
CREATE TABLE IF NOT EXISTS `perfil` (
  `id_perfil` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `arroba` varchar(50) NOT NULL,
  `bio` text DEFAULT NULL,
  `local` varchar(100) DEFAULT NULL,
  `aniversario` date DEFAULT NULL,
  `avatar` longtext DEFAULT NULL,
  `banner` longtext DEFAULT NULL,
  `tipo` enum('jogador','mestre') DEFAULT 'jogador',
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_perfil`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar índice único para arroba (se não existir)
ALTER TABLE `perfil` ADD UNIQUE KEY `arroba` (`arroba`);

-- Criar tabela party
CREATE TABLE IF NOT EXISTS `party` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `senha` varchar(100) NOT NULL,
  `codigo` varchar(10) NOT NULL,
  `id_mestre` int(11) NOT NULL,
  `limite_jogadores` int(11) DEFAULT 5,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar índice único para codigo
ALTER TABLE `party` ADD UNIQUE KEY `codigo` (`codigo`);

-- Criar demais tabelas
CREATE TABLE IF NOT EXISTS `party_membros` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_party` int(11) NOT NULL,
  `id_perfil` int(11) NOT NULL,
  `status` enum('ativo','inativo','banido') DEFAULT 'ativo',
  `entrou_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_party_membro` (`id_party`, `id_perfil`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `party_chat` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_party` int(11) NOT NULL,
  `id_perfil` int(11) NOT NULL,
  `mensagem` text NOT NULL,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_perfil` int(11) NOT NULL,
  `texto` text NOT NULL,
  `imagem` longtext DEFAULT NULL,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `comentarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_post` int(11) NOT NULL,
  `id_perfil` int(11) NOT NULL,
  `texto` text NOT NULL,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `curtidas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_post` int(11) NOT NULL,
  `id_perfil` int(11) NOT NULL,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_curtida` (`id_post`, `id_perfil`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mapas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_perfil` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mapa_desenhos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_mapa` int(11) NOT NULL,
  `path_data` longtext NOT NULL,
  `cor` varchar(20) NOT NULL,
  `espessura` double NOT NULL,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `token_biblioteca` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_perfil` int(11) NOT NULL,
  `url` longtext NOT NULL,
  `nome` varchar(100) NOT NULL,
  `tamanho` int(11) DEFAULT 1,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mapa_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_mapa` int(11) NOT NULL,
  `id_token_biblioteca` int(11) DEFAULT NULL,
  `url` longtext NOT NULL,
  `posicao_x` double NOT NULL,
  `posicao_y` double NOT NULL,
  `tamanho` int(11) DEFAULT 1,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `projetos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_perfil` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_projeto` int(11) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `conteudo` longtext DEFAULT NULL,
  `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Tabelas criadas com sucesso!' as status;
