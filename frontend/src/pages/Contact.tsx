import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import HelpAssistant from "@/components/ai/HelpAssistant";
import Translation from "@/components/ai/Translation";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      toast({ title: "Message sent", description: "We'll get back to you as soon as possible." });
      setName("");
      setEmail("");
      setMessage("");
      setSubject("");
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative py-20 md:py-28 flex items-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url('https://images.pexels.com/photos/1588134/pexels-photo-1588134.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container">
          <div className="max-w-2xl text-white">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold tracking-tight mb-4">
              Contact us
            </h1>
            <p className="text-xl md:text-2xl text-white/85">
              We'd love to hear from you
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
            {/* Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-semibold tracking-tight mb-4">Get in touch</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Whether you have a question about our homestays, want to become a host, or just want to say hello, we're here to help.
                </p>
              </div>

              <div className="space-y-5">
                {[
                  { icon: Phone, title: "Phone", value: "+977 98 275 142 82" },
                  { icon: Mail, title: "Email", value: "info@gaunbasti.com" },
                  { icon: MapPin, title: "Office", value: "Thamel, Kathmandu, Nepal" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div>
              <div className="bg-white border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                <h3 className="font-display text-xl font-semibold mb-6">Send us a message</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Your name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email address</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="message">Your message</Label>
                    <Textarea id="message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required className="mt-1.5" />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    <Send className="h-4 w-4" />
                    {isSubmitting ? "Sending..." : "Send message"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="pb-16 md:pb-20">
        <div className="container">
          <div className="rounded-2xl overflow-hidden border border-border h-80 md:h-96">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              title="Gau Basti Office Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3532.2259422608466!2d85.30732431506479!3d27.713907382789422!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb18fcb77fd4f7%3A0x58099b8d37d5da04!2sThamel%2C%20Kathmandu%2044600%2C%20Nepal!5e0!3m2!1sen!2sus!4v1647889764931!5m2!1sen!2sus"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* AI Tools Section */}
      <section className="pb-16 md:pb-20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HelpAssistant />
            <Translation />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
