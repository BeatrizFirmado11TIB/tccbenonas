const button = document.querySelector("button")
button.onclick = (event) => {
    event.preventDefault()
    sendUser()
}

async function sendUser(){
    const name = document.querySelector("#nome").value
    const email = document.querySelector("#email").value
    const password = document.querySelector("#senha").value

    const user = {
        name,
        email,
        password

    }
     
    const response = await fetch("http://localhost:3333/cadastrar", {
        method: "POST",
        headers:{
            "Content-type": "application/json"
        },
        body: JSON.stringify({user})
    }).then(response => response.json())

    alert(response.message)

    window.location.href = "../index.html"
}