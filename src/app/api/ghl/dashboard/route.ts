import { getContacts, getOpportunities, getConversations, getPipelines, getCalendarEvents, getCampaigns } from "@/lib/ghl/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const errors: string[] = [];
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];

    const [contacts, opportunities, pipelines, campaigns, thisMonthEvents, lastMonthEvents] = await Promise.allSettled([
      getContacts(undefined, 1000),
      getOpportunities(),
      getPipelines(),
      getCampaigns(),
      getCalendarEvents("", monthStart, monthEnd).catch(() => ({ events: [] })),
      getCalendarEvents("", lastMonthStart, lastMonthEnd).catch(() => ({ events: [] })),
    ]);

    // Handle rejected promises
    if (contacts.status === "rejected") errors.push(`Contacts: ${contacts.reason.message}`);
    if (opportunities.status === "rejected") errors.push(`Opportunities: ${opportunities.reason.message}`);
    if (pipelines.status === "rejected") errors.push(`Pipelines: ${pipelines.reason.message}`);
    if (campaigns.status === "rejected") errors.push(`Campaigns: ${campaigns.reason.message}`);

    const contactsData = contacts.status === "fulfilled" ? contacts.value : { contacts: [], total: 0 };
    const opportunitiesData = opportunities.status === "fulfilled" ? opportunities.value : { opportunities: [] };
    const pipelinesData = pipelines.status === "fulfilled" ? pipelines.value : { pipelines: [] };
    const campaignsData = campaigns.status === "fulfilled" ? campaigns.value : { campaigns: [] };
    const thisMonthEventsData = thisMonthEvents.status === "fulfilled" ? thisMonthEvents.value : { events: [] };
    const lastMonthEventsData = lastMonthEvents.status === "fulfilled" ? lastMonthEvents.value : { events: [] };

    const contactsBySource: Record<string, number> = {};
    for (const c of contactsData.contacts) {
      const source = c.source || "Direto";
      contactsBySource[source] = (contactsBySource[source] || 0) + 1;
    }

    const contactsByTag: Record<string, number> = {};
    for (const c of contactsData.contacts) {
      for (const tag of (c.tags || [])) {
        contactsByTag[tag] = (contactsByTag[tag] || 0) + 1;
      }
    }

    const opportunitiesByPipeline: Record<string, { total: number; value: number; won: number; wonValue: number; stages: Record<string, { count: number; value: number; type: string }>; conversionRate: number }> = {};
    
    // Pre-populate pipelines and their exact stages
    for (const pipe of pipelinesData.pipelines) {
      opportunitiesByPipeline[pipe.name] = { total: 0, value: 0, won: 0, wonValue: 0, stages: {}, conversionRate: 0 };
      for (const stage of pipe.stages) {
        opportunitiesByPipeline[pipe.name].stages[stage.name] = { count: 0, value: 0, type: stage.type || "open" };
      }
    }

    for (const opp of opportunitiesData.opportunities) {
      const pipe = pipelinesData.pipelines.find(p => p.id === opp.pipelineId);
      const pipeName = pipe?.name || "Sem pipeline";
      if (!opportunitiesByPipeline[pipeName]) {
        opportunitiesByPipeline[pipeName] = { total: 0, value: 0, won: 0, wonValue: 0, stages: {}, conversionRate: 0 };
      }
      opportunitiesByPipeline[pipeName].total++;
      opportunitiesByPipeline[pipeName].value += opp.monetaryValue || 0;

      if (opp.status === "won") {
        opportunitiesByPipeline[pipeName].won++;
        opportunitiesByPipeline[pipeName].wonValue += opp.monetaryValue || 0;
      }

      const stage = pipe?.stages.find(s => s.id === opp.pipelineStageId);
      const stageName = stage?.name || "Desconhecido";
      if (!opportunitiesByPipeline[pipeName].stages[stageName]) {
        opportunitiesByPipeline[pipeName].stages[stageName] = { count: 0, value: 0, type: stage?.type || "open" };
      }
      opportunitiesByPipeline[pipeName].stages[stageName].count++;
      opportunitiesByPipeline[pipeName].stages[stageName].value += opp.monetaryValue || 0;
    }

    // Calculate conversion rates
    for (const pipeName of Object.keys(opportunitiesByPipeline)) {
      const pipe = opportunitiesByPipeline[pipeName];
      pipe.conversionRate = pipe.total > 0 ? Math.round((pipe.won / pipe.total) * 100) : 0;
    }

    // Inbound marketing funnel - consider Site, organic sources, and inbound tags
    const inboundSources = ["site", "organic", "google", "facebook", "instagram", "linkedin", "social", "seo", "content", "blog", "landing", "form"];
    const inboundTags = ["inbound", "organico", "orgânico", "site", "landing"];
    const inboundContacts = contactsData.contacts.filter(c => {
      const source = (c.source || "").toLowerCase();
      const hasInboundSource = inboundSources.some(s => source.includes(s));
      const hasInboundTag = (c.tags || []).some(t => inboundTags.some(it => t.toLowerCase().includes(it)));
      return hasInboundSource || hasInboundTag || source === "site" || source === "";
    });
    const inboundOpps = opportunitiesData.opportunities.filter(o => {
      const contact = contactsData.contacts.find(c => c.id === o.contactId);
      if (!contact) return false;
      const source = (contact.source || "").toLowerCase();
      const hasInboundSource = inboundSources.some(s => source.includes(s));
      const hasInboundTag = (contact.tags || []).some(t => inboundTags.some(it => t.toLowerCase().includes(it)));
      return hasInboundSource || hasInboundTag || source === "site" || source === "";
    });
    const inboundWon = inboundOpps.filter(o => o.status === "won");

    const totalPipelineValue = Object.values(opportunitiesByPipeline).reduce((sum, p) => sum + p.value, 0);
    const wonValue = opportunitiesData.opportunities.filter(o => o.status === "won").reduce((sum, o) => sum + (o.monetaryValue || 0), 0);
    const openValue = opportunitiesData.opportunities.filter(o => o.status === "open").reduce((sum, o) => sum + (o.monetaryValue || 0), 0);

    const unreadConversations = 0;

    const thisMonthAppointments = thisMonthEventsData.events.filter(e => e.status !== "cancelled" && e.status !== "no_show").length;
    const lastMonthAppointments = lastMonthEventsData.events.filter(e => e.status !== "cancelled" && e.status !== "no_show").length;
    const appointmentGrowth = lastMonthAppointments > 0
      ? Math.round(((thisMonthAppointments - lastMonthAppointments) / lastMonthAppointments) * 100)
      : 0;

    const response = {
      contacts: {
        total: contactsData.total,
        bySource: contactsBySource,
        byTag: contactsByTag,
      },
      opportunities: {
        total: opportunitiesData.opportunities.length,
        byPipeline: opportunitiesByPipeline,
        totalPipelineValue,
        wonValue,
        openValue,
      },
      inbound: {
        contacts: inboundContacts.length,
        opportunities: inboundOpps.length,
        won: inboundWon.length,
        wonValue: inboundWon.reduce((sum, o) => sum + (o.monetaryValue || 0), 0),
        conversionRate: inboundOpps.length > 0 ? Math.round((inboundWon.length / inboundOpps.length) * 100) : 0,
      },
      conversations: {
        total: 0,
        unread: 0,
      },
      appointments: {
        thisMonth: thisMonthAppointments,
        lastMonth: lastMonthAppointments,
        growth: appointmentGrowth,
      },
      campaigns: {
        total: campaignsData.campaigns.length,
        list: campaignsData.campaigns.slice(0, 10).map(c => ({ id: c.id, name: c.name, status: c.status })),
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    return NextResponse.json(response, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GHL Dashboard API Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
