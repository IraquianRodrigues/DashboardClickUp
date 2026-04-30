import { getClickUpClient } from "@/lib/clickup/client";
import { computeMetrics, getOverdueTasks, getUpcomingTasks } from "@/lib/clickup/helpers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const webhookUrlRaw = process.env.GHL_WEBHOOK_URL;
    if (!webhookUrlRaw) {
      return NextResponse.json({ error: "GHL_WEBHOOK_URL not configured" }, { status: 500 });
    }
    const webhookUrl = webhookUrlRaw.trim();

    // Fetch tasks updated in the last 30 days to avoid rate limits (95 req/min)
    // and Vercel 504 timeouts (60s max limit) while still getting relevant active data
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const client = getClickUpClient();
    const [tasks, spaces] = await Promise.all([
      client.getAllTasks({ 
        include_closed: true, 
        order_by: "updated", 
        reverse: true,
        date_updated_gt: thirtyDaysAgo
      }),
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
      .sort((a, b) => b.total - a.total);

    const payload = {
      callback_url: "https://empreendexpertdashboard.vercel.app/api/ai-insights/callback",
      date: dateStr,
      timestamp: now.toISOString(),
      prompt: `Você é um analista sênior de projetos e gerenciamento de equipe. Analise os dados brutos abaixo extraídos em tempo real do nosso sistema de gestão de tarefas (ClickUp) e forneça um relatório de insights em português brasileiro.
 
 DADOS EXTRAÍDOS EM: ${now.toISOString()}
 (Nota: Estes dados representam as tarefas ativas e atualizadas nos últimos 30 dias para análise de performance recente)
 
 [INÍCIO DOS DADOS DO CLICKUP]
 Métricas Gerais (Últimos 30 dias):
 - Total de tarefas movimentadas: ${metrics.total}
 - Concluídas neste período: ${metrics.completed} (${metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0}%)
 - Em Andamento: ${metrics.inProgress}
 - Pendentes: ${metrics.pending}
 - Atrasadas: ${metrics.overdue}
 - Bloqueadas: ${metrics.blocked}

Tarefas Atrasadas (${recentOverdue.length} recentes):
${recentOverdue.length > 0 ? recentOverdue.map(t => `- "${t.name}" | Resp: ${t.assignee} | ${t.daysOverdue}d atrasada | Proj: ${t.folder}`).join("\n") : "Nenhuma tarefa recentemente atrasada!"}

Próximos Vencimentos (5 dias):
${upcomingList.length > 0 ? upcomingList.map(t => `- "${t.name}" | Resp: ${t.assignee} | Vence em ${t.daysUntilDue}d | Proj: ${t.folder}`).join("\n") : "Sem vencimentos nos próximos 5 dias."}

Performance da Equipe:
${teamPerformance.map(m => `- ${m.name}: ${m.total} tarefas (${m.completionRate}% conc) | ${m.overdue} atrasadas | ${m.inProgress} em andamento`).join("\n")}

Resumo por Cliente:
${clientSummary.map(c => `- ${c.name}: ${c.total} tarefas (${c.completionRate}% conc) | ${c.overdue} atrasadas`).join("\n")}
[FIM DOS DADOS DO CLICKUP]

INSTRUÇÕES PARA O RELATÓRIO:
Com base EXCLUSIVAMENTE nos dados fornecidos acima, gere um relatório estruturado com as seguintes seções (mantenha os emojis):

1. 🚨 ALERTAS CRÍTICOS
- Identifique problemas que precisam de atenção IMEDIATA.
- Liste tarefas específicas que estão muito atrasadas, gargalos visíveis ou responsáveis que estão sobrecarregados (se houver).
- Se os dados mostrarem 0% de atraso e nenhum gargalo, reconheça a excelência do cenário e pule para o próximo tópico sem inventar problemas.

2. 📊 ANÁLISE DE PERFORMANCE
- Avalie o desempenho da equipe com base na taxa de conclusão e volume.
- Destaque quem está entregando bem e quem (se houver alguém) apresenta gargalos ou precisa de suporte.
- Mencione os nomes e números reais presentes nos dados.

3. 📈 TENDÊNCIAS E PADRÕES
- O que a distribuição de dados revela hoje?
- Aponte projetos/clientes que demandam mais esforço ou padrões de acúmulo e distribuição de tarefas.

4. 💡 RECOMENDAÇÕES DO DIA
- Forneça de 3 a 5 ações concretas, específicas e acionáveis que a gestão deve tomar HOJE para manter ou melhorar os resultados.
- Baseie as ações estritamente nos dados de hoje (ex: "Fazer follow-up com o cliente X sobre a tarefa Y", ou "Parabenizar o colaborador Z pelo volume de entregas").

5. 🎯 FOCO DO DIA
- Defina a prioridade número 1 da equipe para o dia de hoje, fundamentada no que apresenta maior risco ou maior impacto nos dados analisados.

REGRAS DE FORMATAÇÃO E TOM:
- Seja direto, analítico e objetivo.
- NÃO crie informações, nomes, tarefas ou clientes que não estejam no bloco de dados fornecido.
- Se uma categoria (como tarefas atrasadas) estiver vazia, adapte a análise para celebrar o cumprimento de prazos em vez de apontar erros.`,
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
        tasksFetched: tasks.length,
        total: metrics.total,
        completed: metrics.completed,
        overdue: metrics.overdue,
        overdueRecent: recentOverdue.length,
        upcomingDeadlines: upcomingList.length,
        teamMembers: teamPerformance.length,
        totalClients: clientSummary.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
