const formulario = document.querySelector("#formLogin");

formulario.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.querySelector("#username").value;
    const senha = document.querySelector("#senha").value;

    try {
        const resposta = await fetch("http://localhost:3000/login", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username,
                senha
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.mensagem);
            return;
        }

        // Guarda os dados do usuário
        localStorage.setItem(
            "usuario",
            JSON.stringify(dados.usuario)
        );

        alert("Login realizado com sucesso!");

        window.location.href = "../index.html";

    } catch (erro) {
        console.error(erro);
        alert("Não foi possível conectar ao servidor.");
    }
});