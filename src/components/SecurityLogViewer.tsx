import { useState } from 'react';
import { useSecurityLogs, SecurityLog } from '@/hooks/useSecurityLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  RefreshCw, 
  Download, 
  Search, 
  Shield, 
  AlertTriangle,
  Ban,
  LogIn,
  LogOut,
  XCircle,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';

const eventTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  login_success: { label: 'Login Success', icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-500' },
  login_failure: { label: 'Login Failed', icon: <XCircle className="w-4 h-4" />, color: 'bg-red-500' },
  login_attempt: { label: 'Login Attempt', icon: <LogIn className="w-4 h-4" />, color: 'bg-blue-500' },
  logout: { label: 'Logout', icon: <LogOut className="w-4 h-4" />, color: 'bg-gray-500' },
  blocked_access: { label: 'Blocked Access', icon: <Ban className="w-4 h-4" />, color: 'bg-red-700' },
  auto_block: { label: 'Auto Block', icon: <Shield className="w-4 h-4" />, color: 'bg-orange-500' },
  rate_limit_exceeded: { label: 'Rate Limit', icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-yellow-500' },
  suspicious_activity: { label: 'Suspicious', icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-orange-600' },
};

const SecurityLogViewer = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const { logs, loading, refetch, exportLogsAsCSV } = useSecurityLogs({ limit: 200 });

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.ip_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.event_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEventType = eventFilter === 'all' || log.event_type === eventFilter;
    
    return matchesSearch && matchesEventType;
  });

  const getEventConfig = (eventType: string) => {
    return eventTypeConfig[eventType] || { 
      label: eventType, 
      icon: <Shield className="w-4 h-4" />, 
      color: 'bg-gray-500' 
    };
  };

  const formatDetails = (details: Record<string, unknown> | null) => {
    if (!details) return '-';
    const entries = Object.entries(details).slice(0, 2);
    return entries.map(([key, value]) => `${key}: ${String(value)}`).join(', ');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Logs
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportLogsAsCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by IP, email, or event type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {Object.entries(eventTypeConfig).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {loading ? 'Loading...' : 'No security logs found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const config = getEventConfig(log.event_type);
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${config.color} text-white flex items-center gap-1 w-fit`}>
                          {config.icon}
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ip_address || '-'}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {log.email || '-'}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {formatDetails(log.details)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {logs.length} logs
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityLogViewer;
