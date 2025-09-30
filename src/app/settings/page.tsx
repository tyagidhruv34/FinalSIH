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
    { code: 'mr', name: 'मराठी' },
    { code: 'gu', name: 'ગુજરાતી' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
];


export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: t('settings_save_success_title'),
      description: t('settings_save_success_description'),
    });
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{t('settings_title')}</h1>
        <p className="text-muted-foreground">
          {t('settings_description')}
        </p>
      </div>
      
       <Card>
        <CardHeader>
          <CardTitle>{t('settings_language_title')}</CardTitle>
          <CardDescription>
            {t('settings_language_description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
                <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder={t('settings_language_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                    {supportedLanguages.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </CardContent>
         <CardFooter>
          <Button onClick={handleSave}>{t('settings_save_button')}</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings_alerts_title')}</CardTitle>
          <CardDescription>
            {t('settings_alerts_description')}
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
          <Button onClick={handleSave}>{t('settings_save_button')}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
