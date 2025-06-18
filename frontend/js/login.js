const campoUsuario = document.getElementById("usuario");

campoUsuario?.addEventListener("input", function () {
  const valor = campoUsuario.value;
  if (/[a-zA-Z@]/.test(valor)) return;

  let numeros = valor.replace(/\D/g, "");
  if (numeros.length > 0) {
    numeros = numeros.replace(/^(\d{2})(\d)/g, "($1) $2");
    if (numeros.length >= 10) {
      numeros = numeros.replace(/(\d{5})(\d{4})$/, "$1-$2");
    }
  }
  campoUsuario.value = numeros;
});

document.addEventListener("DOMContentLoaded", async function () {
  const form = document.getElementById("form-login");

  if (!form) {
    console.error("Formulário de login não encontrado.");
    return;
  }
  // Inicializar gerenciador de criptografia
  let cryptoManager = null;
  try {
    cryptoManager = CryptoManagerSimple.getInstance();
    await cryptoManager.initialize();
    console.log("🔒 Sistema de criptografia inicializado com sucesso");
  } catch (error) {
    console.error("❌ Erro ao inicializar criptografia:", error);
    // Sistema pode continuar funcionando sem criptografia por compatibilidade
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const dados = new FormData(form);

    const credenciais = {
      usuario: dados.get("usuario"),
      senha: dados.get("senha")
    };

    console.log("Enviando login:", {
      usuario: credenciais.usuario,
      senha: "[REDACTED]"
    });

    try {
      let response;
      
      if (cryptoManager) {
        // Enviar com criptografia
        console.log("🔒 Enviando dados criptografados");
        response = await cryptoManager.securePost("../backend/login.php", credenciais);
      } else {
        // Fallback sem criptografia
        console.log("⚠️ Enviando sem criptografia (fallback)");
        response = await fetch("../backend/login.php", {
          method: "POST",
          body: dados,
        });
      }

      const contentType = response.headers.get("content-type");
      const text = await response.text();

      // Se a resposta não for JSON, loga o conteúdo bruto e lança erro
      if (!contentType || !contentType.includes("application/json")) {
        console.error("🛑 Conteúdo retornado pelo servidor (não é JSON):\n" + text);
        throw new Error("Resposta inválida do servidor");
      }

      // Parsear resposta JSON
      const jsonResponse = JSON.parse(text);        // Verificar se a resposta está criptografada
      let data;
      if (cryptoManager && CryptoManagerSimple.isEncryptedData && 
          CryptoManagerSimple.isEncryptedData(jsonResponse)) {
        console.log("🔓 Descriptografando resposta");
        data = await cryptoManager.decryptData(jsonResponse);
      } else {
        data = jsonResponse;
      }

      if (data.status === "ok") {
        localStorage.setItem("nome", data.nome);
        localStorage.setItem("email", data.email);
        localStorage.setItem("logado", "true");
        console.log("✅ Login realizado com sucesso");
        window.location.href = "main.html";
      } else {
        alert(data.mensagem);
      }
      
    } catch (error) {
      console.error("❌ Erro no login:", error.message);
      alert("Erro ao realizar login. Tente novamente.");
    }
  });
});
