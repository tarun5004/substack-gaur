"use client";

import Link from "next/link";
import { Bell, Compass, Home, LayoutDashboard, PenLine, Search, UserRound } from "lucide-react";
import { useAppDispatch } from "@/hooks/use-store";
import { setCommandOpen } from "@/store/ui-slice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CommandMenu } from "@/components/site/command-menu";
import { ThemeToggle } from "@/components/site/theme-toggle";

const railItems = [
  { href: "/", label: "Home", icon: Home, key: "home" },
  { href: "/explore", label: "Explore", icon: Compass, key: "explore" },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { href: "/dashboard/subscribers", label: "Readers", icon: Bell, key: "readers" },
  { href: "/dashboard/settings", label: "Profile", icon: UserRound, key: "profile" },
];

export function AppShell({ active = "home", children, rightRail }) {
  const dispatch = useAppDispatch();

  return (
    <>
      <div className="min-h-screen bg-background">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 border-r bg-background/95 px-5 py-6 lg:flex lg:flex-col">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              S
            </span>
            <span>Sahyogi</span>
          </Link>

          <nav className="mt-10 space-y-1">
            {railItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  active === item.key && "bg-accent text-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <Button asChild className="mt-6 w-full">
            <Link href="/dashboard/editor">
              <PenLine className="h-4 w-4" />
              Write
            </Link>
          </Button>

          <div className="mt-auto flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open search"
              onClick={() => dispatch(setCommandOpen(true))}
            >
              <Search className="h-5 w-5" />
            </Button>
            <ThemeToggle />
          </div>
        </aside>

        <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-xl lg:hidden">
          <div className="flex h-14 items-center gap-2 px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
                S
              </span>
              Sahyogi
            </Link>
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open search"
                onClick={() => dispatch(setCommandOpen(true))}
              >
                <Search className="h-5 w-5" />
              </Button>
              <ThemeToggle />
              <Button asChild size="icon" aria-label="Write">
                <Link href="/dashboard/editor">
                  <PenLine className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="lg:pl-56">
          <div
            className={cn(
              "mx-auto grid w-full max-w-[1480px] gap-10 px-4 py-8 sm:px-6 lg:px-10",
              rightRail && "xl:grid-cols-[minmax(0,760px)_330px] xl:justify-center",
              !rightRail && "max-w-4xl",
            )}
          >
            <div className="min-w-0">{children}</div>
            {rightRail ? (
              <aside className="hidden xl:block">
                <div className="sticky top-8 space-y-5">{rightRail}</div>
              </aside>
            ) : null}
          </div>
        </main>
      </div>
      <CommandMenu />
    </>
  );
}
