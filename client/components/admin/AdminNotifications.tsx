import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Loader2,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Check,
  X,
  Search,
  Filter,
  MoreVertical,
  Archive,
  Eye,
  Zap,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApiCall } from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { cn } from '@/lib/utils';

interface AdminNotification {
  id: number;
  ai_employee_id: string;
  message_type: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'approved' | 'denied' | 'completed';
  player_username?: string;
  game_name?: string;
  related_player_id?: number;
  related_game_id?: number;
  created_at: string;
  read_at?: string;
}

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('pending');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await adminApiCall<AdminNotification[]>(
        `/admin/notifications?status=${activeStatus}`
      );
      const data = Array.isArray(response) ? response : response.data || [];
      setNotifications(data);

      // Update unread count
      const unread = data.filter((n) => !n.read_at).length;
      setUnreadCount(unread);
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [activeStatus]);

  // Setup socket and initial data
  useEffect(() => {
    fetchNotifications();

    // Setup socket for real-time updates
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('admin:notification', (notification: AdminNotification) => {
      console.log('[Socket] New admin notification:', notification);
      if (notification.status === activeStatus) {
        setNotifications((prev) => {
          const exists = prev.find((n) => n.id === notification.id);
          if (exists) {
            return prev.map((n) => (n.id === notification.id ? notification : n));
          }
          return [notification, ...prev];
        });

        // Toast for critical notifications
        if (notification.priority === 'critical') {
          toast.error(
            `🚨 CRITICAL: ${notification.subject}`,
            {
              description: notification.message.substring(0, 80),
              duration: 0,
            }
          );
        } else {
          toast.info(`New ${notification.priority} notification: ${notification.subject}`);
        }
      }
    });

    const interval = setInterval(fetchNotifications, 30000);
    
    return () => {
      clearInterval(interval);
      newSocket.disconnect();
      setSocket(null);
    };
  }, [activeStatus, fetchNotifications]);

  // Filter notifications based on search and filters
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      searchQuery === '' ||
      notification.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.player_username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.game_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = !priorityFilter || notification.priority === priorityFilter;
    const matchesType = !typeFilter || notification.message_type === typeFilter;

    return matchesSearch && matchesPriority && matchesType;
  });

  // Handle notification action
  const handleAction = async (
    notificationId: number,
    actionType: string,
    actionData?: Record<string, any>
  ) => {
    try {
      setActionLoading(notificationId);
      const endpoint = `/admin/notifications/${actionType}`;

      await adminApiCall(
        endpoint,
        {
          method: 'POST',
          body: JSON.stringify({
            notificationId,
            reason: actionData?.reason,
            assignedAiEmployee: actionData?.assignedAiEmployee,
            resolution: actionData?.resolution,
          }),
        }
      );

      toast.success(`Notification ${actionType} successfully`);
      fetchNotifications();
    } catch (error: any) {
      console.error(`Failed to ${actionType} notification:`, error);
      toast.error(`Failed to ${actionType} notification`);
    } finally {
      setActionLoading(null);
    }
  };

  // Mark as read
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await adminApiCall(`/admin/notifications/read`, {
        method: 'POST',
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'low':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    }
  };

  // Get priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertCircle className="w-4 h-4" />;
      case 'high':
        return <Zap className="w-4 h-4" />;
      case 'medium':
        return <Clock className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Notifications</h2>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 && `${unreadCount} unread • `}
            {notifications.length} total in {activeStatus}
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Notification
            </Button>
          </DialogTrigger>
          <DialogContent>
            <CreateNotificationForm
              onSuccess={() => {
                setShowCreateDialog(false);
                fetchNotifications();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Select value={priorityFilter || ''} onValueChange={(val) => setPriorityFilter(val || null)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter || ''} onValueChange={(val) => setTypeFilter(val || null)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="alert">Alert</SelectItem>
            <SelectItem value="task">Task</SelectItem>
            <SelectItem value="message">Message</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status tabs */}
      <Tabs value={activeStatus} onValueChange={setActiveStatus}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending" className="relative">
            Pending
            {notifications.filter((n) => n.status === 'pending' && !n.read_at).length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="denied">Denied</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {['pending', 'in_progress', 'approved', 'denied', 'completed'].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4 mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No notifications in {status}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onAction={handleAction}
                    onMarkAsRead={handleMarkAsRead}
                    getPriorityColor={getPriorityColor}
                    getPriorityIcon={getPriorityIcon}
                    actionLoading={actionLoading === notification.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// Notification Card Component
function NotificationCard({
  notification,
  onAction,
  onMarkAsRead,
  getPriorityColor,
  getPriorityIcon,
  actionLoading,
}: any) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-colors hover:bg-accent',
        !notification.read_at && 'bg-blue-500/5 border-blue-500/20'
      )}
      onClick={() => !notification.read_at && onMarkAsRead(notification.id)}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn(
                      'flex items-center gap-1',
                      getPriorityColor(notification.priority)
                    )}
                  >
                    {getPriorityIcon(notification.priority)}
                    {notification.priority}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {notification.message_type}
                  </Badge>
                  {!notification.read_at && (
                    <Badge className="bg-red-500 text-white animate-pulse">Unread</Badge>
                  )}
                </div>

                <h4 className="font-semibold text-sm leading-tight mb-1">
                  {notification.subject}
                </h4>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {notification.message}
                </p>

                <div className="flex gap-2 flex-wrap text-xs text-muted-foreground">
                  {notification.player_username && (
                    <span>Player: {notification.player_username}</span>
                  )}
                  {notification.game_name && <span>Game: {notification.game_name}</span>}
                  {notification.ai_employee_id && <span>From: {notification.ai_employee_id}</span>}
                  <span>{new Date(notification.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Mark as Read
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {notification.status === 'pending' && (
                      <>
                        <DropdownMenuItem
                          onClick={() => onAction(notification.id, 'approve')}
                          disabled={actionLoading}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onAction(notification.id, 'deny')}
                          disabled={actionLoading}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Deny
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onAction(notification.id, 'assign')}
                          disabled={actionLoading}
                        >
                          Assign
                        </DropdownMenuItem>
                      </>
                    )}
                    {notification.status === 'in_progress' && (
                      <DropdownMenuItem
                        onClick={() => onAction(notification.id, 'resolve')}
                        disabled={actionLoading}
                      >
                        Resolve
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Create Notification Form Component
function CreateNotificationForm({ onSuccess }: any) {
  const [formData, setFormData] = useState({
    aiEmployeeId: '',
    messageType: 'alert',
    subject: '',
    message: '',
    priority: 'medium',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.message || !formData.aiEmployeeId) {
      toast.error('Subject, message, and AI Employee ID are required');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApiCall('/admin/notifications', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      toast.success('Notification created successfully');
      onSuccess();
    } catch (error) {
      toast.error('Failed to create notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Create Admin Notification</DialogTitle>
        <DialogDescription>Send a notification to the admin team</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">AI Employee ID *</label>
          <Input
            placeholder="e.g., AI-1"
            value={formData.aiEmployeeId}
            onChange={(e) => setFormData({ ...formData, aiEmployeeId: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Subject *</label>
          <Input
            placeholder="Notification subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Message *</label>
          <textarea
            className="w-full min-h-24 p-2 border rounded-md"
            placeholder="Notification message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Type</label>
            <Select value={formData.messageType} onValueChange={(val) => setFormData({ ...formData, messageType: val })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alert">Alert</SelectItem>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="message">Message</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Priority</label>
            <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Create Notification
        </Button>
      </div>
    </form>
  );
}

export default AdminNotifications;
