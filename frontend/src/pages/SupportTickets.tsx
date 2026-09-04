/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import SEO from "@/components/SEO";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supportTicketsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Ticket, Plus, MessageSquare, Loader2 } from "lucide-react";

const SupportTickets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [responseText, setResponseText] = useState("");
  const [responding, setResponding] = useState(false);

  const [form, setForm] = useState({
    subject: "",
    description: "",
    category: "other",
    priority: "normal",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchTickets();
  }, [user, navigate]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await supportTicketsAPI.getMyTickets();
      if (res.success && res.data?.tickets) {
        setTickets(res.data.tickets);
      }
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.description) {
      toast({ variant: "destructive", title: "Required fields", description: "Subject and description are required." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await supportTicketsAPI.createTicket(form);
      if (res.success) {
        toast({ title: "Ticket created", description: "We'll get back to you soon." });
        setCreateOpen(false);
        setForm({ subject: "", description: "", category: "other", priority: "normal" });
        fetchTickets();
      } else {
        toast({ variant: "destructive", title: "Failed", description: res.message });
      }
    } catch {
      toast({ variant: "destructive", title: "Failed", description: "Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async () => {
    if (!selectedTicket || !responseText.trim()) return;
    setResponding(true);
    try {
      const res = await supportTicketsAPI.addResponse(selectedTicket._id || selectedTicket.id, responseText);
      if (res.success) {
        toast({ title: "Response sent" });
        setResponseText("");
        const fullRes = await supportTicketsAPI.getTicket(selectedTicket._id || selectedTicket.id);
        if (fullRes.success) setSelectedTicket(fullRes.data.ticket);
        fetchTickets();
      } else {
        toast({ variant: "destructive", title: "Failed", description: res.message });
      }
    } catch {
      toast({ variant: "destructive", title: "Failed" });
    } finally {
      setResponding(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen py-12">
      <SEO title="Support Tickets" description="Get help with your bookings and account." canonicalPath="/support" noindex />
      <div className="container max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif font-bold">Support Tickets</h1>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gaun-green hover:bg-gaun-light-green">
                <Plus className="h-4 w-4 mr-1.5" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Support Ticket</DialogTitle>
                <DialogDescription>Describe your issue and we'll help resolve it.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={4} className="mt-1.5" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="booking">Booking</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="listing">Listing</SelectItem>
                        <SelectItem value="account">Account</SelectItem>
                        <SelectItem value="safety">Safety</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                    Create Ticket
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
          </div>
        ) : tickets.length > 0 ? (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Card key={ticket._id || ticket.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedTicket(ticket)}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{ticket.subject}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(ticket.createdAt), "MMM d, yyyy")} · {ticket.category}
                    </p>
                  </div>
                  <Badge variant={ticket.status === "open" ? "default" : ticket.status === "resolved" ? "success" : "secondary"}>
                    {ticket.status.replace("_", " ")}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                  {ticket.responses?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {ticket.responses.length} response{ticket.responses.length > 1 ? "s" : ""}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border rounded-lg">
            <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-1">No support tickets</h3>
            <p className="text-muted-foreground mb-4">Create a ticket if you need help with anything.</p>
          </div>
        )}

        {/* Ticket Detail Dialog */}
        <Dialog open={!!selectedTicket} onOpenChange={(open) => { if (!open) { setSelectedTicket(null); setResponseText(""); } }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedTicket?.subject}</DialogTitle>
              <DialogDescription>
                {selectedTicket && format(new Date(selectedTicket.createdAt), "MMM d, yyyy")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm">{selectedTicket?.description}</p>
              </div>
              {selectedTicket?.responses?.map((r: any, i: number) => (
                <div key={i} className={`rounded-lg p-3 ${r.isStaff ? "bg-gaun-green/10" : "bg-muted/50"}`}>
                  <p className="text-xs font-medium mb-1">
                    {r.author?.name || "User"} {r.isStaff && <span className="text-gaun-green">(Staff)</span>}
                  </p>
                  <p className="text-sm">{r.body}</p>
                </div>
              ))}
            </div>
            {selectedTicket && !["resolved", "closed"].includes(selectedTicket.status) && (
              <div className="space-y-2">
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Write a response..."
                  rows={2}
                />
                <Button onClick={handleRespond} disabled={responding || !responseText.trim()} className="w-full">
                  {responding ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  Send Response
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SupportTickets;
