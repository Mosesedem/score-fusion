"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send } from "lucide-react";

interface FollowUsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FollowUsDialog({ open, onOpenChange }: FollowUsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Follow Us
          </DialogTitle>
          <DialogDescription className="text-center">
            Stay connected and get instant updates on predictions, tips, and
            exclusive offers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* WhatsApp */}
          <a
            href="https://wa.me/YOUR_WHATSAPP_NUMBER"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button
              variant="outline"
              className="w-full h-14 text-base hover:bg-green-50 hover:border-green-500 transition-colors group"
            >
              <MessageCircle className="h-5 w-5 mr-3 text-green-600 group-hover:scale-110 transition-transform" />
              <span className="flex-1 text-left">
                <div className="font-semibold">WhatsApp</div>
                <div className="text-xs text-muted-foreground">
                  Get instant notifications
                </div>
              </span>
            </Button>
          </a>

          {/* Telegram */}
          <a
            href="https://t.me/YOUR_TELEGRAM_CHANNEL"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button
              variant="outline"
              className="w-full h-14 text-base hover:bg-blue-50 hover:border-blue-500 transition-colors group"
            >
              <Send className="h-5 w-5 mr-3 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="flex-1 text-left">
                <div className="font-semibold">Telegram</div>
                <div className="text-xs text-muted-foreground">
                  Join our community
                </div>
              </span>
            </Button>
          </a>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          By following us, you&apos;ll never miss important updates and
          exclusive VIP predictions
        </p>
      </DialogContent>
    </Dialog>
  );
}

export function FollowUsFloatingButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full bg-linear-to-r from-green-500 to-blue-500 text-white shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center z-40 animate-pulse hover:animate-none"
        aria-label="Follow us"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      <FollowUsDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
