import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Mail,
  Calendar,
  ShieldCheck,
  Copy,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedShell,
});

function AuthedShell() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "User";
  const initial = (fullName.trim()[0] || user.email?.[0] || "U").toUpperCase();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
            <FileText className="h-5 w-5 text-primary" />
            RefineAI
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2.5 px-2.5 py-1.5 h-auto rounded-full hover:bg-accent border border-transparent hover:border-border transition-all"
              >
                <Avatar className="h-7 w-7 border">
                  <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline-block max-w-[140px] truncate text-sm font-medium">
                  {fullName}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none truncate">{fullName}</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={signOut}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} user={user} />
    </div>
  );
}

function ProfileModal({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}) {
  const [copied, setCopied] = useState(false);
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "User";
  const initial = (fullName.trim()[0] || user.email?.[0] || "U").toUpperCase();

  function copyId() {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    toast.success("User ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>Your account credentials and details</DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <div className="flex items-center gap-4 rounded-xl border bg-muted/40 p-4">
            <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-sm">
              <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold text-foreground">{fullName}</h3>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              <Badge
                variant="secondary"
                className="mt-1 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              >
                <ShieldCheck className="mr-1 h-3 w-3" /> Active User
              </Badge>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4 text-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs text-muted-foreground flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground/70" /> Full Name
              </span>
              <span className="font-medium">{fullName}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground/70" /> Email Address
              </span>
              <span className="font-medium truncate max-w-[200px]">{user.email}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground/70" /> Member Since
              </span>
              <span className="font-medium">
                {user.created_at ? format(new Date(user.created_at), "MMMM d, yyyy") : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">User ID</span>
              <button
                type="button"
                onClick={copyId}
                className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="truncate max-w-[140px]">{user.id}</span>
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
