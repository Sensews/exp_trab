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

document.addEventListener("DOMContentLoaded", function () {
  // Aguardar carregamento das bibliotecas
  setTimeout(() => {
    initializeLogin();
  }, 500);
});

function initializeLogin() {
  const form = document.getElementById("form-login");

  if (!form) {
    console.error("Formulário de login não encontrado.");
    return;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    // Desabilitar botão durante o envio
    submitButton.disabled = true;
    submitButton.textContent = 'Entrando...';

    try {
      const dados = new FormData(form);
      const loginData = {
        usuario: dados.get("usuario"),
        senha: dados.get("senha")
      };

      let response;
      let encryptedMode = false;

      // Verificar se o cliente de criptografia está disponível
      if (typeof window.simpleSecureClient !== 'undefined') {
        try {
          // Tentar login criptografado
          const encryptedData = window.simpleSecureClient.encrypt(loginData);
          
          const formData = new FormData();
          formData.append('encrypted_data', encryptedData);
          
          const loginResponse = await fetch("../backend/login.php", {
            method: "POST",
            body: formData,
          });

          const contentType = loginResponse.headers.get("content-type");
          const text = await loginResponse.text();

          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Resposta inválida do servidor");
          }

          response = JSON.parse(text);
          encryptedMode = true;
          
        } catch (cryptoError) {
          console.warn('Erro na criptografia, tentando método tradicional:', cryptoError);
          encryptedMode = false;
        }
      }

      // Fallback para método tradicional se criptografia falhou
      if (!encryptedMode) {
        const traditionalResponse = await fetch("../backend/login.php", {
          method: "POST",
          body: dados,
        });

        const contentType = traditionalResponse.headers.get("content-type");
        const text = await traditionalResponse.text();

        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Resposta inválida do servidor");
        }

        response = JSON.parse(text);
      }

      if (response.status === "ok") {
        // Redirecionar para página principal
        window.location.href = "main.html";
      } else {
        throw new Error(response.mensagem || "Erro no login");
      }

    } catch (error) {
      console.error("❌ Erro no login:", error);
      
      // Mostrar erro mais amigável ao usuário
      let errorMessage = "Erro no login. Tente novamente.";
      if (error.message.includes("Usuário não encontrado")) {
        errorMessage = "Usuário não encontrado.";
      } else if (error.message.includes("Senha incorreta")) {
        errorMessage = "Senha incorreta.";
      } else if (error.message.includes("Preencha todos os campos")) {
        errorMessage = "Preencha todos os campos.";
      }
      
      alert(errorMessage);
    } finally {
      // Reabilitar botão
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
}
