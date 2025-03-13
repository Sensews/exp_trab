document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("login-form");
    const forgotPassword = document.getElementById("forgot-password");
    let failedAttempts = 0;
    let isBlocked = false;
    let verificationCode = null;

    // Lidar com o login
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (isBlocked) {
            alert("Conta bloqueada. Verifique seu email para desbloquear.");
            return;
        }

        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;

        // EMAIL E SENHA DE TESTES
        const storedEmail = "usuario@exemplo.com";
        const storedSenha = "SenhaForte123";

        if (email === storedEmail && senha === storedSenha) {
            generate2FA();
            document.getElementById("auth-2fa-modal").style.display = "flex";
        } else {
            failedAttempts++;
            if (failedAttempts >= 3) {
                isBlocked = true;
                alert("Conta bloqueada devido a 3 tentativas erradas. Verifique seu email.");
            } else {
                document.getElementById("error-message").textContent = `Erro: Email ou senha incorretos (${failedAttempts}/3).`;
            }
        }
    });

    // Gerar código 2FA
    function generate2FA() {
        verificationCode = Math.floor(100000 + Math.random() * 900000);
        console.log("Código 2FA:", verificationCode);
        alert(`Código 2FA enviado: ${verificationCode}`); 
    }

    // Verificar código 2FA
    window.verify2FA = function () {
        const inputCode = document.getElementById("auth-code").value;
        if (inputCode == verificationCode) {
            alert("Login realizado com sucesso!");
            closeModal("auth-2fa-modal");
            window.location.href = "index.html";
        } else {
            alert("Código 2FA incorreto. Tente novamente.");
        }
    };

    // Reenviar código 2FA
    window.resend2FA = function () {
        generate2FA();
        alert("Novo código 2FA enviado!");
    };

    // Abrir "Esqueci minha senha"
    forgotPassword.addEventListener("click", function () {
        document.getElementById("forgot-password-modal").style.display = "flex";
    });

    // Enviar email de redefinição
    window.sendPasswordReset = function () {
        const email = document.getElementById("reset-email").value;
        if (email) {
            alert(`Um link de redefinição foi enviado para ${email}.`);
        }
    };

    // Fechar modal
    window.closeModal = function (modalId) {
        document.getElementById(modalId).style.display = "none";
    };
});

// Alternar visibilidade da senha
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector("i");

    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
}