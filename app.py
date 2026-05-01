from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

def db_conn():
    conn = sqlite3.connect("task.db")
    conn.row_factory = sqlite3.Row
    return conn

# Database Initialization
def init_db():
    db = db_conn()
    db.execute("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, password TEXT)")
    db.execute("CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, user_id INTEGER)")
    db.execute("CREATE TABLE IF NOT EXISTS tasks(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, status TEXT, project_id INTEGER, due_date TEXT)")
    db.commit()
    db.close()

init_db()

@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    db = db_conn()
    try:
        db.execute("INSERT INTO users(name, email, password) VALUES(?,?,?)", (data['name'], data['email'], data['password']))
        db.commit()
        return {"msg": "User created successfully"}
    except:
        return {"error": "User already exists"}, 400
    finally:
        db.close()

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    db = db_conn()
    user = db.execute("SELECT * FROM users WHERE email=? AND password=?", (data['email'], data['password'])).fetchone()
    db.close()
    if user:
        return {"user_id": user["id"]}
    return {"error": "Invalid login"}, 401

@app.route("/projects", methods=["POST"])
def create_project():
    data = request.json
    db = db_conn()
    db.execute("INSERT INTO projects(name, user_id) VALUES(?,?)", (data['name'], data['user_id']))
    db.commit()
    db.close()
    return {"msg": "Project added"}

@app.route("/projects/<int:uid>")
def get_projects(uid):
    db = db_conn()
    rows = db.execute("SELECT * FROM projects WHERE user_id=?", (uid,)).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@app.route("/tasks", methods=["POST"])
def create_task():
    data = request.json
    db = db_conn()
    db.execute("INSERT INTO tasks(title, status, project_id, due_date) VALUES(?,?,?,?)", 
               (data['title'], "pending", data['project_id'], data['due_date']))
    db.commit()
    db.close()
    return {"msg": "Task added"}

@app.route("/tasks/<int:pid>")
def get_tasks(pid):
    db = db_conn()
    rows = db.execute("SELECT * FROM tasks WHERE project_id=?", (pid,)).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@app.route("/tasks/<int:tid>", methods=["PATCH"])
def update_status(tid):
    data = request.json
    db = db_conn()
    db.execute("UPDATE tasks SET status=? WHERE id=?", (data['status'], tid))
    db.commit()
    db.close()
    return {"msg": "Status updated"}

if __name__ == "__main__":
    app.run(debug=True)