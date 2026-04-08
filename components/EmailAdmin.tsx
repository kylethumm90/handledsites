"use client";

import { useState } from "react";

type Template = {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  trigger_type: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

type LogEntry = {
  id: string;
  template_id: string | null;
  business_id: string | null;
  trigger_type: string;
  recipient_email: string;
  subject: string;
  status: string;
  error_message: string | null;
  resend_id: string | null;
  created_at: string;
  email_templates: { name: string } | null;
};

type Props = {
  templates: Template[];
  logs: LogEntry[];
};

const TRIGGER_OPTIONS = ["signup", "upgrade", "downgrade"];
const VARIABLES = [
  "business_name", "owner_name", "phone", "email",
  "city", "state", "trade", "services", "slug", "site_url",
];

const EMPTY_FORM = { name: "", subject: "", body_html: "", trigger_type: "signup" };

export default function EmailAdmin({ templates: initialTemplates, logs: initialLogs }: Props) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [logs] = useState(initialLogs);
  const [editing, setEditing] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"templates" | "logs">("templates");

  const startCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setCreating(true);
  };

  const startEdit = (tpl: Template) => {
    setCreating(false);
    setEditing(tpl);
    setForm({ name: tpl.name, subject: tpl.subject, body_html: tpl.body_html, trigger_type: tpl.trigger_type });
  };

  const cancel = () => {
    setEditing(null);
    setCreating(false);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (creating) {
        const res = await fetch("/api/admin/email-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Create failed");
        const tpl = await res.json();
        setTemplates([tpl, ...templates]);
      } else if (editing) {
        const res = await fetch(`/api/admin/email-templates/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Update failed");
        const tpl = await res.json();
        setTemplates(templates.map((t) => (t.id === tpl.id ? tpl : t)));
      }
      cancel();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error saving template");
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (tpl: Template) => {
    const res = await fetch(`/api/admin/email-templates/${tpl.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_enabled: !tpl.is_enabled }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTemplates(templates.map((t) => (t.id === updated.id ? updated : t)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    const res = await fetch(`/api/admin/email-templates/${id}`, { method: "DELETE" });
    if (res.ok) setTemplates(templates.filter((t) => t.id !== id));
  };

  const labelClass = "font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted mb-1 block";
  const inputClass = "w-full border border-border-dark bg-paper px-3 py-2 font-mono text-xs text-ink outline-none focus:border-ink";

  const showForm = creating || editing;

  return (
    <div>
      {/* Section header */}
      <div className="mb-6 flex items-end justify-between border-b-2 border-ink pb-2">
        <h1 className="font-display text-2xl text-ink">Email Automation</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("templates")}
            className={`font-mono text-[10px] font-medium uppercase tracking-[0.12em] px-3 py-1 ${tab === "templates" ? "text-ink border-b-2 border-ink" : "text-muted hover:text-ink"}`}
          >
            Templates
          </button>
          <button
            onClick={() => setTab("logs")}
            className={`font-mono text-[10px] font-medium uppercase tracking-[0.12em] px-3 py-1 ${tab === "logs" ? "text-ink border-b-2 border-ink" : "text-muted hover:text-ink"}`}
          >
            Send Log
          </button>
        </div>
      </div>

      {tab === "templates" && (
        <>
          {/* Create / Edit form */}
          {showForm && (
            <div className="mb-6 border border-border-dark p-5">
              <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted mb-4">
                {creating ? "New Template" : "Edit Template"}
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={labelClass}>Name</label>
                  <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Welcome Email" />
                </div>
                <div>
                  <label className={labelClass}>Trigger</label>
                  <select className={inputClass} value={form.trigger_type} onChange={(e) => setForm({ ...form, trigger_type: e.target.value })}>
                    {TRIGGER_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className={labelClass}>Subject</label>
                <input className={inputClass} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Welcome to handled., {{owner_name}}!" />
              </div>
              <div className="mb-4">
                <label className={labelClass}>Body (HTML)</label>
                <textarea className={`${inputClass} min-h-[200px]`} value={form.body_html} onChange={(e) => setForm({ ...form, body_html: e.target.value })} placeholder="<div>...</div>" />
              </div>
              <div className="mb-4 border border-border-dark bg-cream p-3">
                <span className={labelClass}>Available Variables</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {VARIABLES.map((v) => (
                    <code key={v} className="font-mono text-[11px] text-ink bg-paper border border-border-dark px-1.5 py-0.5">{`{{${v}}}`}</code>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSave} disabled={saving} className="bg-ink text-paper px-4 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] hover:bg-charcoal disabled:opacity-50">
                  {saving ? "Saving..." : "Save Template"}
                </button>
                <button onClick={cancel} className="border border-border-dark px-4 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted hover:text-ink">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Templates table */}
          <div className="flex justify-between items-center mb-3">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">{templates.length} template{templates.length !== 1 ? "s" : ""}</span>
            {!showForm && (
              <button onClick={startCreate} className="bg-ink text-paper px-4 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] hover:bg-charcoal">
                + New Template
              </button>
            )}
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-t-2 border-b border-ink">
                <th className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted py-2">Name</th>
                <th className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted py-2">Trigger</th>
                <th className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted py-2">Subject</th>
                <th className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted py-2 text-center">Status</th>
                <th className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((tpl) => (
                <tr key={tpl.id} className="border-b border-border-dark">
                  <td className="py-2.5 text-xs font-medium text-ink">{tpl.name}</td>
                  <td className="py-2.5 font-mono text-[11px] text-muted">{tpl.trigger_type}</td>
                  <td className="py-2.5 text-xs text-muted max-w-[200px] truncate">{tpl.subject}</td>
                  <td className="py-2.5 text-center">
                    <button
                      onClick={() => toggleEnabled(tpl)}
                      className={`font-mono text-[10px] font-medium uppercase tracking-[0.08em] px-2.5 py-0.5 border ${tpl.is_enabled ? "text-green-700 border-green-300 bg-green-50" : "text-muted border-border-dark"}`}
                    >
                      {tpl.is_enabled ? "ON" : "OFF"}
                    </button>
                  </td>
                  <td className="py-2.5 text-right">
                    <button onClick={() => startEdit(tpl)} className="font-mono text-[10px] text-muted hover:text-ink mr-3">Edit</button>
                    <button onClick={() => handleDelete(tpl.id)} className="font-mono text-[10px] text-red-400 hover:text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-xs text-muted">No templates yet. Create one to get started.</td></tr>
              )}
            </tbody>
          </table>
        </>
      )}

      {tab === "logs" && (
        <>
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted mb-3 block">Recent sends (last 50)</span>
          <table className="w-full text-left">
            <thead>
              <tr className="border-t-2 border-b border-ink">
                <th className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted py-2">Date</th>
                <th className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted py-2">Recipient</th>
                <th className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted py-2">Template</th>
                <th className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted py-2">Trigger</th>
                <th className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border-dark">
                  <td className="py-2.5 font-mono text-[11px] text-muted">
                    {new Date(log.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                    {new Date(log.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </td>
                  <td className="py-2.5 text-xs text-ink">{log.recipient_email || "—"}</td>
                  <td className="py-2.5 text-xs text-muted">{log.email_templates?.name || "—"}</td>
                  <td className="py-2.5 font-mono text-[11px] text-muted">{log.trigger_type}</td>
                  <td className="py-2.5 text-center">
                    <span className={`font-mono text-[10px] font-medium uppercase tracking-[0.08em] px-2 py-0.5 ${
                      log.status === "sent" ? "text-green-700 bg-green-50" :
                      log.status === "failed" ? "text-red-600 bg-red-50" :
                      "text-muted bg-gray-100"
                    }`} title={log.error_message || undefined}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-xs text-muted">No emails sent yet.</td></tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
