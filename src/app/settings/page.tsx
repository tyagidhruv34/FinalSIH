'use client';

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
import { useLanguage } from "@/hooks/use-language";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const supportedLanguages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'bn', name: 'বাংলা' },
];


export default function SettingsPage() {
  const { language, setLanguage } = useLanguage();
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Preferences Saved",
      description: "Your settings have been updated.",
    });
  };

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
          <CardTitle>Language</CardTitle>
          <CardDescription>
            Select your preferred language for the application interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
                <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                    {supportedLanguages.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </CardContent>
         <CardFooter>
          <Button onClick={handleSave}>Save Preferences</Button>
        </CardFooter>
      </Card>

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
          <Button onClick={handleSave}>Save Preferences</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
