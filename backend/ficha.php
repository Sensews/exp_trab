<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');
require_once("time.php");

$host = 'localhost';
$dbname = 'oblivion';
$username = 'root';
$password = '';

session_start();
$id_perfil = $_SESSION['id_perfil'] ?? null;
if (!$id_perfil) {
    echo json_encode(["success" => false, "error" => "Perfil não autenticado"]);
    exit;
}


function conectarDB() {
    global $host, $dbname, $username, $password;

    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        return null;
    }
}

if (isset($_GET['action']) && $_GET['action'] === 'listar' && isset($_GET['id_perfil'])) {
    $pdo = conectarDB();
    $id_perfil = (int) $_GET['id_perfil'];

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT id, nome FROM personagens WHERE id_perfil = ?");
            $stmt->execute([$id_perfil]);
            $fichas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($fichas);
            exit;
        } catch (PDOException $e) {
            echo json_encode([]);
            exit;
        }
    }

    echo json_encode([]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$response = ['success' => false];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $fichaId = $_GET['id'];
            $ficha = carregarFicha($fichaId);

            if ($ficha) {
                $response = ['success' => true, 'data' => $ficha];
            } else {
                $response = ['success' => false, 'error' => 'Ficha não encontrada'];
            }
        } elseif (isset($_GET['id_perfil'])) {
            $id_perfil = $_GET['id_perfil'];
            $fichas = carregarFichasDoPerfil($id_perfil);
            $response = ['success' => true, 'data' => $fichas];
        } else {
            $response = ['success' => false, 'error' => 'Parâmetro ID não fornecido'];
        }
        break;

    case 'POST':
        $inputJSON = file_get_contents('php://input');
        $characterData = json_decode($inputJSON, true);

        if ($characterData && isset($_GET['id_perfil'])) {
            $id_perfil = $_GET['id_perfil'];
            $resultado = salvarFicha($characterData, $id_perfil);

            if ($resultado['success']) {
                $response = [
                    'success' => true,
                    'message' => 'Ficha salva com sucesso',
                    'id' => $resultado['id']
                ];
            } else {
                $response = [
                    'success' => false,
                    'error' => $resultado['error']
                ];
            }
        } else {
            $response = ['success' => false, 'error' => 'Dados inválidos ou id_perfil ausente'];
        }
        break;

    case 'DELETE':
        if (isset($_GET['id'])) {
            $fichaId = $_GET['id'];
            $resultado = apagarFicha($fichaId);

            if ($resultado) {
                $response = ['success' => true, 'message' => 'Ficha apagada com sucesso'];
            } else {
                $response = ['success' => false, 'error' => 'Erro ao apagar ficha'];
            }
        } else {
            $response = ['success' => false, 'error' => 'Parâmetro ID não fornecido'];
        }
        break;

    default:
        $response = ['success' => false, 'error' => 'Método não suportado'];
}

// ======== Funções ========

function salvarFicha($characterData, $id_perfil) {
    $pdo = conectarDB();
    if (!$pdo) {
        if (salvarFichaLocal($characterData)) {
            return ['success' => true, 'id' => 0, 'local' => true];
        }
        return ['success' => false, 'error' => 'Erro ao conectar ao banco e salvar localmente'];
    }

    try {
        $nome = $characterData['name'] ?? 'Personagem sem nome';
        $classe = $characterData['class'] ?? '';
        $nivel = $characterData['level'] ?? 1;
        $raca = $characterData['race'] ?? '';
        $dados = json_encode($characterData);

        $stmt = $pdo->prepare("SELECT id FROM personagens WHERE id_perfil = ? AND nome = ?");
        $stmt->execute([$id_perfil, $nome]);
        $ficha = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($ficha) {
            $stmt = $pdo->prepare("UPDATE personagens SET classe = ?, nivel = ?, raca = ?, dados_json = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$classe, $nivel, $raca, $dados, $ficha['id']]);
            return ['success' => true, 'id' => $ficha['id'], 'updated' => true];
        }

        $stmt = $pdo->prepare("INSERT INTO personagens (id_perfil, nome, classe, nivel, raca, dados_json) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id_perfil, $nome, $classe, $nivel, $raca, $dados]);

        return ['success' => true, 'id' => $pdo->lastInsertId()];
    } catch (PDOException $e) {
        if (salvarFichaLocal($characterData)) {
            return ['success' => true, 'id' => 0, 'local' => true];
        }

        return ['success' => false, 'error' => 'Erro ao salvar ficha: ' . $e->getMessage()];
    }
}

function salvarFichaLocal($characterData) {
    $nome = $characterData['name'] ?? 'personagem_sem_nome';
    $nome = preg_replace('/[^a-zA-Z0-9_]/', '_', $nome);
    $data = json_encode($characterData, JSON_PRETTY_PRINT);
    $filename = "../fichas/{$nome}_" . time() . ".json";

    if (!file_exists("../fichas")) {
        mkdir("../fichas", 0777, true);
    }

    return file_put_contents($filename, $data) ? true : false;
}

function carregarFicha($id) {
    $pdo = conectarDB();
    if (!$pdo) return null;

    try {
        $stmt = $pdo->prepare("SELECT * FROM personagens WHERE id = ?");
        $stmt->execute([$id]);
        $ficha = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($ficha) {
            $ficha['dados'] = json_decode($ficha['dados_json'], true);
            unset($ficha['dados_json']);
            return $ficha;
        }
        return null;
    } catch (PDOException $e) {
        return null;
    }
}

function carregarFichasDoPerfil($id_perfil) {
    $pdo = conectarDB();
    if (!$pdo) return [];

    try {
        $stmt = $pdo->prepare("SELECT id, nome, classe, nivel, raca, created_at, updated_at FROM personagens WHERE id_perfil = ? ORDER BY updated_at DESC");
        $stmt->execute([$id_perfil]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        return [];
    }
}

function apagarFicha($id) {
    $pdo = conectarDB();
    if (!$pdo) return false;

    try {
        $stmt = $pdo->prepare("DELETE FROM personagens WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    } catch (PDOException $e) {
        return false;
    }
}

echo json_encode($response);
?>
