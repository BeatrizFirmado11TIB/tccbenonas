const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10
});

// TESTE
app.get("/", (req, res) => {
    res.json({ mensagem: "Backend funcionando!" });
});


// CADASTRO
app.post("/cadastro", (req, res) => {
    const {
        username,
        nome,
        sobrenome,
        email,
        senha
    } = req.body;

    if (!username || !nome || !sobrenome || !email || !senha) {
        return res.status(400).json({
            mensagem: "Preencha todos os campos."
        });
    }

    const sql = `
        INSERT INTO usuarios
        (username, nome, sobrenome, email, senha)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [username, nome, sobrenome, email, senha],
        (erro, resultado) => {

            if (erro) {
                console.log(erro);

                if (erro.code === "ER_DUP_ENTRY") {
                    return res.status(400).json({
                        mensagem: "Usuário ou e-mail já cadastrado."
                    });
                }

                return res.status(500).json({
                    mensagem: "Erro ao cadastrar usuário."
                });
            }

            res.status(201).json({
                mensagem: "Cadastro realizado com sucesso!"
            });
        }
    );
});


// LOGIN
app.post("/login", (req, res) => {

    const { username, senha } = req.body;

    const sql = `
        SELECT id, username, nome, sobrenome, email, senha
        FROM usuarios
        WHERE username = ?
    `;

    db.query(sql, [username], (erro, resultados) => {

        if (erro) {
            console.log(erro);

            return res.status(500).json({
                mensagem: "Erro no servidor."
            });
        }

        if (resultados.length === 0) {
            return res.status(401).json({
                mensagem: "Usuário ou senha incorretos."
            });
        }

        const usuario = resultados[0];

        if (usuario.senha !== senha) {
            return res.status(401).json({
                mensagem: "Usuário ou senha incorretos."
            });
        }

        res.json({
            mensagem: "Login realizado!",
            usuario: {
                id: usuario.id,
                username: usuario.username,
                nome: usuario.nome,
                sobrenome: usuario.sobrenome,
                email: usuario.email
            }
        });
    });
});


app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});