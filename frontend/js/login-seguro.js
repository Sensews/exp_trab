document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("form-login");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const dados = {
            usuario: formData.get('usuario'),
            senha: formData.get('senha')
        };

        try {
            // Usando fetch seguro com criptografia híbrida
            const response = await window.secureFetch.securePost(
                '../backend/login-seguro.php', 
                dados
            );

            if (response.status === "ok") {
                localStorage.setItem("nome", response.nome);
                localStorage.setItem("email", response.email);
                localStorage.setItem("logado", "true");
                window.location.href = "main.html";
            } else {
                alert(response.mensagem);
            }

        } catch (error) {
            console.error("Erro no login seguro:", error);
            alert("Erro na comunicação segura com o servidor");
        }
    });
});