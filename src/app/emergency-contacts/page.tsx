import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { emergencyContacts } from "@/lib/data";
import * as icons from "lucide-react";

const LucideIcon = ({ name, ...props }: { name: string;[key: string]: any }) => {
  const Icon = icons[name as keyof typeof icons];
  if (!Icon) {
    return null;
  }
  return <Icon {...props} />;
};

export default function EmergencyContactsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-4xl font-bold tracking-tight">Emergency Contacts</h1>
        <p className="text-muted-foreground">
          Quick access to important helplines and authorities.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {emergencyContacts.map((contact) => (
          <Card key={contact.id}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <LucideIcon name={contact.icon} className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>{contact.name}</CardTitle>
                  <p className="text-4xl font-bold text-primary">{contact.phone}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{contact.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-accent/20 border-accent">
        <CardHeader>
            <CardTitle>Offline Access</CardTitle>
            <CardDescription>This contact list is available offline. In an emergency with no internet, you can still access these numbers.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
