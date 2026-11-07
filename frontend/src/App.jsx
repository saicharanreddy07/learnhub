import { useEffect, useMemo, useState } from "react";
import { BookOpen, Plus, Search, ArrowLeft, CheckCircle2, Circle, Trash2, ExternalLink, GraduationCap, LayoutDashboard, BookMarked } from "lucide-react";

const API = "/api";
async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed (${response.status})`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export default function App() {
  const [topics, setTopics] = useState([]);
  const [selected, setSelected] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [notes, setNotes] = useState([]);
  const [resources, setResources] = useState([]);
  const [tab, setTab] = useState("lessons");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [topicTitle, setTopicTitle] = useState("");
  const [topicDescription, setTopicDescription] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");

  async function loadTopics() {
    try { setTopics(await request("/topics")); setError(""); }
    catch (e) { setError(`Cannot reach the API: ${e.message}`); }
  }
  useEffect(() => { loadTopics(); }, []);

  async function openTopic(topic) {
    setTab("lessons");
    try {
      const [freshTopic, l, n, r] = await Promise.all([
        request(`/topics/${topic.id}`),
        request(`/topics/${topic.id}/lessons`),
        request(`/topics/${topic.id}/notes`),
        request(`/topics/${topic.id}/resources`),
      ]);
      setSelected(freshTopic);
      setLessons(l); setNotes(n); setResources(r); setError("");
    } catch (e) { setError(e.message); }
  }

  async function addTopic(e) {
    e.preventDefault();
    try {
      await request("/topics", { method: "POST", body: JSON.stringify({ title: topicTitle, description: topicDescription }) });
      setTopicTitle(""); setTopicDescription(""); setShowTopicForm(false); await loadTopics();
    } catch (e) { setError(e.message); }
  }

  async function addLesson(e) {
    e.preventDefault();
    if (!lessonTitle.trim()) return;
    await request(`/topics/${selected.id}/lessons`, { method: "POST", body: JSON.stringify({ title: lessonTitle }) });
    setLessonTitle(""); await refreshSelected();
  }
  async function toggleLesson(lesson) {
    await request(`/lessons/${lesson.id}?is_completed=${!lesson.is_completed}`, { method: "PATCH" });
    await refreshSelected();
  }
  async function removeLesson(id) {
    await request(`/lessons/${id}`, { method: "DELETE" }); await refreshSelected();
  }
  async function addNote(e) {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    await request(`/topics/${selected.id}/notes`, { method: "POST", body: JSON.stringify({ title: noteTitle, content: noteContent }) });
    setNoteTitle(""); setNoteContent(""); await refreshSelected();
  }
  async function removeNote(id) {
    await request(`/notes/${id}`, { method: "DELETE" }); await refreshSelected();
  }
  async function addResource(e) {
    e.preventDefault();
    if (!resourceTitle.trim() || !resourceUrl.trim()) return;
    await request(`/topics/${selected.id}/resources`, { method: "POST", body: JSON.stringify({ title: resourceTitle, url: resourceUrl }) });
    setResourceTitle(""); setResourceUrl(""); await refreshSelected();
  }
  async function refreshSelected() {
    await loadTopics();
    if (selected) await openTopic(selected);
  }
  async function deleteTopic() {
    if (!confirm(`Delete "${selected.title}" and all its notes and lessons?`)) return;
    await request(`/topics/${selected.id}`, { method: "DELETE" });
    setSelected(null); await loadTopics();
  }

  const filtered = useMemo(() => topics.filter(t => `${t.title} ${t.description}`.toLowerCase().includes(search.toLowerCase())), [topics, search]);
  const totalLessons = topics.reduce((sum, t) => sum + t.lesson_count, 0);
  const doneLessons = topics.reduce((sum, t) => sum + t.completed_count, 0);
  const overall = totalLessons ? Math.round(doneLessons / totalLessons * 100) : 0;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><GraduationCap size={22}/></div><span>learn<span className="brand-accent">hub</span></span></div>
      <div className="side-label">WORKSPACE</div>
      <button className={`nav-item ${!selected ? "active" : ""}`} onClick={() => setSelected(null)}><LayoutDashboard size={18}/> Dashboard</button>
      <div className="side-label side-bottom">YOUR SPACE</div>
      <div className="sidebar-tip"><BookMarked size={19}/><strong>Small steps add up.</strong><span>Capture what you learn today. Future you will thank you.</span></div>
      <div className="sidebar-footer">Personal learning workspace</div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> {selected ? selected.title : "Dashboard"}</div><div className="avatar">LH</div></header>
      {error && <div className="error-banner">{error}</div>}
      {!selected ? <section className="content">
        <div className="hero-row"><div><div className="eyebrow">YOUR PERSONAL LEARNING SPACE</div><h1>Keep learning. <span>Keep growing.</span></h1><p className="muted">Organize what you're learning and keep everything you've discovered in one place.</p></div><button className="primary-btn" onClick={() => setShowTopicForm(!showTopicForm)}><Plus size={17}/> New topic</button></div>
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon purple"><BookOpen size={19}/></div><div><div className="stat-value">{topics.length}</div><div className="stat-label">Learning topics</div></div></div>
          <div className="stat-card"><div className="stat-icon green"><CheckCircle2 size={19}/></div><div><div className="stat-value">{doneLessons}<small> / {totalLessons}</small></div><div className="stat-label">Lessons completed</div></div></div>
          <div className="stat-card"><div className="stat-icon orange"><GraduationCap size={19}/></div><div><div className="stat-value">{overall}%</div><div className="stat-label">Overall progress</div></div></div>
        </div>
        {showTopicForm && <form className="form-card topic-form" onSubmit={addTopic}><div className="form-heading">Create a learning topic</div><input autoFocus placeholder="e.g. Python, Docker, System Design" value={topicTitle} onChange={e=>setTopicTitle(e.target.value)} required/><textarea placeholder="What do you want to learn?" value={topicDescription} onChange={e=>setTopicDescription(e.target.value)}/><div className="form-actions"><button type="button" className="secondary-btn" onClick={()=>setShowTopicForm(false)}>Cancel</button><button className="primary-btn">Create topic</button></div></form>}
        <div className="section-heading"><div><h2>Your topics</h2><p className="muted">Choose a topic to open its learning workspace.</p></div><div className="search-box"><Search size={16}/><input placeholder="Search topics..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
        {filtered.length ? <div className="topic-grid">{filtered.map(topic=><button className="topic-card" key={topic.id} onClick={()=>openTopic(topic)}><div className="topic-card-top"><div className="topic-symbol"><BookOpen size={20}/></div><span className="card-arrow">↗</span></div><h3>{topic.title}</h3><p>{topic.description || "No description added yet."}</p><div className="topic-meta"><span>{topic.completed_count}/{topic.lesson_count} lessons</span><strong>{topic.progress}%</strong></div><div className="progress-track"><div className="progress-fill" style={{width:`${topic.progress}%`}}/></div><div className="topic-footer"><span>{topic.note_count} notes</span><span>Open workspace →</span></div></button>)}</div> : <div className="empty-state"><div className="empty-icon"><BookOpen size={26}/></div><h3>{search ? "No matching topics" : "Your learning journey starts here"}</h3><p>{search ? "Try another search term." : "Create your first topic, add lessons and save notes as you learn."}</p>{!search && <button className="primary-btn" onClick={()=>setShowTopicForm(true)}><Plus size={17}/> Create your first topic</button>}</div>}
      </section> : <section className="content">
        <button className="back-btn" onClick={()=>setSelected(null)}><ArrowLeft size={16}/> All topics</button>
        <div className="detail-header"><div><div className="eyebrow">LEARNING WORKSPACE</div><h1>{selected.title}</h1><p className="muted">{selected.description}</p></div><button className="icon-btn danger" title="Delete topic" onClick={deleteTopic}><Trash2 size={17}/></button></div>
        <div className="detail-progress"><div><strong>{selected.progress}% complete</strong><span>{selected.completed_count} of {selected.lesson_count} lessons completed</span></div><div className="progress-track"><div className="progress-fill" style={{width:`${selected.progress}%`}}/></div></div>
        <div className="tabs">{["lessons","notes","resources"].map(t=><button key={t} className={tab===t?"tab active-tab":"tab"} onClick={()=>setTab(t)}>{t[0].toUpperCase()+t.slice(1)} <span>{t==="lessons"?lessons.length:t==="notes"?notes.length:resources.length}</span></button>)}</div>
        {tab==="lessons" && <div className="workspace-grid"><div className="panel"><h3>Learning checklist</h3><p className="muted">Break this topic into small, achievable steps.</p>{lessons.length ? lessons.map(l=><div className="lesson-row" key={l.id}><button className={`check-btn ${l.is_completed?"checked":""}`} onClick={()=>toggleLesson(l)}>{l.is_completed?<CheckCircle2 size={20}/>:<Circle size={20}/>}</button><span className={l.is_completed?"completed":""}>{l.title}</span><button className="tiny-delete" onClick={()=>removeLesson(l.id)}><Trash2 size={15}/></button></div>) : <div className="small-empty">No lessons yet. Add your first learning milestone.</div>}<form className="inline-form" onSubmit={addLesson}><input placeholder="Add a lesson or milestone..." value={lessonTitle} onChange={e=>setLessonTitle(e.target.value)}/><button className="primary-btn" disabled={!lessonTitle.trim()}><Plus size={16}/> Add</button></form></div><div className="panel side-panel"><div className="side-panel-icon"><GraduationCap size={21}/></div><h3>Keep your momentum</h3><p className="muted">Mark lessons complete as you learn. Your progress updates automatically on the dashboard.</p><div className="mini-stat"><strong>{selected.progress}%</strong><span>topic progress</span></div></div></div>}
        {tab==="notes" && <div className="workspace-grid"><div className="panel"><h3>Knowledge notes</h3><p className="muted">Capture explanations, commands, code snippets and things worth remembering.</p><form className="note-form" onSubmit={addNote}><input placeholder="Note title" value={noteTitle} onChange={e=>setNoteTitle(e.target.value)} required/><textarea placeholder="Write your notes here... Markdown is supported in our next iteration." rows="6" value={noteContent} onChange={e=>setNoteContent(e.target.value)}/><button className="primary-btn" disabled={!noteTitle.trim()}><Plus size={16}/> Save note</button></form></div><div className="panel"><h3>Saved notes ({notes.length})</h3>{notes.length ? notes.map(n=><article className="note-card" key={n.id}><div className="note-card-head"><strong>{n.title}</strong><button className="tiny-delete" onClick={()=>removeNote(n.id)}><Trash2 size={15}/></button></div><p>{n.content || "No content."}</p></article>) : <div className="small-empty">Your saved notes will appear here.</div>}</div></div>}
        {tab==="resources" && <div className="workspace-grid"><div className="panel"><h3>Useful resources</h3><p className="muted">Keep documentation, tutorials and articles connected to this topic.</p><form className="note-form" onSubmit={addResource}><input placeholder="Resource title" value={resourceTitle} onChange={e=>setResourceTitle(e.target.value)} required/><input placeholder="https://..." type="url" value={resourceUrl} onChange={e=>setResourceUrl(e.target.value)} required/><button className="primary-btn"><Plus size={16}/> Save resource</button></form></div><div className="panel"><h3>Saved links ({resources.length})</h3>{resources.map(r=><a className="resource-link" href={r.url} target="_blank" rel="noreferrer" key={r.id}><span>{r.title}</span><ExternalLink size={15}/></a>)}{!resources.length && <div className="small-empty">No resources saved yet.</div>}</div></div>}
      </section>}
    </main>
  </div>;
}
