import { getClickUpClient } from "@/lib/clickup/client";
import { computeMetrics, getOverdueTasks, getUpcomingTasks } from "@/lib/clickup/helpers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  try {
    const webhookUrl = process.env.GHL_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ error: "GHL_WEBHOOK_URL not configured" }, { status: 500 });
    }

    // Fetch all tasks from ClickUp
    const client = getClickUpClient();
    const [tasks, spaces] = await Promise.all([
      client.getAllTasks({ include_closed: true, order_by: "updated", reverse: true }, 10),
      client.getSpaces(),
    ]);

    // Attach space names
    const spaceMap = new Map(spaces.map(s => [s.id, s.name]));
    for (const task of tasks) {
      if (task.space && spaceMap.has(task.space.id)) {
        (task.space as any).name = spaceMap.get(task.space.id);
      }
    }

    // Compute metrics
    const metrics = computeMetrics(tasks);
    const overdue = getOverdueTasks(tasks);
    const upcoming = getUpcomingTasks(tasks, 5);

    // Build analysis-focused summary for the AI
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

    // Top overdue tasks (last 15 days)
    const recentOverdue = overdue
      .filter(t => {
        if (!t.due_date) return false;
        const diffDays = (Date.now() - parseInt(t.due_date)) / (1000 * 60 * 60 * 24);
        return diffDays <= 15;
      })
      .slice(0, 15)
      .map(t => ({
        name: t.name,
        assignee: t.assignees?.[0]?.username || "Não atribuído",
        daysOverdue: Math.round((Date.now() - parseInt(t.due_date!)) / (1000 * 60 * 60 * 24)),
        folder: t.folder?.name || "N/A",
        priority: t.priority?.priority || "none",
      }));

    // Upcoming tasks (next 5 days)
    const upcomingList = upcoming.slice(0, 10).map(t => ({
      name: t.name,
      assignee: t.assignees?.[0]?.username || "Não atribuído",
      daysUntilDue: Math.round((parseInt(t.due_date!) - Date.now()) / (1000 * 60 * 60 * 24)),
      folder: t.folder?.name || "N/A",
    }));

    // Team performance
    const teamPerformance = Object.values(metrics.byAssignee).map(a => ({
      name: a.user.username || "Desconhecido",
      total: a.total,
      completed: a.completed,
      inProgress: a.inProgress,
      overdue: a.overdue,
      completionRate: a.total > 0 ? Math.round((a.completed / a.total) * 100) : 0,
    })).sort((a, b) => b.total - a.total);

    // Client summary
    const clientSummary = Object.values(metrics.byClient)
      .map(c => ({
        name: c.name,
        total: c.total,
        completed: c.completed,
        overdue: c.overdue,
        completionRate: c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const payload = {
      callback_url: "https://empreendexpertdashboard.vercel.app/api/ai-insights/callback",
      date: dateStr,
      timestamp: now.toISOString(),
      prompt: `Você é um analista sênior de projetos e gerenciamento de equipe. Analise os dados abaixo do nosso sistema de gestão de tarefas (ClickUp) e forneça um relatório de insights em português brasileiro.

DADOS DO DIA: ${dateStr}

📊 MÉTRICAS GERAIS:
- Total de tarefas: ${metrics.total}
- Concluídas: ${metrics.completed} (${metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0}%)
- Em Andamento: ${metrics.inProgress}
- Pendentes: ${metrics.pending}
- Atrasadas: ${metrics.overdue}
- Bloqueadas: ${metrics.blocked}

🔴 TAREFAS ATRASADAS (últimos 15 dias):
${recentOverdue.map(t => `- "${t.name}" | Responsável: ${t.assignee} | ${t.daysOverdue} dias atrasada | Projeto: ${t.folder} | Prioridade: ${t.priority}`).join("\n")}

📅 PRÓXIMOS VENCIMENTOS (5 dias):
${upcomingList.map(t => `- "${t.name}" | Responsável: ${t.assignee} | Vence em ${t.daysUntilDue} dias | Projeto: ${t.folder}`).join("\n")}

👥 PERFORMANCE DA EQUIPE:
${teamPerformance.map(m => `- ${m.name}: ${m.total} tarefas | ${m.completionRate}% concluído | ${m.overdue} atrasadas | ${m.inProgress} em andamento`).join("\n")}

🏢 RESUMO POR CLIENTE (top 10):
${clientSummary.map(c => `- ${c.name}: ${c.total} tarefas | ${c.completionRate}% concluído | ${c.overdue} atrasadas`).join("\n")}

INSTRUÇÕES PARA O RELATÓRIO:
Gere um relatório estruturado com as seguintes seções (use emojis para cada seção):

1. 🚨 ALERTAS CRÍTICOS - Problemas urgentes que precisam de atenção IMEDIATA (tarefas muito atrasadas, gargalos, responsáveis sobrecarregados)

2. 📊 ANÁLISE DE PERFORMANCE - Como a equipe está performando? Quem está entregando bem? Quem precisa de suporte? Taxa de conclusão geral.

3. 📈 TENDÊNCIAS E PADRÕES - O que os dados revelam? Projetos com maior acúmulo de atraso, padrões de distribuição de tarefas.

4. 💡 RECOMENDAÇÕES DO DIA - 3 a 5 ações concretas e específicas que o gestor deveria tomar HOJE para melhorar os resultados.

5. 🎯 FOCO DO DIA - Qual deveria ser a prioridade #1 da equipe hoje?

Seja direto, objetivo e use dados específicos nos insights. Não seja genérico. Mencione nomes, números e tarefas reais.`,
      metrics: {
        total: metrics.total,
        completed: metrics.completed,
        inProgress: metrics.inProgress,
        pending: metrics.pending,
        overdue: metrics.overdue,
        blocked: metrics.blocked,
      },
      overdue_tasks: recentOverdue,
      upcoming_tasks: upcomingList,
      team_performance: teamPerformance,
      client_summary: clientSummary,
    };

    // Send to GHL webhook
    const ghlResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!ghlResponse.ok) {
      const body = await ghlResponse.text();
      return NextResponse.json(
        { error: `GHL webhook failed: ${ghlResponse.status}`, details: body },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Dados enviados ao GoHighLevel com sucesso. Aguardando processamento da IA.",
      sentAt: now.toISOString(),
      metricsSnapshot: {
        total: metrics.total,
        completed: metrics.completed,
        overdue: metrics.overdue,
        overdueRecent: recentOverdue.length,
        upcomingDeadlines: upcomingList.length,
        teamMembers: teamPerformance.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
