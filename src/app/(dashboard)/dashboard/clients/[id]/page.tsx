"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, PlusCircle, ArrowLeft, Trash } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "react-hot-toast";
import { useApiQuery } from "@/hooks/use-api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Client {
  _id: Id<"clients">;
  name: string;
  contactInfo: string;
  address: string;
  notes?: string;
}

interface Production {
  _id: Id<"productions">;
  articleName: string;
  type: string;
  status: string;
  totalPieces: number;
  clientPrice: number;
  cuttingDate?: number;
}

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const clientId = params.id as Id<"clients">;
  
  const { data: client } = useApiQuery(api.clients.get, { id: clientId }) as { data: Client | undefined };
  const { data: productions = [] } = useApiQuery(api.clients.getProductions, { clientId }) as { data: Production[] };
  const deleteClient = useMutation(api.clients.remove);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const handleDeleteClient = async () => {
    try {
      await deleteClient({ id: clientId });
      toast.success("Client deleted successfully!");
      router.push("/dashboard/clients");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(`Error deleting client: ${errorMessage}`);
      console.error("Error deleting client:", error);
    }
  };

  // Helper function to format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (!client) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            className="mr-4" 
            onClick={() => router.push("/dashboard/clients")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Loading Client...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          className="mr-4" 
          onClick={() => router.push("/dashboard/clients")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Client Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Client Information</span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => router.push(`/dashboard/clients/${clientId}/edit`)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the client 
                        and remove all associated data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteClient}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Name</h3>
                <p>{client.name}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Contact Info</h3>
                <p>{client.contactInfo}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Address</h3>
                <p>{client.address}</p>
              </div>
              {client.notes && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Notes</h3>
                  <p>{client.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Productions</h2>
        <Button onClick={() => router.push(`/dashboard/production/new?clientId=${clientId}`)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Production
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Article Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total Pieces</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Client Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No productions found for this client.
                  </TableCell>
                </TableRow>
              ) : (
                productions.map((production) => (
                  <TableRow 
                    key={production._id.toString()} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/dashboard/production/${production._id}`)}
                  >
                    <TableCell>{production.articleName}</TableCell>
                    <TableCell>{production.type}</TableCell>
                    <TableCell>{production.totalPieces}</TableCell>
                    <TableCell>{production.status}</TableCell>
                    <TableCell>₹{production.clientPrice}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}