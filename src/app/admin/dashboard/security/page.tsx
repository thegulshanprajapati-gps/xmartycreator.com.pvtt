'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Activity, AlertTriangle, Network, Ban } from 'lucide-react';

type Event = {
  ip: string;
  route: string;
  method: string;
  status: string;
  attackType: string;
  ts: number;
};

export default function SecurityDashboard() {
  const [live, setLive] = useState<Event[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [traffic, setTraffic] = useState<{ route: string; count: number }[]>([]);
  const [visits, setVisits] = useState<any[]>([]);

  // Poll overview + events
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [o, e, v] = await Promise.all([
          fetch('/api/security/overview').then(r => r.json()),
          fetch('/api/security/events?limit=200').then(r => r.json()),
          fetch('/api/security/visits?limit=200').then(r => r.json()),
        ]);
        if (mounted) {
          setOverview(o);
          setEvents(e.events || []);
          setVisits(v.visits || []);
        }
      } catch (err) {
        console.error('Security fetch error', err);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    const es = new EventSource('/api/security/live');
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'snapshot') setLive(payload.events);
        if (payload.type === 'append') setLive((prev) => [...payload.events, ...prev].slice(0, 50));
      } catch {
        /* ignore */
      }
    };
    return () => es.close();
  }, []);

  // Derive live route counts in real time from SSE feed
  useEffect(() => {
    const counts: Record<string, number> = {};
    live.forEach((e) => {
      const key = e.route || 'unknown';
      counts[key] = (counts[key] || 0) + 1;
    });
    const routes = Object.entries(counts)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    setTraffic(routes);
  }, [live]);

  const cards = [
    { label: 'Total (24h)', value: overview?.total ?? '—', icon: Activity },
    { label: 'Blocked', value: overview?.blocked ?? '—', icon: ShieldCheck },
    { label: 'Throttled', value: overview?.throttled ?? '—', icon: Ban },
    { label: 'Bots', value: overview?.bots ?? '—', icon: AlertTriangle },
    { label: 'Suspicious', value: overview?.suspicious ?? '—', icon: AlertTriangle },
    { label: 'Unique IPs', value: overview?.uniqueIPs ?? '—', icon: Network },
  ];

  const exportCsv = () => {
    const headers = ['ip', 'route', 'method', 'status', 'attackType', 'timestamp'];
    const rows = events.map((e) => [
      e.ip,
      e.route,
      e.method,
      e.status,
      e.attackType,
      new Date(e.ts).toISOString(),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-events-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cyber Cell</h1>
          <p className="text-muted-foreground">Live security telemetry, blocks, and controls.</p>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <Card key={card.label} className="border-border/70 bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/70 bg-card/70">
        <CardHeader>
          <CardTitle>Recent Attacks</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">No events yet</TableCell>
                </TableRow>
              )}
              {events.map((e, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-xs">{e.ip}</TableCell>
                  <TableCell>{e.route}</TableCell>
                  <TableCell>{e.method}</TableCell>
                  <TableCell>
                    <Badge variant={e.attackType === 'none' ? 'secondary' : 'destructive'} className="capitalize">
                      {e.attackType || 'none'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      e.status === 'blocked' ? 'destructive' :
                      e.status === 'throttled' ? 'secondary' : 'default'
                    }>
                      {e.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(e.ts).toLocaleTimeString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/70">
        <CardHeader>
          <CardTitle>Recent Visits (IP + Time)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">No visits yet</TableCell>
                </TableRow>
              )}
              {visits.map((v, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-xs">{v.ip}</TableCell>
                  <TableCell className="truncate max-w-[280px]">{v.route}</TableCell>
                  <TableCell>{v.method}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {v.ts ? new Date(v.ts).toLocaleString() : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/70">
        <CardHeader>
          <CardTitle>Live Route Traffic (last 15 min)</CardTitle>
        </CardHeader>
        <CardContent>
          {traffic.length === 0 ? (
            <div className="text-sm text-muted-foreground">Waiting for traffic…</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {traffic.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 bg-card/70">
                  <span className="text-sm truncate max-w-[180px]">{t.route}</span>
                  <Badge variant="secondary">{t.count}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/70">
        <CardHeader>
          <CardTitle>Live Traffic (last 50)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
          {live.length === 0 && <div className="text-sm text-muted-foreground">Waiting for traffic…</div>}
          {live.map((e, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm border-b border-border/50 pb-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{e.method}</Badge>
                <span className="font-mono text-xs">{e.ip}</span>
                <span className="text-muted-foreground">{e.route}</span>
              </div>
              <div className="text-xs text-muted-foreground">{new Date(e.ts).toLocaleTimeString()}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
