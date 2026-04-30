"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ListTodo, Users, Building2, Menu, X, Zap, Brain, Target } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tarefas", icon: ListTodo },
  { href: "/clients", label: "Clientes", icon: Building2 },
  { href: "/team", label: "Equipe", icon: Users },
  { href: "/ai-insights", label: "Insights IA", icon: Brain },
  { href: "/comercial", label: "Comercial", icon: Target },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      <div className={cn("fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity", collapsed ? "opacity-0 pointer-events-none" : "opacity-100")} onClick={() => setCollapsed(true)} />

      {/* Mobile toggle */}
      <button onClick={() => setCollapsed(!collapsed)} className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-none bg-background border border-border">
        {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full z-40 flex flex-col border-r border-border bg-background transition-all duration-300",
        "lg:relative lg:translate-x-0",
        collapsed ? "-translate-x-full w-72 lg:w-20" : "translate-x-0 w-72",
      )}>
        {/* Logo */}
        <div className={cn("flex items-center px-6 py-6 border-b border-border/50 h-24", collapsed ? "justify-center px-0" : "justify-between")}>
          {!collapsed && <img src="/logo.png" alt="Company Logo" className="w-auto h-12 object-contain" />}
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className="hidden lg:flex p-1.5 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
               <Link key={item.href} href={item.href} onClick={() => { if (window.innerWidth < 1024) setCollapsed(true) }}
                 className={cn(
                   "flex items-center gap-3 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                   collapsed ? "px-0 justify-center" : "px-4",
                   isActive
                     ? "bg-gradient-to-r from-[var(--color-brand-blue)]/20 to-transparent text-white border border-[var(--color-brand-blue)]/50 shadow-[0_0_15px_rgba(0,102,255,0.15)]"
                     : "text-muted-foreground border border-transparent hover:text-foreground hover:bg-white/5"
                 )}
                 title={collapsed ? item.label : undefined}
               >
                 <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-[var(--color-brand-blue)] drop-shadow-[0_0_8px_rgba(0,102,255,0.8)]")} />
                 {!collapsed && <span>{item.label}</span>}
                 {isActive && !collapsed && <div className="ml-auto w-1.5 h-1.5 shrink-0 rounded-full bg-[var(--color-brand-blue)] shadow-[0_0_8px_rgba(0,102,255,1)]" />}
               </Link>
             );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-border overflow-hidden">
          <div className={cn("py-3 bg-[var(--color-cobalt-blue)]/5 border border-[var(--color-cobalt-blue)]/30 rounded-none whitespace-nowrap", collapsed ? "px-2 text-center flex items-center justify-center" : "px-4")}>
            {collapsed ? (
              <Zap className="w-4 h-4 text-[var(--color-cobalt-blue)]" />
            ) : (
              <>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Powered by</p>
                <p className="text-xs font-bold text-[var(--color-cobalt-blue)] uppercase">ClickUp API v2</p>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
