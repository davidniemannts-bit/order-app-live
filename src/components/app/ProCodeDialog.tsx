import { useState, type FormEvent, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { unlockPro } from "@/lib/restaurant.functions";
import { errorMessage } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ProCodeDialog({ restaurantId, trigger }: { restaurantId: string; trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const unlock = useServerFn(unlockPro);
  const qc = useQueryClient();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await unlock({ data: { restaurantId, code } });
      await qc.invalidateQueries({ queryKey: ["restaurant", restaurantId] });
      await qc.invalidateQueries({ queryKey: ["my-restaurants"] });
      toast.success("Pro ist freigeschaltet!");
      setOpen(false);
      setCode("");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="pro">
            <Crown /> Pro freischalten
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-pro" /> Pro freischalten</DialogTitle>
          <DialogDescription>Gib deinen Pro-Code ein, um Logo, Farben, Hintergrundbild und Seitentexte zu bearbeiten.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <Input autoFocus placeholder="Pro-Code" value={code} onChange={(e) => setCode(e.target.value)} className="h-12" required />
          <Button type="submit" variant="pro" size="xl" disabled={busy || !code.trim()}>
            {busy && <Loader2 className="animate-spin" />} Freischalten
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
