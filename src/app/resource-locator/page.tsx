'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import ResourceMap from "@/components/resource-map";
import { resources } from "@/lib/data";
import * as icons from "lucide-react";
import type { UserStatus, Resource } from "@/lib/types";
import { db } from "@/lib/firebase/firebase";
import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";


const LucideIcon = ({ name, ...props }: { name: string;[key: string]: any }) => {
  const Icon = icons[name as keyof typeof icons];
  if (!Icon) {
    return null;
  }
  return <Icon {...props} />;
};


export default function ResourceLocatorPage() {
    const [userStatuses, setUserStatuses] = useState<UserStatus[]>([]);
    
    useEffect(() => {
        const q = collection(db, 'user_status');
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const statuses: UserStatus[] = [];
            querySnapshot.forEach((doc) => {
                statuses.push({ id: doc.id, ...doc.data() } as UserStatus);
            });
            setUserStatuses(statuses);
        });

        return () => unsubscribe();
    }, []);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Community Map</h1>
        <p className="text-muted-foreground">
          Live map of user statuses and available resources.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
           <ResourceMap resources={resources} userStatuses={userStatuses} />
        </div>
        <div className="lg:col-span-1">
          <Tabs defaultValue="resources">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
            </TabsList>
            <TabsContent value="resources">
                <Card>
                    <CardHeader>
                    <CardTitle>Nearby Resources</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <ul className="space-y-4 max-h-[400px] overflow-y-auto">
                        {resources.map((resource) => (
                        <li key={resource.id} className="flex items-start gap-4">
                            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <LucideIcon name={resource.icon} className="h-5 w-5" />
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
            </TabsContent>
            <TabsContent value="requests">
                 <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Resource Needs</CardTitle>
                             <Button size="sm"><PlusCircle className="mr-2"/> Add</Button>
                        </div>
                        <CardDescription>Items requested by the community. Add a request if you need something.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                       <p>Feature coming soon.</p>
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
