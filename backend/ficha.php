<?php
// Configuração de cabeçalhos para permitir CORS e JSON
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

// Configurações do banco de dados
$host = 'localhost';
$dbname = 'oblivion';
$username = 'root';
$password = '';

// Função para conectar ao banco de dados
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

// Função para criar as tabelas necessárias se não existirem
function criarTabelasSeNecessario() {
    $pdo = conectarDB();
    
    if ($pdo) {
        try {
            // Tabela de Usuários
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS usuarios (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ");
            
            // Tabela de Personagens
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS personagens (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT,
                    nome VARCHAR(100) NOT NULL,
                    classe VARCHAR(50),
                    nivel INT DEFAULT 1,
                    raca VARCHAR(50),
                    dados_json LONGTEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
                )
            ");
            
            return true;
        } catch (PDOException $e) {
            return false;
        }
    }
    
    return false;
}

// Verifica e cria tabelas se necessário
criarTabelasSeNecessario();

// Processa a requisição
$method = $_SERVER['REQUEST_METHOD'];
$response = ['success' => false];

switch ($method) {
    case 'GET':
        // Carregar ficha(s)
        if (isset($_GET['id'])) {
            // Carrega uma ficha específica pelo ID
            $fichaId = $_GET['id'];
            $ficha = carregarFicha($fichaId);
            
            if ($ficha) {
                $response = [
                    'success' => true,
                    'data' => $ficha
                ];
            } else {
                $response = [
                    'success' => false,
                    'error' => 'Ficha não encontrada'
                ];
            }
        } elseif (isset($_GET['user_id'])) {
            // Carrega todas as fichas de um usuário
            $userId = $_GET['user_id'];
            $fichas = carregarFichasDoUsuario($userId);
            
            $response = [
                'success' => true,
                'data' => $fichas
            ];
        } else {
            $response = [
                'success' => false,
                'error' => 'Parâmetro ID não fornecido'
            ];
        }
        break;
        
    case 'POST':
        // Salvar ficha
        $inputJSON = file_get_contents('php://input');
        $characterData = json_decode($inputJSON, true);
        
        if ($characterData) {
            $userId = isset($_GET['user_id']) ? $_GET['user_id'] : null;
            $resultado = salvarFicha($characterData, $userId);
            
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
            $response = [
                'success' => false,
                'error' => 'Dados inválidos'
            ];
        }
        break;
        
    case 'DELETE':
        // Apagar ficha
        if (isset($_GET['id'])) {
            $fichaId = $_GET['id'];
            $resultado = apagarFicha($fichaId);
            
            if ($resultado) {
                $response = [
                    'success' => true,
                    'message' => 'Ficha apagada com sucesso'
                ];
            } else {
                $response = [
                    'success' => false,
                    'error' => 'Erro ao apagar ficha'
                ];
            }
        } else {
            $response = [
                'success' => false,
                'error' => 'Parâmetro ID não fornecido'
            ];
        }
        break;
        
    default:
        $response = [
            'success' => false,
            'error' => 'Método não suportado'
        ];
}

// Salva uma ficha na pasta local se banco de dados falhar
function salvarFichaLocal($characterData) {
    $nome = $characterData['name'] ?? 'personagem_sem_nome';
    $nome = preg_replace('/[^a-zA-Z0-9_]/', '_', $nome);
    
    $data = json_encode($characterData, JSON_PRETTY_PRINT);
    $filename = "../fichas/{$nome}_" . time() . ".json";
    
    // Cria o diretório se não existir
    if (!file_exists("../fichas")) {
        mkdir("../fichas", 0777, true);
    }
    
    if (file_put_contents($filename, $data)) {
        return true;
    }
    
    return false;
}

// Função para salvar a ficha
function salvarFicha($characterData, $userId = null) {
    $pdo = conectarDB();
    
    if (!$pdo) {
        // Se não conseguir conectar ao banco, tenta salvar localmente
        if (salvarFichaLocal($characterData)) {
            return [
                'success' => true,
                'id' => 0,
                'local' => true
            ];
        }
        
        return [
            'success' => false,
            'error' => 'Erro ao conectar ao banco de dados e ao salvar localmente'
        ];
    }
    
    try {
        $nome = $characterData['name'] ?? 'Personagem sem nome';
        $classe = $characterData['class'] ?? '';
        $nivel = $characterData['level'] ?? 1;
        $raca = $characterData['race'] ?? '';
        $dados = json_encode($characterData);
        
        // Verifica se já existe uma ficha com esse nome para o usuário
        if ($userId) {
            $stmt = $pdo->prepare("SELECT id FROM personagens WHERE user_id = ? AND nome = ?");
            $stmt->execute([$userId, $nome]);
            $ficha = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($ficha) {
                // Atualiza a ficha existente
                $stmt = $pdo->prepare("UPDATE personagens SET classe = ?, nivel = ?, raca = ?, dados_json = ?, updated_at = NOW() WHERE id = ?");
                $stmt->execute([$classe, $nivel, $raca, $dados, $ficha['id']]);
                
                return [
                    'success' => true,
                    'id' => $ficha['id'],
                    'updated' => true
                ];
            }
        }
        
        // Insere nova ficha
        $stmt = $pdo->prepare("INSERT INTO personagens (user_id, nome, classe, nivel, raca, dados_json) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $nome, $classe, $nivel, $raca, $dados]);
        
        return [
            'success' => true,
            'id' => $pdo->lastInsertId()
        ];
    } catch (PDOException $e) {
        // Se ocorrer um erro no banco, tenta salvar localmente
        if (salvarFichaLocal($characterData)) {
            return [
                'success' => true,
                'id' => 0,
                'local' => true
            ];
        }
        
        return [
            'success' => false,
            'error' => 'Erro ao salvar ficha: ' . $e->getMessage()
        ];
    }
}

// Função para carregar uma ficha pelo ID
function carregarFicha($id) {
    $pdo = conectarDB();
    
    if (!$pdo) {
        return null;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM personagens WHERE id = ?");
        $stmt->execute([$id]);
        $ficha = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($ficha) {
            $ficha['dados'] = json_decode($ficha['dados_json'], true);
            unset($ficha['dados_json']); // Remove a string JSON original
            return $ficha;
        }
        
        return null;
    } catch (PDOException $e) {
        return null;
    }
}

// Função para carregar todas as fichas de um usuário
function carregarFichasDoUsuario($userId) {
    $pdo = conectarDB();
    
    if (!$pdo) {
        return [];
    }
    
    try {
        $stmt = $pdo->prepare("SELECT id, nome, classe, nivel, raca, created_at, updated_at FROM personagens WHERE user_id = ? ORDER BY updated_at DESC");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        return [];
    }
}

// Função para apagar uma ficha
function apagarFicha($id) {
    $pdo = conectarDB();
    
    if (!$pdo) {
        return false;
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM personagens WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    } catch (PDOException $e) {
        return false;
    }
}

// Retorna a resposta
echo json_encode($response);
?>