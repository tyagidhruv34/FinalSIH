import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Landmark } from "lucide-react";

// Placeholder data for government advisories
const advisories = [
  {
    id: 1,
    title: "Cyclone Season Preparedness",
    agency: "National Disaster Management Authority (NDMA)",
    date: "2024-09-25",
    summary: "All coastal districts are advised to take precautionary measures for the upcoming cyclone season. Ensure your emergency kits are ready and stay tuned to official channels for updates.",
  },
  {
    id: 2,
    title: "Flood Awareness Campaign",
    agency: "State Disaster Response Force (SDRF)",
    date: "2024-09-22",
    summary: "Citizens in low-lying areas should be aware of potential flood risks during heavy monsoon rains. Do not attempt to cross flooded roads. Move to higher ground if water levels rise.",
  },
  {
    id: 3,
    title: "Earthquake Safety Drills",
    agency: "Ministry of Home Affairs",
    date: "2024-09-20",
    summary: "Regular earthquake drills are recommended for all schools and offices. Remember to 'Drop, Cover, and Hold On' during an earthquake.",
  },
];

export default function AdvisoriesPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Government Advisories</h1>
        <p className="text-muted-foreground">
          Official guidance and preparedness information from government agencies.
        </p>
      </div>

      <div className="space-y-6">
        {advisories.map((advisory) => (
          <Card key={advisory.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                    <CardTitle>{advisory.title}</CardTitle>
                    <CardDescription>
                    Issued by: {advisory.agency} on {advisory.date}
                    </CardDescription>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Landmark className="h-6 w-6" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/90">{advisory.summary}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

    