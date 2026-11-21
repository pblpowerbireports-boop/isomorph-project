import { useCallback, useEffect, useState } from "react";
import { isomorph } from "./isomorph.client";
import { isBuilder, isLocalRun, useAccess, type AppUser } from "./access";

type Note = { id: number; title: string; done: boolean; created_at: string };
type AppRole = { email: string; role: string; granted_by: string };
type StoredFile = { path?: string; name?: string; size?: number };

// Appearance lives in src/styles.css (tokens, shell, components): extend it; rules in design.md in the isomorph skill.
export function App() {
  const access = useAccess();
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">Isomorph starter</span>
          <nav className="nav" aria-label="Sections"><a href="#" aria-current="page">Overview</a></nav>
          {access.state === "ready" && <span className="who">{access.user.email}{isBuilder(access.user) ? " · builder" : ""}{isLocalRun(location.hostname) ? " (a test user while running locally)" : ""}</span>}
        </div>
      </header>
      <main className="page">
        {access.state === "loading" && <p className="muted">Signing in…</p>}
        {access.state === "signed-out" && <p className="muted">Sign in to use this app.</p>}
        {access.state === "ready" && <Workspace user={access.user} />}
      </main>
    </>
  );
}

// Nothing here mounts before the person is known, so every read runs as them.
function Workspace({ user }: { user: AppUser }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [grant, setGrant] = useState({ email: "", role: "" });
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    const { data } = await isomorph.data.from<Note>("notes").select("*").order("created_at", { ascending: false });
    setNotes(data);
  }, []);
  // A member reads their own row only; the builder reads them all (migrations/0002_app_roles.sql).
  const loadRoles = useCallback(async () => {
    const { data } = await isomorph.data.from<AppRole>("app_roles").select("*").order("email");
    setRoles(data);
  }, []);
  // Each person's files live in the folder named by their user id; Isomorph refuses any other folder.
  const myFolder = `${user.id}/`;
  const loadFiles = useCallback(async () => { setFiles((await isomorph.files.list(myFolder)) as StoredFile[]); }, [myFolder]);

  useEffect(() => {
    const report = (err: unknown) => setError(String(err));
    loadNotes().catch(report);
    loadRoles().catch(report);
    loadFiles().catch(report);
  }, [loadNotes, loadRoles, loadFiles]);

  const addNote = async () => {
    if (!title.trim()) return;
    await isomorph.data.from("notes").insert({ title: title.trim() });
    setTitle("");
    await loadNotes();
  };
  const toggle = async (note: Note) => { await isomorph.data.from("notes").update({ done: !note.done }).eq("id", note.id); await loadNotes(); };
  const remove = async (note: Note) => { await isomorph.data.from("notes").delete().eq("id", note.id); await loadNotes(); };
  const setRole = async () => {
    const email = grant.email.trim().toLowerCase();
    const role = grant.role.trim();
    if (!email || !role) return;
    await isomorph.data.from("app_roles").upsert({ email, role }, { onConflict: "email" });
    setGrant({ email: "", role: "" });
    await loadRoles();
  };
  const revoke = async (entry: AppRole) => { await isomorph.data.from("app_roles").delete().eq("email", entry.email); await loadRoles(); };
  const upload = async (file: File) => { await isomorph.files.upload(`${myFolder}${file.name}`, file); await loadFiles(); };
  const myRole = roles.find(entry => entry.email === user.email)?.role;
  const open = notes.filter(note => !note.done).length;

  // Company systems and AI are not part of the starter. Rules for adding
  // either: integrations.md and ai.md in the isomorph skill.

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Overview</h1>
          <p>A placeholder page; your app replaces it.{myRole ? ` Your role here: ${myRole}.` : ""}</p>
        </div>
      </div>
      {error && <p role="alert" className="alert">{error}</p>}

      <div className="grid" style={{ marginBottom: "var(--s5)" }}>
        <div className="stat"><div className="label">Notes</div><div className="value">{notes.length}</div></div>
        <div className="stat"><div className="label">Open</div><div className="value">{open}</div></div>
        <div className="stat"><div className="label">Files</div><div className="value">{files.length}</div></div>
      </div>

      <div className="grid">
        {/* Setup — the builder names who does what (migrations/0002_app_roles.sql); members never see this card. */}
        {isBuilder(user) && (
          <section className="card">
            <h2>Setup</h2>
            <p>Who does what in this app. A role is your own word for it, such as "approver".</p>
            <form className="row" onSubmit={event => { event.preventDefault(); void setRole(); }}>
              <input type="email" value={grant.email} onChange={event => setGrant({ ...grant, email: event.target.value })} placeholder="person@company.com" aria-label="Email" />
              <input value={grant.role} onChange={event => setGrant({ ...grant, role: event.target.value })} placeholder="Role, e.g. approver" aria-label="Role" />
              <button type="submit" className="primary">Set role</button>
            </form>
            {roles.length === 0 ? <p className="empty" style={{ marginTop: "var(--s4)" }}>Nobody has a role yet.</p> : (
              <div className="table-wrap" style={{ marginTop: "var(--s4)" }}>
                <table>
                  <thead><tr><th>Person</th><th>Role</th><th aria-label="Actions"></th></tr></thead>
                  <tbody>
                    {roles.map(entry => (
                      <tr key={entry.email}>
                        <td>{entry.email}</td>
                        <td><span className="badge">{entry.role}</span></td>
                        <td className="num"><button type="button" className="ghost" onClick={() => void revoke(entry)} aria-label={`Remove ${entry.email}`}>Remove</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Notes — each person's own rows, schema in migrations/0001_notes.sql. Rules: core.md in the isomorph skill (data). */}
        <section className="card">
          <h2>Notes</h2>
          <p>Yours only; nobody else can read them.</p>
          <form className="row" onSubmit={event => { event.preventDefault(); void addNote(); }}>
            <input value={title} onChange={event => setTitle(event.target.value)} placeholder="New note" aria-label="New note" />
            <button type="submit" className="primary">Add</button>
          </form>
          {notes.length === 0 ? <p className="empty" style={{ marginTop: "var(--s4)" }}>No notes yet. Add the first one above.</p> : (
            <ul className="list" style={{ marginTop: "var(--s3)" }}>
              {notes.map(note => (
                <li key={note.id} className={note.done ? "done" : undefined}>
                  <label><input type="checkbox" checked={note.done} onChange={() => void toggle(note)} /> {note.title}</label>
                  <button type="button" className="ghost" onClick={() => void remove(note)} aria-label={`Delete ${note.title}`}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Private files: the app's own file store (isomorph.files.*). */}
        <section className="card">
          <h2>Private files</h2>
          <p>Stored for you alone.</p>
          <input type="file" aria-label="Upload file" onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
          {files.length === 0 ? <p className="empty" style={{ marginTop: "var(--s3)" }}>No files yet.</p> : (
            <ul className="list" style={{ marginTop: "var(--s3)" }}>
              {files.map((file, index) => <li key={index}><span>{file.path ?? file.name}</span>{file.size !== undefined ? <span className="muted small">{file.size} bytes</span> : null}</li>)}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
