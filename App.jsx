import { useState } from "react";

export default function App() {
  const [user, setUser] = useState(null);
  const [isSignup, setIsSignup] = useState(false);
  
  // Auth States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Dashboard States
  const [projects, setProjects] = useState([]);
  const [activePid, setActivePid] = useState(null);
  const [tasks, setTasks] = useState([]);

  // Input States
  const [pName, setPName] = useState("");
  const [tTitle, setTTitle] = useState("");
  const [tDate, setTDate] = useState("");

  const apiBase = "http://127.0.0.1:5000";

  const handleAuth = async () => {
    const endpoint = isSignup ? "/signup" : "/login";
    const body = isSignup ? { name, email, password } : { email, password };
    
    const res = await fetch(apiBase + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    
    const data = await res.json();
    if (data.user_id) {
      setUser(data.user_id);
      loadProjects(data.user_id);
    } else if (data.msg) {
      alert(data.msg);
      setIsSignup(false);
    } else {
      alert(data.error);
    }
  };

  const loadProjects = async (uid) => {
    const res = await fetch(`${apiBase}/projects/${uid}`);
    setProjects(await res.json());
  };

  const addProject = async () => {
    await fetch(`${apiBase}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: pName, user_id: user })
    });
    setPName("");
    loadProjects(user);
  };

  const loadTasks = async (pid) => {
    setActivePid(pid);
    const res = await fetch(`${apiBase}/tasks/${pid}`);
    setTasks(await res.json());
  };

  const addTask = async () => {
    if (!tTitle || !tDate) return alert("Fill all fields");
    await fetch(`${apiBase}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: tTitle, project_id: activePid, due_date: tDate })
    });
    setTTitle(""); setTDate("");
    loadTasks(activePid);
  };

  const toggleTask = async (id, current) => {
    const nextStatus = current === "pending" ? "completed" : "pending";
    await fetch(`${apiBase}/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    loadTasks(activePid);
  };

  if (!user) return (
    <div className="container mt-5" style={{ maxWidth: '400px' }}>
      <div className="card p-4 shadow border-0 rounded-4">
        <h3 className="text-center fw-bold">{isSignup ? "Join Us" : "Login"}</h3>
        {isSignup && <input className="form-control my-3" placeholder="Name" onChange={e => setName(e.target.value)} />}
        <input className="form-control mb-3" placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input className="form-control mb-3" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <button className="btn btn-primary w-100 mb-3" onClick={handleAuth}>{isSignup ? "Sign Up" : "Login"}</button>
        <button className="btn btn-link w-100 text-decoration-none text-muted" onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? "Back to Login" : "No account? Sign Up"}
        </button>
      </div>
    </div>
  );

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4">Team Task Dashboard</h2>
      <div className="row g-4">
        <div className="col-md-4">
          <div className="card p-3 shadow-sm border-0 mb-4 rounded-3">
            <h5 className="fw-bold">Projects</h5>
            <div className="input-group">
              <input className="form-control" value={pName} onChange={e => setPName(e.target.value)} placeholder="Title" />
              <button className="btn btn-dark" onClick={addProject}>Add</button>
            </div>
          </div>
          <div className="list-group shadow-sm">
            {projects.map(p => (
              <button key={p.id} onClick={() => loadTasks(p.id)} className={`list-group-item list-group-item-action border-0 mb-1 rounded ${activePid === p.id ? 'active' : ''}`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="col-md-8">
          <div className="card p-4 shadow-sm border-0 rounded-3">
            {activePid ? (
              <>
                <h5 className="fw-bold mb-3">Task Management</h5>
                <div className="row g-2 mb-4">
                  <div className="col-7"><input className="form-control" placeholder="Task" value={tTitle} onChange={e => setTTitle(e.target.value)} /></div>
                  <div className="col-3"><input type="date" className="form-control" value={tDate} onChange={e => setTDate(e.target.value)} /></div>
                  <div className="col-2"><button className="btn btn-primary w-100" onClick={addTask}>Add</button></div>
                </div>
                <ul className="list-group list-group-flush">
                  {tasks.map(t => {
                    const isLate = t.status === "pending" && t.due_date < today;
                    return (
                      <li key={t.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                        <div>
                          <span className={t.status === 'completed' ? 'text-decoration-line-through text-muted' : 'fw-bold'}>{t.title}</span>
                          <br /><small className="text-muted">Due: {t.due_date}</small>
                          {isLate && <span className="badge bg-danger ms-2">Overdue</span>}
                        </div>
                        <span onClick={() => toggleTask(t.id, t.status)} className={`badge p-2 ${t.status === 'completed' ? 'bg-success' : 'bg-warning text-dark'}`} style={{ cursor: 'pointer', minWidth: '80px' }}>
                          {t.status}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </>
            ) : <p className="text-center text-muted py-5">Select a project to begin</p>}
          </div>
        </div>
      </div>
    </div>
  );
}