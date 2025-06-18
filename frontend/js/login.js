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
  // Carregar bibliotecas de criptografia
  const cryptoScript = document.createElement('script');
  cryptoScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
  document.head.appendChild(cryptoScript);
  
  const jsEncryptScript = document.createElement('script');
  jsEncryptScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsencrypt/3.3.0/jsencrypt.min.js';
  document.head.appendChild(jsEncryptScript);
  
  // Aguardar carregamento das bibliotecas
  setTimeout(() => {
    const secureClientScript = document.createElement('script');
    secureClientScript.src = 'js/secure_client.js';
    document.head.appendChild(secureClientScript);
    
    setTimeout(() => {
      initializeLoginSecure();
    }, 500);
  }, 1000);
});

function initializeLoginSecure() {
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

      console.log("Tentando login com criptografia híbrida...");

      let response;
      try {
        // Tentar login criptografado
        response = await secureClient.sendSecureData('login', loginData);
        
        if (response.encrypted && response.encryptedData) {
          // Descriptografar resposta
          const decryptedResponse = secureClient.decryptMessageAes(
            response.encryptedData,
            secureClient.generateAesKey().key,
            response.iv
          );
          response = decryptedResponse;
        }
        
        console.log("Login com criptografia híbrida realizado com sucesso");
      } catch (cryptoError) {
        console.warn('Erro na criptografia, tentando método tradicional:', cryptoError);
        
        // Fallback para método tradicional
        const traditionalResponse = await fetch("../backend/login.php", {
          method: "POST",
          body: dados,
        });

        const contentType = traditionalResponse.headers.get("content-type");
        const text = await traditionalResponse.text();

        if (!contentType || !contentType.includes("application/json")) {
          console.error("🛑 Conteúdo retornado pelo servidor (não é JSON):\n" + text);
          throw new Error("Resposta inválida do servidor");
        }

        response = JSON.parse(text);
      }

      if (response.status === "ok") {
        console.log("✅ Login realizado:", response);
        
        // Salvar dados na sessão local se necessário
        if (response.encrypted) {
          console.log("🔒 Login com criptografia híbrida ativada");
        }
        
        // Redirecionar para página principal
        window.location.href = "main.html";
      } else {
        throw new Error(response.mensagem || "Erro no login");
      }

    } catch (error) {
      console.error("❌ Erro no login:", error);
      alert("Erro no login: " + error.message);
    } finally {      // Reabilitar botão
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
}
