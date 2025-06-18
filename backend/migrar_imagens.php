<?php
require_once 'conexao.php';

echo "=== MIGRAÇÃO DE IMAGENS PARA BASE64 ===\n\n";

// Buscar posts com imagens em arquivo
$sql = "SELECT id, imagem FROM posts WHERE imagem IS NOT NULL AND imagem != '' AND imagem NOT LIKE 'data:%'";
$result = $conexao->query($sql);

$postsAtualizados = 0;
$erros = 0;

while ($row = $result->fetch_assoc()) {
    $postId = $row['id'];
    $caminhoImagem = $row['imagem'];
    
    echo "Processando post ID: $postId, Imagem: $caminhoImagem\n";
    
    // Verificar se o arquivo existe
    if (file_exists($caminhoImagem)) {
        try {
            // Detectar tipo MIME
            $tipoImagem = mime_content_type($caminhoImagem);
            
            // Ler arquivo e converter para base64
            $imagemConteudo = file_get_contents($caminhoImagem);
            $imagemBase64 = base64_encode($imagemConteudo);
            $imagemDataUri = "data:" . $tipoImagem . ";base64," . $imagemBase64;
            
            // Atualizar no banco
            $updateSql = "UPDATE posts SET imagem = ? WHERE id = ?";
            $stmt = $conexao->prepare($updateSql);
            $stmt->bind_param("si", $imagemDataUri, $postId);
            
            if ($stmt->execute()) {
                echo "✅ Post $postId atualizado com sucesso\n";
                $postsAtualizados++;
                
                // Remover arquivo físico após migração bem-sucedida
                if (unlink($caminhoImagem)) {
                    echo "🗑️ Arquivo $caminhoImagem removido\n";
                }
            } else {
                echo "❌ Erro ao atualizar post $postId: " . $stmt->error . "\n";
                $erros++;
            }
            
        } catch (Exception $e) {
            echo "❌ Erro ao processar post $postId: " . $e->getMessage() . "\n";
            $erros++;
        }
    } else {
        echo "⚠️ Arquivo não encontrado: $caminhoImagem\n";
        // Limpar referência inválida
        $updateSql = "UPDATE posts SET imagem = NULL WHERE id = ?";
        $stmt = $conexao->prepare($updateSql);
        $stmt->bind_param("i", $postId);
        $stmt->execute();
    }
    
    echo "\n";
}

echo "=== RESUMO DA MIGRAÇÃO ===\n";
echo "Posts atualizados: $postsAtualizados\n";
echo "Erros: $erros\n";

// Verificar se a pasta uploads está vazia para remoção
$uploadsDir = 'uploads';
if (is_dir($uploadsDir)) {
    $files = array_diff(scandir($uploadsDir), array('.', '..'));
    if (empty($files)) {
        echo "\n📁 Pasta uploads está vazia e pode ser removida\n";
    } else {
        echo "\n📁 Pasta uploads ainda contém " . count($files) . " arquivo(s)\n";
    }
}

$conexao->close();
echo "\n✅ Migração concluída!\n";
?>
