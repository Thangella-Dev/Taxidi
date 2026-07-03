"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { LifeBuoy, MessageSquareText, ShieldAlert } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import type { SupportTicket } from "@/types/database";

const categories: SupportTicket["category"][] = ["account", "ride", "payment", "safety", "rider", "technical", "other"];

export default function SupportPage() {
  const [category, setCategory] = useState<SupportTicket["category"]>("ride");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const loadTickets = useCallback(async (profileId: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data, error } = await supabase.from("support_tickets").select("*").eq("created_by", profileId).order("created_at", { ascending: false });
    if (error) setMessage(error.message.includes("support_tickets") ? "Support setup is pending. Apply the latest Supabase migration." : error.message);
    else setTickets((data as SupportTicket[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) { queueMicrotask(() => setLoading(false)); return; }
    void getCurrentUser(supabase).then((user) => {
      setUserId(user?.id ?? null);
      if (user) void loadTickets(user.id);
      else setLoading(false);
    });
  }, [loadTickets]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!userId) { setMessage("Sign in before creating a support ticket."); return; }
    if (subject.trim().length < 4 || description.trim().length < 10) { setMessage("Add a clear subject and at least 10 characters of detail."); return; }
    const supabase = getSupabase();
    if (!supabase) return;
    setSubmitting(true);
    const { error } = await supabase.rpc("create_support_ticket", { p_category: category, p_description: description.trim(), p_related_ride_id: null, p_subject: subject.trim() });
    setSubmitting(false);
    if (error) { setMessage(error.message); return; }
    setSubject(""); setDescription("");
    setMessage("Support ticket created. Taxiro operations can now track it.");
    await loadTickets(userId);
  }

  return (
    <AppShell title="Support">
      <div className="mx-auto grid w-full max-w-6xl gap-4 px-3 py-5 sm:px-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:px-8 lg:py-8">
        <Card className="h-fit rounded-lg p-5">
          <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary"><LifeBuoy className="size-5" /></span><div><h1 className="text-xl font-black">Taxiro support</h1><p className="mt-1 text-sm text-muted-foreground">Create a tracked case for account, ride, payment, rider, safety, or technical issues.</p></div></div>
          {userId ? <form className="mt-5 grid gap-3" onSubmit={submit}>
            <div><Label htmlFor="support-category">Category</Label><select className="mt-1 h-11 w-full rounded-lg border border-border bg-card px-3 text-sm" id="support-category" onChange={(event) => setCategory(event.target.value as SupportTicket["category"])} value={category}>{categories.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select></div>
            <div><Label htmlFor="support-subject">Subject</Label><Input className="mt-1" id="support-subject" maxLength={120} onChange={(event) => setSubject(event.target.value)} placeholder="Short description of the issue" value={subject} /></div>
            <div><Label htmlFor="support-description">Details</Label><textarea className="mt-1 min-h-32 w-full rounded-lg border border-border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring" id="support-description" maxLength={2000} onChange={(event) => setDescription(event.target.value)} placeholder="What happened, when, and which ride was affected?" value={description} /></div>
            <Button disabled={submitting} type="submit">{submitting ? "Creating..." : "Create support ticket"}</Button>
          </form> : <div className="mt-5 rounded-lg bg-muted p-4 text-sm"><Link className="font-black underline" href="/auth">Sign in</Link> to create and track support cases.</div>}
          {message ? <p className="mt-3 text-sm text-muted-foreground" role="status">{message}</p> : null}
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"><ShieldAlert className="mt-0.5 size-4 shrink-0" /><p>For immediate danger, use the active-ride SOS control and contact local emergency services. A support ticket is not an emergency response channel.</p></div>
        </Card>
        <section className="min-w-0"><div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Case history</p><h2 className="mt-1 text-xl font-black">Your tickets</h2></div><Badge>{tickets.length}</Badge></div>
          {loading ? <Card className="rounded-lg p-5 text-sm text-muted-foreground">Loading tickets...</Card> : tickets.length ? <div className="grid gap-3">{tickets.map((ticket) => <Card className="rounded-lg p-4" key={ticket.id}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-black">{ticket.subject}</p><p className="mt-1 text-xs uppercase text-muted-foreground">{ticket.category} | {new Date(ticket.created_at).toLocaleString()}</p></div><Badge>{ticket.status.replace("_", " ")}</Badge></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{ticket.description}</p>{ticket.resolution ? <div className="mt-3 rounded-lg bg-secondary p-3 text-sm"><p className="font-black">Resolution</p><p className="mt-1">{ticket.resolution}</p></div> : null}</Card>)}</div> : <Card className="grid place-items-center rounded-lg p-8 text-center"><MessageSquareText className="size-6" /><p className="mt-2 font-black">No support tickets</p><p className="mt-1 text-sm text-muted-foreground">New cases and resolution status will appear here.</p></Card>}
        </section>
      </div>
    </AppShell>
  );
}
