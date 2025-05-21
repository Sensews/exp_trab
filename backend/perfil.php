<?php
// Inicia sessão e define header antes de qualquer saída
session_start();
header('Content-Type: application/json'); 

// Configurações de erro para debug
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    require_once("conexao.php");
    // Removido require de time.php pois já iniciamos a sessão

    // Obtém o ID do usuário da sessão
    $id_usuario = $_SESSION["id_usuario"] ?? null;
    $action = $_GET["action"] ?? '';

    // Grava log para debug
    file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - ID usuário: " . ($id_usuario ?? 'null') . " - Ação: $action\n", FILE_APPEND);

    // Se o usuário não estiver autenticado
    if (!$id_usuario) {
        echo json_encode([
            "status" => "erro",
            "msg" => "Usuário não autenticado"
        ]);
        exit;
    }

    // === AÇÃO: carregar dados do perfil ===
    if ($action === "carregar") {
        $sql = "SELECT * FROM perfil WHERE id_usuario = ?";
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param("i", $id_usuario);
        $stmt->execute();
        $res = $stmt->get_result();
        $perfil = $res->fetch_assoc();

        echo json_encode($perfil ?: []);
        exit;
    }

    // === AÇÃO: salvar alterações do perfil ===
    if ($action === "salvar") {
        // Recebe os dados enviados em JSON
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);

        if (!$data) {
            echo json_encode([
                "status" => "erro", 
                "msg" => "Dados inválidos",
                "debug" => json_last_error_msg()
            ]);
            exit;
        }

        // Verifica se o perfil já existe
        $stmt = $conexao->prepare("SELECT id_perfil FROM perfil WHERE id_usuario = ?");
        $stmt->bind_param("i", $id_usuario);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            // UPDATE - perfil já existe
            $sql = "UPDATE perfil 
                   SET nome = ?, arroba = ?, bio = ?, local = ?, 
                       aniversario = ?, avatar = ?, banner = ?, tipo = ? 
                   WHERE id_usuario = ?";
            
            $stmt = $conexao->prepare($sql);
            if (!$stmt) {
                throw new Exception("Erro ao preparar query: " . $conexao->error);
            }
            
            $stmt->bind_param(
                "ssssssssi",
                $data["nome"],
                $data["arroba"],
                $data["bio"],
                $data["local"],
                $data["aniversario"],
                $data["avatar"],
                $data["banner"],
                $data["tipo"],
                $id_usuario
            );
        } else {
            // INSERT - criar novo perfil
            $sql = "INSERT INTO perfil 
                   (id_usuario, nome, arroba, bio, local, aniversario, avatar, banner, tipo) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $conexao->prepare($sql);
            if (!$stmt) {
                throw new Exception("Erro ao preparar query: " . $conexao->error);
            }
            
            $stmt->bind_param(
                "issssssss",
                $id_usuario,
                $data["nome"],
                $data["arroba"],
                $data["bio"],
                $data["local"],
                $data["aniversario"],
                $data["avatar"],
                $data["banner"],
                $data["tipo"]
            );
        }

        if ($stmt->execute()) {
            echo json_encode(["status" => "ok"]);
        } else {
            echo json_encode([
                "status" => "erro", 
                "msg" => "Erro ao executar query: " . $stmt->error
            ]);
        }

        exit;
    }

    // === AÇÃO: carregar posts do usuário ===
    if ($action === "postsUsuario") {
        $sql = "SELECT texto, imagem, criado_em 
                FROM posts 
                WHERE id_perfil = (
                    SELECT id_perfil FROM perfil WHERE id_usuario = ?
                )
                ORDER BY criado_em DESC";

        $stmt = $conexao->prepare($sql);
        $stmt->bind_param("i", $id_usuario);
        $stmt->execute();
        $res = $stmt->get_result();

        $posts = [];
        while ($row = $res->fetch_assoc()) {
            $posts[] = $row;
        }

        echo json_encode($posts);
        exit;
    }

    // === AÇÃO não reconhecida ===
    echo json_encode(["status" => "erro", "msg" => "Ação inválida"]);
    
} catch (Exception $e) {
    // Log do erro
    error_log("Erro no perfil.php: " . $e->getMessage());
    
    // Retorna erro em formato JSON
    echo json_encode([
        "status" => "erro",
        "msg" => "Ocorreu um erro no servidor: " . $e->getMessage()
    ]);
}
