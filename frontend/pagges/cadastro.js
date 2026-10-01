const formulario = document.querySelector("#formCadastro");

formulario.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.querySelector("#username").value;
    const nome = document.querySelector("#nome").value;
    const sobrenome = document.querySelector("#sobrenome").value;
    const email = document.querySelector("#email").value;
    const senha = document.querySelector("#senha").value;

    try {
        const resposta = await fetch("http://localhost:3000/cadastro", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username,
                nome,
                sobrenome,
                email,
                senha
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.mensagem);
            return;
        }

        alert("Cadastro realizado com sucesso!");

        window.location.href = "login.html";

    } catch (erro) {
        console.error(erro);
        alert("Não foi possível conectar ao servidor.");
    }
});