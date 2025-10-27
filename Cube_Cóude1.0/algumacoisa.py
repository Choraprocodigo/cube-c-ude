from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

# Configuração do banco
db_config = {
    "host": "localhost",
    "user": "root",      # seu usuário
    "password": "",      # sua senha
    "database": "tarefas_db"
}

def get_connection():
    return mysql.connector.connect(**db_config)

# GET → lista todas as tarefas
@app.route("/api/tarefas", methods=["GET"])
def listar_tarefas():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM tarefas ORDER BY id DESC")
    tarefas = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(tarefas)

# POST → adicionar tarefa
@app.route("/api/tarefas", methods=["POST"])
def adicionar_tarefa():
    dados = request.json
    type_ = dados.get("type")
    coude = dados.get("coude")
    name = dados.get("name", "")

    if not type_ or not coude:
        return jsonify({"erro": "Type e Coude são obrigatórios"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO tarefas (type, coude, name) VALUES (%s, %s, %s)",
        (type_, coude, name)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"sucesso": True})

# PUT → editar tarefa
@app.route("/api/tarefas", methods=["PUT"])
def editar_tarefa():
    dados = request.json
    id_ = dados.get("id")
    type_ = dados.get("type")
    coude = dados.get("coude")
    name = dados.get("name", "")

    if not id_ or not type_ or not coude:
        return jsonify({"erro": "ID, Type e Coude são obrigatórios"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE tarefas SET type=%s, coude=%s, name=%s, apagado=0 WHERE id=%s",
        (type_, coude, name, id_)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"sucesso": True})

# DELETE → marcar tarefa como apagada
@app.route("/api/tarefas", methods=["DELETE"])
def deletar_tarefa():
    dados = request.json
    id_ = dados.get("id")
    if not id_:
        return jsonify({"erro": "ID é obrigatório"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE tarefas SET apagado=1 WHERE id=%s", (id_,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"sucesso": True})

if __name__ == "__main__":
    app.run(port=5000, debug=True)
