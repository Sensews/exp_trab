<?php
// Inicia a sessão se ainda não estiver iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Importa script de controle de tempo (para expiração da sessão)
require_once("time.php");

// Importa o handler de criptografia
require_once("simple_crypto.php");

// Define o tipo da resposta como JSON
header('Content-Type: application/json');

// Verifica se o usuário está logado (verificação compatível com time.php)
if (!isset($_SESSION["id_perfil"]) || !isset($_SESSION["id_usuario"])) {
    echo json_encode(["logado" => false]);
    exit;
}

try {
    // Conexão com o banco de dados
    require_once("conexao.php");

    // Recupera o ID do usuário logado
    $id_usuario = $_SESSION["id_usuario"];

    // Define a ação recebida via GET (?action=carregar, salvar, postsUsuario)
    $action = $_GET["action"] ?? '';

    // === CARREGAR PERFIL ===
    if ($action === "carregar") {
        // Busca o perfil vinculado ao usuário
        $sql = "SELECT * FROM perfil WHERE id_usuario = ?";
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param("i", $id_usuario);
        $stmt->execute();
        $res = $stmt->get_result();
        $perfil = $res->fetch_assoc();

        if ($perfil) {
            // Armazena o ID do perfil na sessão
            $_SESSION["id_perfil"] = $perfil["id_perfil"];
            $response = json_encode($perfil);
        } else {
            // Retorna array vazio se não encontrar perfil
            $response = json_encode([]);
        }

        // Define o tamanho da resposta para evitar truncamento
        header("Content-Length: " . strlen($response));
        echo $response;
        exit;
    }    // === SALVAR PERFIL ===
    if ($action === "salvar") {
        // Criar instância do SimpleCrypto
        $crypto = new SimpleCrypto();
        
        // Lê o corpo da requisição
        $input = file_get_contents("php://input");
        $data = null;
        
        // Primeiro, tentar descriptografar dados (se criptografados)
        if (isset($_POST['encrypted_data'])) {
            // Dados criptografados via FormData
            try {
                $data = $crypto->decrypt($_POST['encrypted_data']);
                
                // Validar timestamp se presente
                if (isset($data['timestamp'])) {
                    if (!$crypto->validateTimestamp($data['timestamp'])) {
                        throw new Exception('Timestamp inválido ou expirado');
                    }
                    unset($data['timestamp']); // Remove timestamp dos dados
                }
            } catch (Exception $e) {
                $response = json_encode([
                    "status" => "erro",
                    "msg" => "Erro na descriptografia: " . $e->getMessage()
                ]);
                header("Content-Length: " . strlen($response));
                echo $response;
                exit;
            }
        } else {
            // Dados não criptografados (fallback) - JSON direto
            $data = json_decode($input, true);
        }

        // Verifica se os dados são válidos
        if (!$data) {
            $response = json_encode([
                "status" => "erro",
                "msg" => "Dados JSON inválidos",
                "debug" => json_last_error_msg()
            ]);
            header("Content-Length: " . strlen($response));
            echo $response;
            exit;
        }

        // Verifica se o perfil do usuário já existe
        $stmt = $conexao->prepare("SELECT id_perfil FROM perfil WHERE id_usuario = ?");
        $stmt->bind_param("i", $id_usuario);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            // UPDATE: perfil já existe, atualiza dados
            $sql = "UPDATE perfil 
                    SET nome = ?, arroba = ?, bio = ?, local = ?, 
                        aniversario = ?, avatar = ?, banner = ?, tipo = ? 
                    WHERE id_usuario = ?";
            $stmt = $conexao->prepare($sql);
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
            // INSERT: perfil ainda não existe, cria novo
            $sql = "INSERT INTO perfil 
                    (id_usuario, nome, arroba, bio, local, aniversario, avatar, banner, tipo) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $conexao->prepare($sql);
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

        // Executa a query e retorna sucesso ou erro
        if ($stmt->execute()) {
            $response = json_encode(["status" => "ok", "msg" => "Perfil salvo com sucesso"]);
        } else {
            $response = json_encode(["status" => "erro", "msg" => "Erro ao salvar dados: " . $stmt->error]);
        }

        header("Content-Length: " . strlen($response));
        echo $response;
        exit;
    }

    // === CARREGAR POSTS DO USUÁRIO ===
    if ($action === "postsUsuario") {
        // Busca o ID do perfil do usuário logado
        $sub = $conexao->prepare("SELECT id_perfil FROM perfil WHERE id_usuario = ?");
        $sub->bind_param("i", $id_usuario);
        $sub->execute();
        $resSub = $sub->get_result();
        $perfil = $resSub->fetch_assoc();

        // Se não tiver perfil ainda, retorna erro
        if (!$perfil) {
            $response = json_encode(["status" => "erro", "msg" => "Nenhum perfil encontrado."]);
            header("Content-Length: " . strlen($response));
            echo $response;
            exit;
        }

        $id_perfil = $perfil['id_perfil'];

        // Busca todos os posts do perfil em ordem cronológica reversa
        $sql = "SELECT texto, imagem, criado_em 
                FROM posts 
                WHERE id_perfil = ?
                ORDER BY criado_em DESC";
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param("i", $id_perfil);
        $stmt->execute();
        $res = $stmt->get_result();

        $posts = [];
        while ($row = $res->fetch_assoc()) {
            $posts[] = $row;
        }

        // Retorna todos os posts encontrados
        $response = json_encode($posts);
        header("Content-Length: " . strlen($response));
        echo $response;
        exit;
    }

    // Se nenhuma das ações for reconhecida
    $response = json_encode(["status" => "erro", "msg" => "Ação inválida"]);
    header("Content-Length: " . strlen($response));
    echo $response;
    exit;

} catch (Exception $e) {
    // Em caso de erro no servidor (ex: falha de conexão)
    $response = json_encode(["status" => "erro", "msg" => "Erro no servidor: " . $e->getMessage()]);
    header("Content-Length: " . strlen($response));
    echo $response;
    exit;
}
