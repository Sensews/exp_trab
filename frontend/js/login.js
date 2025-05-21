const campoUsuario = document.getElementById("usuario");

// Formata o campo de telefone enquanto digita
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

  // Envia o formulário de login
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
          telefoneFormatado = data.telefone;

          // Inicia SMS de verificação
          enviarSMS(telefoneFormatado);
          modal.style.display = "flex";
        } else {
          alert(data.mensagem);
        }
      })
      .catch((error) => {
        console.error("Erro no login:", error);
        alert("Erro ao tentar fazer login. Tente novamente.");
      });
  });

  // Envia o SMS para o telefone
  function enviarSMS(telefone) {
    fetch("../backend/enviar-sms.php", {
      method: "POST",
      body: new URLSearchParams({ telefone }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status !== "ok") {
          alert(res.mensagem);
        }
      })
      .catch((err) => {
        console.error("Erro ao enviar SMS:", err);
        alert("Erro ao enviar código SMS.");
      });
  }

  // Fecha o modal de verificação
  btnFechar.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Reenvia o SMS
  btnReenviar.addEventListener("click", () => {
    enviarSMS(telefoneFormatado);
    alert("Novo SMS enviado.");
  });

  // Confirma o código do SMS
  btnConfirmar.addEventListener("click", () => {
    const codigo = document.getElementById("campo-codigo").value.trim();

    fetch("../backend/verificar-sms.php", {
      method: "POST",
      body: new URLSearchParams({ codigo }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === "ok") {
          // Agora usamos sessão real (sem localStorage)
          window.location.href = "../main.hml";
        } else {
          alert(res.mensagem);
        }
      })
      .catch((error) => {
        console.error("Erro ao verificar SMS:", error);
        alert("Erro ao verificar código. Tente novamente.");
      });
  });
});
