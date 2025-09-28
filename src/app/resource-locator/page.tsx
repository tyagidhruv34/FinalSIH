import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ResourceMap from "@/components/resource-map";
import { resources } from "@/lib/data";

export default function ResourceLocatorPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Resource Locator</h1>
        <p className="text-muted-foreground">
          Find nearby shelters, hospitals, and other essential resources.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
           <ResourceMap resources={resources} />
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Nearby Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {resources.map((resource) => (
                  <li key={resource.id} className="flex items-start gap-4">
                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <resource.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{resource.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {resource.type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {resource.address}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
