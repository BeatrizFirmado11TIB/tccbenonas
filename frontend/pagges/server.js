const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "../../.env")
});

console.log("HOST DO BANCO:", process.env.DB_HOST);
console.log("PORTA DO BANCO:", process.env.DB_PORT);
console.log("DATABASE:", process.env.DB_NAME);

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.getConnection((erro, connection) => {

    if (erro) {
        console.log("❌ Erro ao conectar ao MySQL:");
        console.log(erro.message);
        return;
    }

    console.log("✅ MySQL conectado!");

    connection.release();
});


// =========================
// TESTE DO SERVIDOR
// =========================

app.get("/", (req, res) => {
    res.send("Backend Petrotech funcionando!");
});


// =========================
// CADASTRO
// =========================

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

                console.log("❌ Erro ao cadastrar:", erro);

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


// =========================
// LOGIN
// =========================

app.post("/login", (req, res) => {

    const { username, senha } = req.body;

    console.log("📥 Login recebido:");
    console.log("Username:", username);

    if (!username || !senha) {
        return res.status(400).json({
            mensagem: "Digite usuário e senha."
        });
    }

    const sql = `
        SELECT *
        FROM usuarios
        WHERE username = ?
    `;

    db.query(sql, [username], (erro, resultados) => {

        if (erro) {
            console.log("❌ ERRO DO MYSQL NO LOGIN:");
            console.log(erro);

            return res.status(500).json({
                mensagem: "Erro no servidor."
            });
        }

        console.log("✅ Consulta realizada!");
        console.log("Usuários encontrados:", resultados.length);

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
            mensagem: "Login realizado com sucesso!",

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


// =========================
// INICIAR SERVIDOR
// =========================

app.listen(3000, () => {

    console.log(
        "🚀 Servidor rodando em http://localhost:3000"
    );

});