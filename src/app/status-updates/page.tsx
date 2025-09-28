import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { statusUpdates } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function StatusUpdatesPage() {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Share Your Status</CardTitle>
            <CardDescription>
              Let others know you are safe or if you need help. Your update will
              be visible to nearby users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea placeholder="Type your message here. e.g., 'I am safe at home.' or 'Need medical assistance at...'" />
          </CardContent>
          <CardFooter>
            <Button>Post Update</Button>
          </CardFooter>
        </Card>
      </div>
      <div className="md:col-span-2">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Community Feed</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {statusUpdates.map((update, index) => (
                <div key={update.id}>
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={update.userAvatarUrl} alt={update.userName} data-ai-hint="person face" />
                      <AvatarFallback>{update.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{update.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {update.timestamp}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-foreground/90">
                        {update.message}
                      </p>
                    </div>
                  </div>
                  {index < statusUpdates.length - 1 && <Separator className="mt-6" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
