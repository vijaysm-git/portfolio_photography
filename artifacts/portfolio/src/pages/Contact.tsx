import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { z } from "zod";
import {
  useCreateContactSubmission,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, MessageCircle, Send, Loader2, Mail, Phone } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/15551234567";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  eventType: z.string().min(1, "Choose an event type"),
  message: z.string().min(1, "A short message helps"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const create = useCreateContactSubmission();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", phone: "", email: "", eventType: "", message: "" },
  });

  function onSubmit(values: FormValues) {
    create.mutate(
      {
        data: {
          name: values.name,
          phone: values.phone,
          email: values.email && values.email.length > 0 ? values.email : null,
          eventType: values.eventType,
          message: values.message,
        },
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          form.reset();
        },
        onError: (err) => {
          console.error(err);
          alert("Something went wrong sending your inquiry. Please try again or message us on WhatsApp.");
        },
      },
    );
  }

  return (
    <div className="bg-background">
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <p className="text-xs tracking-[0.4em] uppercase text-accent mb-5">Inquiries</p>
          <h1 className="font-display text-5xl lg:text-7xl text-balance max-w-3xl" data-testid="text-contact-title">
            Let's begin a conversation.
          </h1>
          <p className="mt-6 text-muted-foreground text-lg max-w-2xl">
            Tell us about your project, your dates, and the feel you're after. We respond within two business days.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-3"
          >
            <p className="text-xs tracking-[0.4em] uppercase text-accent">Direct</p>
            <h2 className="font-display text-3xl">Reach out directly</h2>
            <p className="text-muted-foreground">
              Prefer a quick message? Tap WhatsApp to start a thread, or write us at the address below.
            </p>
          </motion.div>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 p-5 rounded-lg border border-accent/30 bg-accent/5 hover:bg-accent/10 transition"
            data-testid="link-whatsapp"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-medium">Chat on WhatsApp</p>
              <p className="text-sm text-muted-foreground">Usually replies within the hour</p>
            </div>
            <Send className="h-4 w-4 text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </a>

          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-accent" />
              <span>hello@lumiere.studio</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-accent" />
              <span>+1 (555) 123-4567</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-accent/30 bg-card rounded-lg p-10 text-center"
              data-testid="success-card"
            >
              <CheckCircle2 className="h-12 w-12 text-accent mx-auto mb-4" />
              <h2 className="font-display text-3xl mb-3">Message received</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Thank you for reaching out. We've got your note and will respond personally within two business days.
              </p>
              <Button
                variant="outline"
                className="mt-8"
                onClick={() => setSubmitted(false)}
                data-testid="button-send-another"
              >
                Send another inquiry
              </Button>
            </motion.div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="border border-border bg-card rounded-lg p-8 lg:p-10 space-y-6"
                data-testid="form-contact"
              >
                <div className="grid sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 ..." {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What's the project?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-event-type">
                            <SelectValue placeholder="Choose one" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="wedding" data-testid="option-wedding">Wedding</SelectItem>
                          <SelectItem value="event" data-testid="option-event">Event</SelectItem>
                          <SelectItem value="portrait" data-testid="option-portrait">Portrait session</SelectItem>
                          <SelectItem value="studio" data-testid="option-studio">Studio / commercial</SelectItem>
                          <SelectItem value="other" data-testid="option-other">Something else</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tell us more</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={6}
                          placeholder="Dates, location, references, the feel you're after..."
                          {...field}
                          data-testid="input-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full sm:w-auto"
                  disabled={create.isPending}
                  data-testid="button-submit"
                >
                  {create.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send inquiry
                      <Send className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </section>
    </div>
  );
}
