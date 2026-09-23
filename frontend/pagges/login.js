const button = document.querySelector("button")

button.onclick = (event) => {
    event.preventDefault()
    login()
}

async function login(){
    const email = document.querySelector("#email").value
    const password = document.querySelector("#senha").value

    const user = { email, password }

    try {
        let response = await fetch("https://edutec-backend-liard.vercel.app/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ user })
        })

        response = await response.json()

        // mensagem de erro do backend?
        if (response.message) {
            alert(response.message)
            return
        }

        // Salva sessão
        sessionStorage.setItem("user", JSON.stringify(response))

        alert("Login realizado com sucesso!")
        window.location.href = "../../index.html"

    } catch (err) {
        console.log(err)
        alert("Erro ao conectar ao servidor")
    }
}