<?php
// Inicia sessão e depois carrega time.php (ordem correta!)
session_start();
require_once("time.php");

// Carrega conexão com o banco
require_once("conexao.php");

// Incluir classe de criptografia
require_once('simple_crypto.php');

// Desativar exibição de erros para evitar HTML na resposta
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

// Sempre retorna JSON
header('Content-Type: application/json');

// Verificação padronizada de sessão (compatível com time.php)
if (!isset($_SESSION["id_perfil"]) || !isset($_SESSION["id_usuario"])) {
    echo json_encode(["logado" => false]);
    exit;
}

// Verifica autenticação
$id_perfil = $_SESSION['id_perfil'] ?? null;
$id_usuario = $_SESSION['id_usuario'] ?? null;

if (!$id_perfil || !$id_usuario) {
    echo json_encode(["erro" => "Perfil não autenticado."]);
    exit;
}

// Ação recebida via GET ou POST
$action = $_REQUEST["action"] ?? "";

// === 1. Criar post ===
if ($action === "criarPost") {
    try {
        // Criar instância do SimpleCrypto
        $crypto = new SimpleCrypto();
        
        $texto = "";
        $imagem = "";
        
        // Verificar se os dados estão criptografados
        if (isset($_POST['encrypted_data'])) {
            // Dados criptografados
            try {
                $data = $crypto->decrypt($_POST['encrypted_data']);
                
                // Validar timestamp se presente
                if (isset($data['timestamp'])) {
                    if (!$crypto->validateTimestamp($data['timestamp'])) {
                        throw new Exception('Timestamp inválido ou expirado');
                    }
                    unset($data['timestamp']); // Remove timestamp dos dados
                }
                
                $texto = $data['texto'] ?? "";
            } catch (Exception $e) {
                echo json_encode([
                    "erro" => "Erro na descriptografia: " . $e->getMessage()
                ]);
                exit;
            }
        } else {
            // Fallback: dados não criptografados
            $texto = $_POST["texto"] ?? "";
        }        // Verificar se uma imagem foi enviada
        if (isset($_FILES["imagem"]) && $_FILES["imagem"]["tmp_name"]) {
            $tipoImagem = $_FILES["imagem"]["type"];
            
            // Verificar se é um tipo de imagem válido
            $tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (in_array($tipoImagem, $tiposPermitidos)) {
                // Ler o arquivo e converter para base64
                $imagemConteudo = file_get_contents($_FILES["imagem"]["tmp_name"]);
                $imagemBase64 = base64_encode($imagemConteudo);
                $imagem = "data:" . $tipoImagem . ";base64," . $imagemBase64;
            } else {
                echo json_encode([
                    "erro" => "Tipo de arquivo não suportado. Use JPEG, PNG, GIF ou WebP."
                ]);
                exit;
            }
        }

        // Insere o post no banco
        $sql = "INSERT INTO posts (id_perfil, texto, imagem) VALUES (?, ?, ?)";
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param("iss", $id_perfil, $texto, $imagem);
        
        if ($stmt->execute()) {
            $id = $stmt->insert_id;

            echo json_encode([
                "sucesso" => true,
                "id" => $id,
                "texto" => $texto,
                "imagem" => $imagem
            ]);
        } else {
            echo json_encode([
                "erro" => "Erro ao salvar post no banco de dados"
            ]);
        }
        
    } catch (Exception $e) {
        echo json_encode([
            "erro" => "Erro interno: " . $e->getMessage()
        ]);
    }
    exit;
}

// === 2. Carregar posts ===
if ($action === "carregarPosts") {
    $sql = "SELECT posts.id, posts.texto, posts.imagem, posts.criado_em, perfil.arroba, perfil.avatar 
            FROM posts 
            JOIN perfil ON posts.id_perfil = perfil.id_perfil 
            ORDER BY posts.id DESC";
    $res = $conexao->query($sql);

    $posts = [];
    while ($row = $res->fetch_assoc()) {
        $posts[] = $row;
    }

    echo json_encode($posts);
    exit;
}

// === 3. Comentar ===
if ($action === "comentar") {
    $id_post = intval($_POST["id_post"]);
    $comentario = $_POST["comentario"] ?? "";

    $sql = "INSERT INTO comentarios (id_perfil, id_post, texto) VALUES (?, ?, ?)";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("iis", $id_perfil, $id_post, $comentario);
    $stmt->execute();

    echo json_encode(["sucesso" => true]);
    exit;
}

// === 4. Curtir ===
if ($action === "curtir") {
    $id_post = intval($_POST["id_post"]);

    $sql = "INSERT IGNORE INTO curtidas_posts (id_perfil, id_post) VALUES (?, ?)";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("ii", $id_perfil, $id_post);
    $stmt->execute();

    echo json_encode(["sucesso" => true]);
    exit;
}

// === 5. Remover curtida ===
if ($action === "removerCurtida") {
    $id_post = intval($_POST["id_post"]);

    $sql = "DELETE FROM curtidas_posts WHERE id_perfil = ? AND id_post = ?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("ii", $id_perfil, $id_post);
    $stmt->execute();

    echo json_encode(["sucesso" => true]);
    exit;
}

// === 6. Verificar curtida ===
if ($action === "verificarCurtida") {
    $id_post = intval($_GET["id_post"]);

    // Total de curtidas no post
    $sql1 = "SELECT COUNT(*) AS total FROM curtidas_posts WHERE id_post = ?";
    $stmt1 = $conexao->prepare($sql1);
    $stmt1->bind_param("i", $id_post);
    $stmt1->execute();
    $res1 = $stmt1->get_result();
    $total = $res1->fetch_assoc()["total"];

    // Se o usuário atual já curtiu o post
    $sql2 = "SELECT COUNT(*) AS curtido FROM curtidas_posts WHERE id_post = ? AND id_perfil = ?";
    $stmt2 = $conexao->prepare($sql2);
    $stmt2->bind_param("ii", $id_post, $id_perfil);
    $stmt2->execute();
    $res2 = $stmt2->get_result();
    $curtido = $res2->fetch_assoc()["curtido"] > 0;

    echo json_encode([
        "total" => $total,
        "curtido" => $curtido
    ]);
    exit;
}

// === Ação inválida ===
echo json_encode(["erro" => "Ação inválida."]);