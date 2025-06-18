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
  const form = document.getElementById("form-login");

  if (!form) {
    console.error("Formulário de login não encontrado.");
    return;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const dados = new FormData(form);

    console.log("Enviando login:", {
      usuario: dados.get("usuario"),
      senha: dados.get("senha")
    });

    fetch("../backend/login.php", {
      method: "POST",
      body: dados,
    })
      .then(async (response) => {
        const contentType = response.headers.get("content-type");
        const text = await response.text();

        // Se a resposta não for JSON, loga o conteúdo bruto e lança erro
        if (!contentType || !contentType.includes("application/json")) {
          console.error("🛑 Conteúdo retornado pelo servidor (não é JSON):\n" + text);
          throw new Error("Resposta inválida do servidor");
        }

        // Se tudo certo, parseia o JSON
        return JSON.parse(text);
      })
      .then((data) => {
        if (data.status === "ok") {
          localStorage.setItem("nome", data.nome);
          localStorage.setItem("email", data.email);
          localStorage.setItem("logado", "true");
          window.location.href = "main.html";
        } else {
          alert(data.mensagem);
        }
      })
      .catch((error) => {
        console.error("Erro no login:", error.message);
      });
  });
});
