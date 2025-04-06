const campoUsuario = document.getElementById("usuario");

campoUsuario.addEventListener("input", function () {
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
  const modal = document.getElementById("modal-verificacao");
  const btnFechar = document.getElementById("fechar-modal");
  const btnConfirmar = document.getElementById("confirmar-codigo");
  const btnReenviar = document.getElementById("reenviar-codigo");
  let telefoneFormatado = "";

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const dados = new FormData(form);
    fetch("../backend/login.php", {
      method: "POST",
      body: dados,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "ok") {
          localStorage.setItem("nome", data.nome);
          localStorage.setItem("email", data.email);
          telefoneFormatado = data.telefone; // Telefone do usuário

          // Envia SMS com o código real
          enviarSMS(telefoneFormatado);
          // Exibe o modal de verificação
          modal.style.display = "flex";
        } else {
          alert(data.mensagem);
        }
      })
      .catch((error) => {
        console.error("Erro no login:", error);
      });
  });

  function enviarSMS(telefone) {
    fetch("../backend/enviar-sms.php", {
      method: "POST",
      body: new URLSearchParams({ telefone }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status !== "ok") alert(res.mensagem);
      })
      .catch((err) => console.error("Erro ao enviar SMS:", err));
  }

  btnFechar.addEventListener("click", () => {
    modal.style.display = "none";
  });

  btnReenviar.addEventListener("click", () => {
    enviarSMS(telefoneFormatado);
    alert("Novo SMS enviado.");
  });

  btnConfirmar.addEventListener("click", () => {
    const codigo = document.getElementById("campo-codigo").value.trim();
    fetch("../backend/verificar-sms.php", {
      method: "POST",
      body: new URLSearchParams({ codigo }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === "ok") {
          localStorage.setItem("logado", "true");
          window.location.href = "main.html";
        } else {
          alert(res.mensagem);
        }
      })
      .catch((error) => {
        console.error("Erro ao verificar SMS:", error);
      });
  });
});
