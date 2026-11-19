"use client";

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
import { ArrowLeft, Edit, PlusCircle, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { use, useState } from "react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { toast } from "react-hot-toast";
import useAuth from "@/hooks/use-auth";
import { useMutation } from "convex/react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const clientId = use(params).id as Id<"clients">;

  const { id: userId } = useAuth();

  const client = useQuery(api.clients.get, { id: clientId });
  const productions = useQuery(api.clients.getProductions, { clientId }) || [];
  const deleteClient = useMutation(api.clients.remove);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const startMs = startDate?.getTime();
  const endMs = endDate?.getTime();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiAny = api as any;
  const profitSummary = useQuery(apiAny.analytics.getClientProfitSummary, {
    clientId,
    start: startMs,
    end: endMs,
  });

  const filteredProductions = (productions || [])
    .filter((p: any) => {
      if (startMs && p.createdAt < startMs) return false;
      if (endMs && p.createdAt > endMs) return false;
      return true;
    })
    .sort((a: any, b: any) =>
      sortOrder === "asc" ? a.createdAt - b.createdAt : b.createdAt - a.createdAt
    );

  const handleDeleteClient = async () => {
    try {
      await deleteClient({ id: clientId, userId });
      toast.success("Client deleted successfully!");
      router.push("/dashboard/clients");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(`Error deleting client: ${errorMessage}`);
      console.error("Error deleting client:", error);
    }
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
                  onClick={() =>
                    router.push(`/dashboard/clients/${clientId}/edit`)
                  }
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog
                  open={isConfirmDialogOpen}
                  onOpenChange={setIsConfirmDialogOpen}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the client and remove all associated data from
                        our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteClient}>
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">
                  Name
                </h3>
                <p>{client.name}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">
                  Contact Info
                </h3>
                <p>{client.contactInfo}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">
                  Address
                </h3>
                <p>{client.address}</p>
              </div>
              {client.notes && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Notes
                  </h3>
                  <p>{client.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profitSummary !== undefined
                ? formatCurrency(profitSummary?.totalProfit || 0)
                : "Loading..."}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profitSummary !== undefined
                ? formatCurrency(profitSummary?.totalRevenue || 0)
                : "Loading..."}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profitSummary !== undefined ? profitSummary?.ordersCount || 0 : "Loading..."}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Profit / Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profitSummary !== undefined && (profitSummary?.ordersCount || 0) > 0
                ? formatCurrency(
                    (profitSummary?.totalProfit || 0) / (profitSummary?.ordersCount || 1)
                  )
                : profitSummary === undefined
                ? "Loading..."
                : formatCurrency(0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Productions</h2>
        <Button
          onClick={() =>
            router.push(`/dashboard/production/new?clientId=${clientId}`)
          }
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Production
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Start date</p>
          <DatePicker date={startDate} setDate={setStartDate} />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">End date</p>
          <DatePicker date={endDate} setDate={setEndDate} />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Sort by date</p>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "asc" | "desc")}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest first</SelectItem>
              <SelectItem value="asc">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProductions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No productions found for this client.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProductions.map((production: any) => (
                  <TableRow
                    key={production._id.toString()}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      router.push(`/dashboard/production/${production._id}`)
                    }
                  >
                    <TableCell>{production.articleName}</TableCell>
                    <TableCell>{production.type}</TableCell>
                    <TableCell>{production.totalPieces}</TableCell>
                    <TableCell>{production.status}</TableCell>
                    <TableCell>Rs{production.clientPrice}</TableCell>
                    <TableCell>{formatDate(production.createdAt)}</TableCell>
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
