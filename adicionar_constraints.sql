-- =============================================
-- ADICIONAR CONSTRAINTS E ÍNDICES
-- =============================================

USE `oblivion`;

-- Adicionar constraints para tabela perfil
ALTER TABLE `perfil` 
ADD CONSTRAINT `fk_perfil_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

-- Adicionar constraints para tabela party
ALTER TABLE `party` 
ADD CONSTRAINT `fk_party_mestre` FOREIGN KEY (`id_mestre`) REFERENCES `perfil` (`id_perfil`) ON DELETE CASCADE;

-- Adicionar constraints para party_membros
ALTER TABLE `party_membros` 
ADD CONSTRAINT `fk_party_membros_party` FOREIGN KEY (`id_party`) REFERENCES `party` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `fk_party_membros_perfil` FOREIGN KEY (`id_perfil`) REFERENCES `perfil` (`id_perfil`) ON DELETE CASCADE;

-- Adicionar constraints para party_chat
ALTER TABLE `party_chat` 
ADD CONSTRAINT `fk_party_chat_party` FOREIGN KEY (`id_party`) REFERENCES `party` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `fk_party_chat_perfil` FOREIGN KEY (`id_perfil`) REFERENCES `perfil` (`id_perfil`) ON DELETE CASCADE;

-- Adicionar constraints para posts
ALTER TABLE `posts` 
ADD CONSTRAINT `fk_posts_perfil` FOREIGN KEY (`id_perfil`) REFERENCES `perfil` (`id_perfil`) ON DELETE CASCADE;

-- Adicionar constraints para comentarios
ALTER TABLE `comentarios` 
ADD CONSTRAINT `fk_comentarios_post` FOREIGN KEY (`id_post`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `fk_comentarios_perfil` FOREIGN KEY (`id_perfil`) REFERENCES `perfil` (`id_perfil`) ON DELETE CASCADE;

-- Adicionar constraints para curtidas
ALTER TABLE `curtidas` 
ADD CONSTRAINT `fk_curtidas_post` FOREIGN KEY (`id_post`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `fk_curtidas_perfil` FOREIGN KEY (`id_perfil`) REFERENCES `perfil` (`id_perfil`) ON DELETE CASCADE;

-- Adicionar constraints para personagens
ALTER TABLE `personagens` 
ADD CONSTRAINT `fk_personagens_perfil` FOREIGN KEY (`id_perfil`) REFERENCES `perfil` (`id_perfil`) ON DELETE CASCADE;

-- Adicionar constraints para mapas
ALTER TABLE `mapas` 
ADD CONSTRAINT `fk_mapas_perfil` FOREIGN KEY (`id_perfil`) REFERENCES `perfil` (`id_perfil`) ON DELETE CASCADE;

-- Adicionar constraints para mapa_imagens
ALTER TABLE `mapa_imagens` 
ADD CONSTRAINT `fk_mapa_imagens_mapa` FOREIGN KEY (`id_mapa`) REFERENCES `mapas` (`id`) ON DELETE CASCADE;

-- Adicionar constraints para mapa_desenhos
ALTER TABLE `mapa_desenhos` 
ADD CONSTRAINT `fk_mapa_desenhos_mapa` FOREIGN KEY (`id_mapa`) REFERENCES `mapas` (`id`) ON DELETE CASCADE;

-- Adicionar constraints para token_biblioteca
ALTER TABLE `token_biblioteca` 
ADD CONSTRAINT `fk_token_biblioteca_perfil` FOREIGN KEY (`id_perfil`) REFERENCES `perfil` (`id_perfil`) ON DELETE CASCADE;

-- Adicionar constraints para mapa_tokens
ALTER TABLE `mapa_tokens` 
ADD CONSTRAINT `fk_mapa_tokens_mapa` FOREIGN KEY (`id_mapa`) REFERENCES `mapas` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `fk_mapa_tokens_biblioteca` FOREIGN KEY (`id_token_biblioteca`) REFERENCES `token_biblioteca` (`id`) ON DELETE SET NULL;

-- Adicionar constraints para projetos
ALTER TABLE `projetos` 
ADD CONSTRAINT `fk_projetos_perfil` FOREIGN KEY (`id_perfil`) REFERENCES `perfil` (`id_perfil`) ON DELETE CASCADE;

-- Adicionar constraints para notas
ALTER TABLE `notas` 
ADD CONSTRAINT `fk_notas_projeto` FOREIGN KEY (`id_projeto`) REFERENCES `projetos` (`id`) ON DELETE CASCADE;

-- =============================================
-- ADICIONAR ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices para perfil
ALTER TABLE `perfil` ADD INDEX `fk_perfil_usuario` (`id_usuario`);
ALTER TABLE `perfil` ADD INDEX `idx_perfil_tipo` (`tipo`);

-- Índices para party
ALTER TABLE `party` ADD INDEX `fk_party_mestre` (`id_mestre`);

-- Índices para party_membros
ALTER TABLE `party_membros` ADD INDEX `fk_party_membros_party` (`id_party`);
ALTER TABLE `party_membros` ADD INDEX `fk_party_membros_perfil` (`id_perfil`);
ALTER TABLE `party_membros` ADD INDEX `idx_party_ativo` (`status`, `id_party`);

-- Índices para party_chat
ALTER TABLE `party_chat` ADD INDEX `fk_party_chat_party` (`id_party`);
ALTER TABLE `party_chat` ADD INDEX `fk_party_chat_perfil` (`id_perfil`);
ALTER TABLE `party_chat` ADD INDEX `idx_party_chat_data` (`id_party`, `criado_em`);
ALTER TABLE `party_chat` ADD INDEX `idx_chat_recente` (`id_party`, `criado_em` DESC);

-- Índices para posts
ALTER TABLE `posts` ADD INDEX `fk_posts_perfil` (`id_perfil`);
ALTER TABLE `posts` ADD INDEX `idx_posts_data` (`criado_em`);
ALTER TABLE `posts` ADD INDEX `idx_posts_recentes` (`criado_em` DESC);

-- Índices para comentarios
ALTER TABLE `comentarios` ADD INDEX `fk_comentarios_post` (`id_post`);
ALTER TABLE `comentarios` ADD INDEX `fk_comentarios_perfil` (`id_perfil`);

-- Índices para curtidas
ALTER TABLE `curtidas` ADD INDEX `fk_curtidas_post` (`id_post`);
ALTER TABLE `curtidas` ADD INDEX `fk_curtidas_perfil` (`id_perfil`);

-- Índices para personagens
ALTER TABLE `personagens` ADD INDEX `fk_personagens_perfil` (`id_perfil`);
ALTER TABLE `personagens` ADD INDEX `idx_personagem_nome` (`nome`);

-- Índices para mapas
ALTER TABLE `mapas` ADD INDEX `fk_mapas_perfil` (`id_perfil`);

-- Índices para mapa_imagens
ALTER TABLE `mapa_imagens` ADD INDEX `fk_mapa_imagens_mapa` (`id_mapa`);

-- Índices para mapa_desenhos
ALTER TABLE `mapa_desenhos` ADD INDEX `fk_mapa_desenhos_mapa` (`id_mapa`);

-- Índices para token_biblioteca
ALTER TABLE `token_biblioteca` ADD INDEX `fk_token_biblioteca_perfil` (`id_perfil`);

-- Índices para mapa_tokens
ALTER TABLE `mapa_tokens` ADD INDEX `fk_mapa_tokens_mapa` (`id_mapa`);
ALTER TABLE `mapa_tokens` ADD INDEX `fk_mapa_tokens_biblioteca` (`id_token_biblioteca`);

-- Índices para projetos
ALTER TABLE `projetos` ADD INDEX `fk_projetos_perfil` (`id_perfil`);

-- Índices para notas
ALTER TABLE `notas` ADD INDEX `fk_notas_projeto` (`id_projeto`);

SELECT 'Constraints e índices adicionados com sucesso!' as status;
