"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, User, Tag, Paperclip, MessageSquare, CheckSquare, ExternalLink } from "lucide-react";
import { useTaskDetail } from "@/hooks/useTaskDetail";
import { formatDate, formatRelativeDate, formatDueDate, formatTimeMs, getTimeProgress, getPriorityLevel, getPriorityLabel, getPriorityTailwind, extractClientName, getUserInitials, isOverdue } from "@/lib/clickup/helpers";
import { cn } from "@/lib/utils";

interface TaskDetailPanelProps {
  taskId: string | null;
  open: boolean;
  onClose: () => void;
}

export function TaskDetailPanel({ taskId, open, onClose }: TaskDetailPanelProps) {
  const { task, comments, isLoading } = useTaskDetail(taskId);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-[540px] p-0 border-border/50 bg-card/95 backdrop-blur-xl">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {isLoading || !task ? (
              <DetailSkeleton />
            ) : (
              <>
                {/* Header */}
                <SheetHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <SheetTitle className="text-xl font-bold leading-tight pr-4">{task.name}</SheetTitle>
                    <a href={task.url} target="_blank" rel="noopener noreferrer" className="shrink-0 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" style={{ borderColor: task.status.color + "50", backgroundColor: task.status.color + "15", color: task.status.color }}>
                      {task.status.status}
                    </Badge>
                    {task.priority && (
                      <Badge variant="outline" className={getPriorityTailwind(getPriorityLevel(task.priority))}>
                        {getPriorityLabel(getPriorityLevel(task.priority))}
                      </Badge>
                    )}
                    {isOverdue(task) && <Badge variant="destructive" className="rounded-lg">Atrasada</Badge>}
                  </div>
                </SheetHeader>

                <Separator className="bg-border/30" />

                {/* Description */}
                {task.description && (
                  <Section title="Descrição">
                    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{task.description}</div>
                  </Section>
                )}

                {/* Assignees */}
                {task.assignees.length > 0 && (
                  <Section title="Responsáveis" icon={User}>
                    <div className="flex flex-wrap gap-2">
                      {task.assignees.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/30 border border-border/30">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-[10px]" style={{ backgroundColor: a.color || "#6b7280", color: "#fff" }}>{getUserInitials(a)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{a.username}</span>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Client */}
                <Section title="Cliente">
                  <span className="text-sm">{extractClientName(task)}</span>
                </Section>

                {/* Dates */}
                <Section title="Datas" icon={Calendar}>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <DateItem label="Criação" value={formatDate(task.date_created)} />
                    <DateItem label="Atualização" value={formatRelativeDate(task.date_updated)} />
                    <DateItem label="Prazo" value={formatDueDate(task.due_date)} highlight={isOverdue(task)} />
                    {task.date_done && <DateItem label="Conclusão" value={formatDate(task.date_done)} />}
                  </div>
                </Section>

                {/* Time tracking */}
                {(task.time_estimate || task.time_spent) && (
                  <Section title="Tempo" icon={Clock}>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Registrado: {formatTimeMs(task.time_spent)}</span>
                        <span className="text-muted-foreground">Estimado: {formatTimeMs(task.time_estimate)}</span>
                      </div>
                      <Progress value={getTimeProgress(task.time_estimate, task.time_spent)} className="h-2" />
                    </div>
                  </Section>
                )}

                {/* Tags */}
                {task.tags.length > 0 && (
                  <Section title="Tags" icon={Tag}>
                    <div className="flex flex-wrap gap-1.5">
                      {task.tags.map((t) => (
                        <Badge key={t.name} variant="outline" className="rounded-lg text-xs" style={{ borderColor: t.tag_bg + "50", backgroundColor: t.tag_bg + "15" }}>
                          {t.name}
                        </Badge>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Custom fields */}
                {task.custom_fields.filter(f => f.value).length > 0 && (
                  <Section title="Campos Customizados">
                    <div className="space-y-2">
                      {task.custom_fields.filter(f => f.value).map((f) => (
                        <div key={f.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{f.name}</span>
                          <span>{String(f.value)}</span>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Comments */}
                {comments.length > 0 && (
                  <Section title={`Comentários (${comments.length})`} icon={MessageSquare}>
                    <div className="space-y-3">
                      {comments.slice(0, 10).map((c) => (
                        <div key={c.id} className="p-3 rounded-lg bg-accent/20 border border-border/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="w-5 h-5">
                              <AvatarFallback className="text-[9px]" style={{ backgroundColor: c.user.color || "#6b7280", color: "#fff" }}>
                                {getUserInitials(c.user)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">{c.user.username}</span>
                            <span className="text-xs text-muted-foreground">{formatRelativeDate(c.date)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{c.comment_text}</p>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Checklists */}
                {task.checklists.length > 0 && (
                  <Section title="Checklists" icon={CheckSquare}>
                    {task.checklists.map((cl) => (
                      <div key={cl.id} className="space-y-1.5">
                        <p className="text-sm font-medium">{cl.name} ({cl.resolved}/{cl.resolved + cl.unresolved})</p>
                        {cl.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 text-sm pl-2">
                            <div className={cn("w-3.5 h-3.5 rounded border", item.resolved ? "bg-emerald-500 border-emerald-500" : "border-border")} />
                            <span className={item.resolved ? "line-through text-muted-foreground" : ""}>{item.name}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </Section>
                )}

                {/* Attachments */}
                {task.attachments && task.attachments.length > 0 && (
                  <Section title={`Anexos (${task.attachments.length})`} icon={Paperclip}>
                    <div className="space-y-1.5">
                      {task.attachments.map((a) => (
                        <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                          <Paperclip className="w-3 h-3" /> {a.title}
                        </a>
                      ))}
                    </div>
                  </Section>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function DateItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("font-medium", highlight && "text-red-400")}>{value}</p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <div className="flex gap-2"><Skeleton className="h-6 w-24" /><Skeleton className="h-6 w-20" /></div>
      <Skeleton className="h-px w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
