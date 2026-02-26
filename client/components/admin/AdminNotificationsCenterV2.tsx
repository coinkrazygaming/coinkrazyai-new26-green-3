import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiCall } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Check,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  MessageSquare,
  FileText,
  CreditCard,
  Gamepad2,
  Share2,
  Trash2,
  RefreshCw,
} from 'lucide-react';

interface Notification {
  id: number;
  type: string;
  subject: string;
  description: string;
  status: 'pending' | 'approved' | 'denied';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  ai_employee_name: string;
  data: any;
  related_game_id?: number;
  related_player_id?: number;
  created_at: string;
  updated_at: string;
}

interface GameApprovalData {
  name: string;
  slug: string;
  description: string;
  provider: string;
  rtp: number;
  volatility: string;
  theme: string;
  features: string[];
}

interface KYCDocumentData {
  player_id: number;
  player_name: string;
  document_type: string;
  document_url: string;
  status: string;
}

interface WithdrawalData {
  player_id: number;
  player_name: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
}

export const AdminNotificationsCenterV2: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [denyReason, setDenyReason] = useState('');
  const [showDenyForm, setShowDenyForm] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');

  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [notifications, statusFilter, typeFilter]);

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await apiCall(
        `/admin/v2/notifications?${params.toString()}`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if ((response as any).success) {
        setNotifications((response as any).data || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = notifications;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((n) => n.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((n) => n.type === typeFilter);
    }

    // Sort by priority and date
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      const priorityDiff =
        priorityOrder[a.priority as keyof typeof priorityOrder] -
        priorityOrder[b.priority as keyof typeof priorityOrder];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setFilteredNotifications(filtered);
  };

  const approveNotification = async (notificationId: number) => {
    try {
      await apiCall(`/admin/v2/notifications/${notificationId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ action_details: adminMessage }),
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, status: 'approved' } : n
        )
      );

      toast.success('✅ Notification approved!');
      setSelectedNotification(null);
      setAdminMessage('');
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('Failed to approve notification');
    }
  };

  const denyNotification = async (notificationId: number) => {
    if (!denyReason.trim()) {
      toast.error('Please provide a reason for denial');
      return;
    }

    try {
      await apiCall(`/admin/v2/notifications/${notificationId}/deny`, {
        method: 'POST',
        body: JSON.stringify({ reason: denyReason }),
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, status: 'denied' } : n
        )
      );

      toast.success('❌ Notification denied');
      setSelectedNotification(null);
      setDenyReason('');
      setShowDenyForm(false);
    } catch (error) {
      console.error('Failed to deny:', error);
      toast.error('Failed to deny notification');
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'bg-red-900/30 border-red-700 text-red-400',
      high: 'bg-orange-900/30 border-orange-700 text-orange-400',
      normal: 'bg-blue-900/30 border-blue-700 text-blue-400',
      low: 'bg-gray-700 text-gray-300',
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      new_games_ready: <Gamepad2 className="w-4 h-4" />,
      kyc_document_submitted: <FileText className="w-4 h-4" />,
      withdrawal_request: <CreditCard className="w-4 h-4" />,
      social_campaign_pending: <Share2 className="w-4 h-4" />,
    };
    return icons[type] || <AlertCircle className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: (
        <span className="flex items-center gap-1 px-3 py-1 bg-yellow-900/30 border border-yellow-700 text-yellow-400 rounded text-xs font-medium">
          <Clock className="w-3 h-3" /> Pending
        </span>
      ),
      approved: (
        <span className="flex items-center gap-1 px-3 py-1 bg-green-900/30 border border-green-700 text-green-400 rounded text-xs font-medium">
          <CheckCircle className="w-3 h-3" /> Approved
        </span>
      ),
      denied: (
        <span className="flex items-center gap-1 px-3 py-1 bg-red-900/30 border border-red-700 text-red-400 rounded text-xs font-medium">
          <XCircle className="w-3 h-3" /> Denied
        </span>
      ),
    };
    return badges[status] || badges.pending;
  };

  const notificationTypes = ['all', ...new Set(notifications.map((n) => n.type))];
  const pendingCount = notifications.filter((n) => n.status === 'pending').length;
  const approvedCount = notifications.filter((n) => n.status === 'approved').length;
  const deniedCount = notifications.filter((n) => n.status === 'denied').length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-4"
      >
        <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border border-yellow-700 rounded-lg p-6">
          <div className="text-4xl font-black text-yellow-400 mb-2">{pendingCount}</div>
          <p className="text-gray-300 text-sm">Pending Approvals</p>
        </div>
        <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-700 rounded-lg p-6">
          <div className="text-4xl font-black text-green-400 mb-2">{approvedCount}</div>
          <p className="text-gray-300 text-sm">Approved</p>
        </div>
        <div className="bg-gradient-to-br from-red-900/40 to-rose-900/40 border border-red-700 rounded-lg p-6">
          <div className="text-4xl font-black text-red-400 mb-2">{deniedCount}</div>
          <p className="text-gray-300 text-sm">Denied</p>
        </div>
      </motion.div>

      {/* Filter & Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Filter Notifications</h3>
          <Button
            onClick={fetchNotifications}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          >
            <option value="all">All Status</option>
            <option value="pending">⏳ Pending</option>
            <option value="approved">✅ Approved</option>
            <option value="denied">❌ Denied</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          >
            <option value="all">All Types</option>
            {notificationTypes
              .filter((t) => t !== 'all')
              .map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
          </select>
        </div>
      </motion.div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No notifications to display</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredNotifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
                  selectedNotification?.id === notif.id
                    ? 'bg-gray-700 border-orange-500'
                    : `bg-gray-800 border-gray-700 hover:border-orange-500`
                } ${getPriorityColor(notif.priority)}`}
                onClick={() => setSelectedNotification(notif)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">{getTypeIcon(notif.type)}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white mb-1">{notif.subject}</h4>
                      <p className="text-sm text-gray-400 mb-2">{notif.description}</p>
                      <div className="flex gap-2 items-center flex-wrap">
                        {getStatusBadge(notif.status)}
                        <span className="text-xs text-gray-500">
                          By: {notif.ai_employee_name || 'System'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(notif.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {notif.status === 'pending' && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          approveNotification(notif.id);
                        }}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDenyForm(true);
                        }}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-gray-800 border-2 border-orange-500 rounded-lg p-6 space-y-4"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {selectedNotification.subject}
                </h3>
                <p className="text-gray-400">{selectedNotification.description}</p>
              </div>
              <Button
                onClick={() => setSelectedNotification(null)}
                variant="outline"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Render appropriate detail view based on type */}
            <NotificationDetailView notification={selectedNotification} />

            {/* Admin Actions */}
            {selectedNotification.status === 'pending' && (
              <div className="space-y-4 border-t border-gray-700 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Admin Comment (Optional)
                  </label>
                  <Textarea
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    placeholder="Add any notes before approving..."
                    rows={3}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => approveNotification(selectedNotification.id)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>

                  <Button
                    onClick={() => setShowDenyForm(!showDenyForm)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Deny
                  </Button>
                </div>

                {showDenyForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3 bg-red-900/20 border border-red-700 rounded p-4"
                  >
                    <label className="block text-sm font-medium text-gray-300">
                      Reason for Denial *
                    </label>
                    <Textarea
                      value={denyReason}
                      onChange={(e) => setDenyReason(e.target.value)}
                      placeholder="Explain why you're denying this notification..."
                      rows={3}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={() => denyNotification(selectedNotification.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        Confirm Denial
                      </Button>
                      <Button
                        onClick={() => {
                          setShowDenyForm(false);
                          setDenyReason('');
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Render different detail views based on notification type
 */
const NotificationDetailView: React.FC<{ notification: Notification }> = ({
  notification,
}) => {
  const data = notification.data;

  switch (notification.type) {
    case 'new_games_ready':
      return (
        <div className="grid grid-cols-2 gap-4 bg-gray-900 rounded p-4">
          <div>
            <label className="text-xs text-gray-500 uppercase">Game Name</label>
            <p className="text-white font-bold">{data?.name || 'N/A'}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Provider</label>
            <p className="text-white font-bold">{data?.provider || 'N/A'}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">RTP</label>
            <p className="text-white font-bold">{data?.rtp}%</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Volatility</label>
            <p className="text-white font-bold">{data?.volatility || 'N/A'}</p>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 uppercase">Description</label>
            <p className="text-gray-300">{data?.description || 'N/A'}</p>
          </div>
          {data?.features && (
            <div className="col-span-2">
              <label className="text-xs text-gray-500 uppercase">Features</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {data.features.map((f: string) => (
                  <span
                    key={f}
                    className="px-2 py-1 bg-orange-900/40 border border-orange-700 text-orange-400 rounded text-xs"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    case 'kyc_document_submitted':
      return (
        <div className="space-y-4 bg-gray-900 rounded p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase">Player Name</label>
              <p className="text-white font-bold">{data?.player_name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Document Type</label>
              <p className="text-white font-bold">{data?.document_type || 'N/A'}</p>
            </div>
          </div>
          {data?.document_url && (
            <div>
              <label className="text-xs text-gray-500 uppercase mb-2 block">
                Document Preview
              </label>
              {data.document_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img
                  src={data.document_url}
                  alt="KYC Document"
                  className="max-w-full h-48 rounded border border-gray-700"
                />
              ) : (
                <a
                  href={data.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:text-orange-300 underline"
                >
                  📄 View Document
                </a>
              )}
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 uppercase mb-2 block">
              Actions Available
            </label>
            <div className="space-y-2">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 justify-center">
                <Mail className="w-4 h-4 mr-2" />
                Send Approval Email to Player
              </Button>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 justify-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message to Player
              </Button>
            </div>
          </div>
        </div>
      );

    case 'withdrawal_request':
      return (
        <div className="space-y-4 bg-gray-900 rounded p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase">Player Name</label>
              <p className="text-white font-bold">{data?.player_name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Amount</label>
              <p className="text-white font-bold">
                {data?.currency} {data?.amount}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Payment Method</label>
              <p className="text-white font-bold">{data?.payment_method || 'N/A'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Status</label>
              <p className="text-white font-bold">{data?.status || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase mb-2 block">
              Actions Available
            </label>
            <div className="space-y-2">
              <Button className="w-full bg-green-600 hover:bg-green-700 justify-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Process Payment
              </Button>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 justify-center">
                <Mail className="w-4 h-4 mr-2" />
                Send Confirmation Email
              </Button>
            </div>
          </div>
        </div>
      );

    case 'social_campaign_pending':
      return (
        <div className="space-y-4 bg-gray-900 rounded p-4">
          <div>
            <label className="text-xs text-gray-500 uppercase block mb-2">
              Campaign Content
            </label>
            {data?.email && (
              <div className="mb-4 p-3 border border-gray-700 rounded">
                <p className="font-bold text-yellow-400 mb-2">📧 Email Campaign</p>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{data.email.subject}</p>
              </div>
            )}
            {data?.sms && (
              <div className="mb-4 p-3 border border-gray-700 rounded">
                <p className="font-bold text-green-400 mb-2">💬 SMS Campaign</p>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{data.sms.message}</p>
              </div>
            )}
            {data?.social && (
              <div className="mb-4 p-3 border border-gray-700 rounded">
                <p className="font-bold text-blue-400 mb-2">🐦 Social Posts</p>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{data.social.posts?.[0]}</p>
              </div>
            )}
          </div>
        </div>
      );

    default:
      return (
        <div className="bg-gray-900 rounded p-4">
          <pre className="text-gray-300 text-xs overflow-auto max-h-48">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      );
  }
};

export default AdminNotificationsCenterV2;
