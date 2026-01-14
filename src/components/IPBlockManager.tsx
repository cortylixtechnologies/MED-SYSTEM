import { useState } from 'react';
import { useIPBlocking, BlockedIP } from '@/hooks/useIPBlocking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Ban, Unlock, Trash2, Plus, RefreshCw, Shield } from 'lucide-react';
import { format } from 'date-fns';

const IPBlockManager = () => {
  const { blockedIPs, loading, blockIP, unblockIP, deleteBlock, refetch } = useIPBlocking();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<string>('permanent');

  const handleBlockIP = async () => {
    if (!newIP || !reason) return;
    
    const expiresIn = duration === 'permanent' ? undefined : parseInt(duration);
    await blockIP(newIP, reason, expiresIn);
    
    setNewIP('');
    setReason('');
    setDuration('permanent');
    setIsDialogOpen(false);
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const activeCount = blockedIPs.filter(ip => ip.is_active && !isExpired(ip.expires_at)).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5" />
              IP Block Manager
            </CardTitle>
            <Badge variant="secondary">{activeCount} Active Blocks</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Block IP
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Block IP Address</DialogTitle>
                  <DialogDescription>
                    Add a new IP address to the block list. This will prevent access to your application.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="ip">IP Address</Label>
                    <Input
                      id="ip"
                      placeholder="e.g., 192.168.1.1"
                      value={newIP}
                      onChange={(e) => setNewIP(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Input
                      id="reason"
                      placeholder="Reason for blocking..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Hour</SelectItem>
                        <SelectItem value="6">6 Hours</SelectItem>
                        <SelectItem value="24">24 Hours</SelectItem>
                        <SelectItem value="72">3 Days</SelectItem>
                        <SelectItem value="168">1 Week</SelectItem>
                        <SelectItem value="permanent">Permanent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBlockIP} disabled={!newIP || !reason}>
                    Block IP
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Address</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Blocked At</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blockedIPs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    {loading ? 'Loading...' : 'No blocked IPs'}
                  </TableCell>
                </TableRow>
              ) : (
                blockedIPs.map((ip) => {
                  const expired = isExpired(ip.expires_at);
                  const isActive = ip.is_active && !expired;
                  
                  return (
                    <TableRow key={ip.id}>
                      <TableCell className="font-mono">{ip.ip_address}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{ip.reason}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(ip.blocked_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {ip.expires_at 
                          ? format(new Date(ip.expires_at), 'MMM d, yyyy HH:mm')
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        {isActive ? (
                          <Badge variant="destructive">Active</Badge>
                        ) : expired ? (
                          <Badge variant="secondary">Expired</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => unblockIP(ip.id)}
                            >
                              <Unlock className="w-4 h-4" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Block Record</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this block record? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteBlock(ip.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default IPBlockManager;
