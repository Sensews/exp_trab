<?php
session_start();
require_once 'conexao.php';

$id_usuario = $_SESSION['usuario_id'] ?? null;
$action = $_REQUEST['action'] ?? '';

if (!$id_usuario) {
    http_response_code(403);
    echo "Usuário não autenticado.";
    exit;
}

function responder($data) {
    header("Content-Type: application/json");
    echo json_encode($data);
    exit;
}

switch ($action) {
    case 'listar':
        $sql = "SELECT p.nome AS projeto, n.titulo
                FROM projetos p
                LEFT JOIN notas n ON p.id = n.id_projeto
                WHERE p.id_usuario = ?
                ORDER BY p.nome, n.titulo";
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param("i", $id_usuario);
        $stmt->execute();
        $res = $stmt->get_result();

        $saida = [];
        while ($row = $res->fetch_assoc()) {
            $proj = $row['projeto'];
            if (!isset($saida[$proj])) $saida[$proj] = [];
            if ($row['titulo']) $saida[$proj][] = $row['titulo'];
        }
        responder($saida);

    case 'criar_projeto':
        $nome = trim($_POST['nome'] ?? '');
        if (!$nome) exit("Nome inválido.");
        $stmt = $conexao->prepare("INSERT IGNORE INTO projetos (id_usuario, nome) VALUES (?, ?)");
        $stmt->bind_param("is", $id_usuario, $nome);
        $stmt->execute();
        echo "Projeto criado.";
        break;

    case 'criar_nota':
        $projeto = trim($_POST['projeto'] ?? '');
        $nota = trim($_POST['nota'] ?? '');
        if (!$projeto || !$nota) exit("Dados incompletos.");

        $stmt = $conexao->prepare("SELECT id FROM projetos WHERE id_usuario = ? AND nome = ?");
        $stmt->bind_param("is", $id_usuario, $projeto);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res->fetch_assoc();

        if ($row) {
            $id_projeto = $row['id'];
            $stmt = $conexao->prepare("INSERT IGNORE INTO notas (id_projeto, titulo, conteudo) VALUES (?, ?, '')");
            $stmt->bind_param("is", $id_projeto, $nota);
            $stmt->execute();
            echo "Nota criada.";
        } else {
            http_response_code(404);
            echo "Projeto não encontrado.";
        }
        break;

    case 'salvar_nota':
        $projeto = trim($_POST['projeto'] ?? '');
        $nota = trim($_POST['nota'] ?? '');
        $conteudo = $_POST['conteudo'] ?? '';

        $stmt = $conexao->prepare("SELECT id FROM projetos WHERE id_usuario = ? AND nome = ?");
        $stmt->bind_param("is", $id_usuario, $projeto);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res->fetch_assoc();

        if ($row) {
            $id_projeto = $row['id'];

            // Backup automático
            $stmtOld = $conexao->prepare("SELECT conteudo FROM notas WHERE id_projeto = ? AND titulo = ?");
            $stmtOld->bind_param("is", $id_projeto, $nota);
            $stmtOld->execute();
            $resOld = $stmtOld->get_result();
            if ($old = $resOld->fetch_assoc()) {
                $stmtBackup = $conexao->prepare("INSERT INTO versoes (id_projeto, titulo, conteudo) VALUES (?, ?, ?)");
                $stmtBackup->bind_param("iss", $id_projeto, $nota, $old['conteudo']);
                $stmtBackup->execute();
            }

            $stmt = $conexao->prepare("UPDATE notas SET conteudo = ? WHERE id_projeto = ? AND titulo = ?");
            $stmt->bind_param("sis", $conteudo, $id_projeto, $nota);
            $stmt->execute();
            echo "Salvo.";
        } else {
            http_response_code(404);
            echo "Projeto não encontrado.";
        }
        break;

    case 'carregar_nota':
        $projeto = trim($_GET['projeto'] ?? '');
        $nota = trim($_GET['nota'] ?? '');

        $stmt = $conexao->prepare("SELECT n.conteudo
                                   FROM notas n
                                   JOIN projetos p ON n.id_projeto = p.id
                                   WHERE p.id_usuario = ? AND p.nome = ? AND n.titulo = ?");
        $stmt->bind_param("iss", $id_usuario, $projeto, $nota);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res->fetch_assoc();

        echo $row['conteudo'] ?? '';
        break;

    case 'excluir_nota':
        $projeto = trim($_POST['projeto'] ?? '');
        $nota = trim($_POST['nota'] ?? '');

        $stmt = $conexao->prepare("SELECT id FROM projetos WHERE id_usuario = ? AND nome = ?");
        $stmt->bind_param("is", $id_usuario, $projeto);
        $stmt->execute();
        $res = $stmt->get_result();
        $proj = $res->fetch_assoc();

        if ($proj) {
            $stmt = $conexao->prepare("DELETE FROM notas WHERE id_projeto = ? AND titulo = ?");
            $stmt->bind_param("is", $proj['id'], $nota);
            $stmt->execute();
            echo "Anotação excluída.";
        } else {
            http_response_code(404);
            echo "Projeto não encontrado.";
        }
        break;

    case 'excluir_projeto':
        $projeto = trim($_POST['projeto'] ?? '');

        $stmt = $conexao->prepare("DELETE FROM projetos WHERE id_usuario = ? AND nome = ?");
        $stmt->bind_param("is", $id_usuario, $projeto);
        $stmt->execute();
        echo "Projeto excluído.";
        break;

    case 'backup_versoes':
        $projeto = trim($_GET['projeto'] ?? '');
        $nota = trim($_GET['nota'] ?? '');

        $stmt = $conexao->prepare("
            SELECT v.conteudo, v.salvo_em
            FROM versoes v
            JOIN projetos p ON p.id = v.id_projeto
            WHERE p.nome = ? AND v.titulo = ? AND p.id_usuario = ?
            ORDER BY v.salvo_em DESC
            LIMIT 10
        ");
        $stmt->bind_param("ssi", $projeto, $nota, $id_usuario);
        $stmt->execute();
        $res = $stmt->get_result();

        $versoes = [];
        while ($row = $res->fetch_assoc()) {
            $versoes[] = $row;
        }
        responder($versoes);

    default:
        http_response_code(400);
        echo "Ação inválida.";
        break;
}
