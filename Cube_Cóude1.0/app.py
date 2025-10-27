from flask import Flask, jsonify, request, send_from_directory
import json
import os

app = Flask(__name__)

ARQUIVO_TAREFAS = "tarefas.json"

# Função para ler tarefas do arquivo
def ler_tarefas():
    if not os.path.exists(ARQUIVO_TAREFAS):
        return []
    with open(ARQUIVO_TAREFAS, "r", encoding="utf-8") as f:
        return json.load(f)

# Função para salvar tarefas no arquivo
def salvar_tarefas(tarefas):
    with open(ARQUIVO_TAREFAS, "w", encoding="utf-8") as f:
        json.dump(tarefas, f, ensure_ascii=False, indent=4)

# Rota principal serve o HTML
@app.route("/")
def index():
    return send_from_directory(".", "index.html")

# Servir CSS
@app.route("/style.css")
def css():
    return send_from_directory(".", "style.css")

# Servir JS
@app.route("/java.js")
def js():
    return send_from_directory(".", "java.js")

# API para pegar tarefas
@app.route("/api/tarefas", methods=["GET"])
def api_get_tarefas():
    tarefas = ler_tarefas()
    return jsonify(tarefas)

# API para adicionar uma tarefa
@app.route("/api/tarefas", methods=["POST"])
def api_add_tarefa():
    dados = request.json
    tarefas = ler_tarefas()
    novo_id = max([t["id"] for t in tarefas], default=0) + 1
    tarefa = {
        "id": novo_id,
        "type": dados.get("type", ""),
        "cóude": dados.get("cóude", ""),
        "name": dados.get("name", ""),
        "apagado": False
    }
    tarefas.append(tarefa)
    salvar_tarefas(tarefas)
    return jsonify(tarefa), 201

# Rodar o servidor
if __name__ == "__main__":
    app.run(debug=True)
