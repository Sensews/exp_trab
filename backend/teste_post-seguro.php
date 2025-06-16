<?php
require_once 'SecureEndpoint.php';
require_once("conexao.php");
include_once 'time.php';

ini_set("display_errors", 1);
error_reporting(E_ALL);

$endpoint = new SecureEndpoint();

try {
    // Recebe dados criptografados
    $data = $endpoint->receiveData();
    
    $action = $data['action'] ?? '';
    $id_perfil = $_SESSION['id_perfil'] ?? null;

    if (!$id_perfil) {
        $endpoint->sendData([
            "sucesso" => false,
            "erro" => "Usuário não autenticado"
        ]);
        exit;
    }

    if ($action === "criarPost") {
        $texto = trim($data['texto'] ?? '');
        $imagem = $data['imagem'] ?? null;

        if (empty($texto) && empty($imagem)) {
            $endpoint->sendData([
                "sucesso" => false,
                "erro" => "Post não pode estar vazio"
            ]);
            exit;
        }

        $imagem_nome = null;
        if ($imagem) {
            // Processa a imagem base64
            if (preg_match('/^data:image\/(\w+);base64,/', $imagem, $matches)) {
                $tipo = strtolower($matches[1]);
                $imagem_data = substr($imagem, strpos($imagem, ',') + 1);
                $imagem_data = base64_decode($imagem_data);
                
                if ($imagem_data !== false) {
                    $imagem_nome = 'post_' . time() . '_' . uniqid() . '.' . $tipo;
                    $caminho_imagem = __DIR__ . '/../uploads/' . $imagem_nome;
                    
                    // Cria diretório se não existir
                    if (!is_dir(dirname($caminho_imagem))) {
                        mkdir(dirname($caminho_imagem), 0755, true);
                    }
                    
                    file_put_contents($caminho_imagem, $imagem_data);
                }
            }
        }

        // Insere no banco
        $sql = "INSERT INTO posts (id_perfil, texto, imagem, criado_em) VALUES (?, ?, ?, NOW())";
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param("iss", $id_perfil, $texto, $imagem_nome);

        if ($stmt->execute()) {
            $post_id = $conexao->insert_id;
            
            $endpoint->sendData([
                "sucesso" => true,
                "id" => $post_id,
                "texto" => $texto,
                "imagem" => $imagem_nome ? "../uploads/" . $imagem_nome : null,
                "criado_em" => date('Y-m-d H:i:s')
            ]);
        } else {
            $endpoint->sendData([
                "sucesso" => false,
                "erro" => "Erro ao salvar post"
            ]);
        }

    } elseif ($action === "carregarPosts") {
        $sql = "SELECT p.*, pr.nome, pr.arroba, pr.avatar 
                FROM posts p 
                JOIN perfil pr ON p.id_perfil = pr.id_perfil 
                ORDER BY p.criado_em DESC 
                LIMIT 50";
        
        $result = $conexao->query($sql);
        $posts = [];

        while ($row = $result->fetch_assoc()) {
            $posts[] = [
                "id" => $row['id'],
                "texto" => $row['texto'],
                "imagem" => $row['imagem'] ? "../uploads/" . $row['imagem'] : null,
                "nome" => $row['nome'],
                "arroba" => $row['arroba'],
                "avatar" => $row['avatar'],
                "criado_em" => $row['criado_em']
            ];
        }

        $endpoint->sendData($posts);

    } else {
        $endpoint->sendData([
            "sucesso" => false,
            "erro" => "Ação inválida"
        ]);
    }

} catch (Exception $e) {
    error_log("Erro no teste_post-seguro: " . $e->getMessage());
    $endpoint->sendData([
        "sucesso" => false,
        "erro" => "Erro interno do servidor"
    ]);
}
