import { AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { alerts } from "@/lib/data";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Live Alerts</h1>
          <p className="text-muted-foreground">
            Aggregated disaster alerts from official sources.
          </p>
        </div>
        <Button>Summarize Alerts</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {alerts.map((alert) => (
          <Card key={alert.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                {alert.title}
              </CardTitle>
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Badge
                  variant={
                    alert.severity === "high"
                      ? "destructive"
                      : alert.severity === "medium"
                      ? "secondary"
                      : "outline"
                  }
                  className={alert.severity === 'medium' ? 'bg-accent text-accent-foreground' : ''}
                >
                  {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)} Severity
                </Badge>
                <span>•</span>
                <span>{alert.source}</span>
              </div>
              <p className="mt-4 text-sm text-foreground/80">
                {alert.description}
              </p>
              <div className="mt-4 flex items-center text-xs text-muted-foreground">
                <Clock className="mr-1 h-3 w-3" />
                <span>{alert.timestamp}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
