
'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { resources } from "@/lib/data";
import * as icons from "lucide-react";
import type { UserStatus, Resource, ResourceNeed } from "@/lib/types";
import { db } from "@/lib/firebase/firebase";
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, ShoppingCart } from "lucide-react";
import RequestResourceForm from "@/components/request-resource-form";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";

const ResourceMap = dynamic(() => import('@/components/resource-map'), { 
    ssr: false,
    loading: () => <Skeleton className="h-[500px] w-full rounded-lg" />
});


const LucideIcon = ({ name, ...props }: { name: string;[key: string]: any }) => {
  const Icon = icons[name as keyof typeof icons];
  if (!Icon) {
    return null;
  }
  return <Icon {...props} />;
};


export default function ResourceLocatorPage() {
    const { user } = useAuth();
    const [userStatuses, setUserStatuses] = useState<UserStatus[]>([]);
    const [resourceNeeds, setResourceNeeds] = useState<ResourceNeed[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    useEffect(() => {
        const userStatusQuery = collection(db, 'user_status');
        const unsubscribeUserStatuses = onSnapshot(userStatusQuery, (querySnapshot) => {
            const statuses: UserStatus[] = [];
            querySnapshot.forEach((doc) => {
                statuses.push({ id: doc.id, ...doc.data() } as UserStatus);
            });
            setUserStatuses(statuses);
        });

        const resourceNeedsQuery = query(collection(db, 'resource_needs'), where('fulfilled', '==', false));
        const unsubscribeResourceNeeds = onSnapshot(resourceNeedsQuery, (querySnapshot) => {
            const needs: ResourceNeed[] = [];
            querySnapshot.forEach((doc) => {
                needs.push({ id: doc.id, ...doc.data() } as ResourceNeed);
            });
            setResourceNeeds(needs);
        });

        return () => {
            unsubscribeUserStatuses();
            unsubscribeResourceNeeds();
        };
    }, []);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-4xl font-bold tracking-tight">Community Map</h1>
        <p className="text-muted-foreground">
          Live map of user statuses and available resources.
        </p>
      </div>

       <RequestResourceForm open={isFormOpen} onOpenChange={setIsFormOpen} />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
           <ResourceMap 
                resources={resources} 
                userStatuses={userStatuses} 
                resourceNeeds={resourceNeeds}
                currentUserId={user?.uid}
                className="min-h-[600px] lg:min-h-0"
            />
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
                    <ul className="space-y-4 max-h-[500px] overflow-y-auto">
                        {resources.map((resource) => (
                        <li key={resource.id} className="flex items-start gap-4">
                            <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <LucideIcon name={resource.icon} className="h-5 w-5" />
                            </div>
                            <div>
                            <h3 className="font-semibold">{resource.name}</h3>
                            <p className="text-4xl text-muted-foreground">
                                {resource.type}
                            </p>
                            <p className="text-4xl text-muted-foreground">
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
                             <Button size="sm" onClick={() => setIsFormOpen(true)} disabled={!user}><PlusCircle className="mr-2"/> Add</Button>
                        </div>
                        <CardDescription>Items requested by the community. Add a request if you need something.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {resourceNeeds.length === 0 ? (
                             <div className="text-center text-muted-foreground py-8">
                                <ShoppingCart className="mx-auto h-12 w-12" />
                                <p className="mt-4">No active resource requests.</p>
                             </div>
                        ) : (
                            <ul className="space-y-4 max-h-[500px] overflow-y-auto">
                                {resourceNeeds.map((need) => (
                                <li key={need.id} className="flex items-start gap-4">
                                    <div className={`mt-1 flex h-12 w-12 items-center justify-center rounded-lg ${need.urgency === 'High' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-secondary-foreground'}`}>
                                        <LucideIcon name="PackageOpen" className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{need.quantity}x {need.item}</h3>
                                        <div className="text-4xl text-muted-foreground">
                                           Urgency: <Badge variant={need.urgency === 'High' ? 'destructive' : 'secondary'}>{need.urgency}</Badge>
                                        </div>
                                        <p className="text-4xl text-muted-foreground">
                                            Contact: {need.contactInfo}
                                        </p>
                                    </div>
                                </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
