import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { alertSources } from "@/lib/data";

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alert Preferences</CardTitle>
          <CardDescription>
            Choose the official sources you want to receive alerts from. The AI will prioritize information from your selected sources.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {alertSources.map((source) => (
            <div key={source.id} className="flex items-center space-x-3">
              <Checkbox id={source.id} defaultChecked={source.id === 'source-1' || source.id === 'source-2'} />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor={source.id} className="font-medium">
                  {source.name}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {source.description}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button>Save Preferences</Button>
        </CardFooter>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Language</CardTitle>
          <CardDescription>
            Select your preferred language for the application interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">Multilingual support is coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
