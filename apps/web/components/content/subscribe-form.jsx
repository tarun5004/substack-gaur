"use client";
import { useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/services/api";
import { subscribeToPublication } from "@/services/publications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function SubscribeForm({ publicationSlug }) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  async function onSubmit(event) {
    event.preventDefault();
    setPending(true);
    try {
      await subscribeToPublication(publicationSlug, {
        email,
        source: "publication_page",
      });
      toast.success("You are subscribed");
      setEmail("");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Subscription could not be saved"));
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <Input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        required
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Subscribing" : "Subscribe"}
      </Button>
    </form>
  );
}
