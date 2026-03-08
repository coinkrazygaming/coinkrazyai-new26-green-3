import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LifeBuoy, 
  MessageCircle, 
  FileText, 
  Search, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  PlusCircle,
  Send,
  MessageSquare,
  Eye
} from 'lucide-react';
import { apiCall } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface SupportTicket {
  id: number;
  subject: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  category: string;
  created_at: string;
  updated_at: string;
  messages?: Array<{
    id: number;
    author: string;
    message: string;
    timestamp: string;
    isAdmin: boolean;
  }>;
}

const FAQ_ITEMS = [
  {
    question: 'How long does withdrawal take?',
    answer: 'Bank transfers typically take 3-5 business days. Credit card transfers take 1-2 business days. The exact time depends on your bank.'
  },
  {
    question: 'How do I verify my account?',
    answer: 'You can verify your account by submitting a valid ID and proof of address. Go to Settings > KYC Verification to upload your documents.'
  },
  {
    question: 'What is the maximum withdrawal amount?',
    answer: 'Daily withdrawal limit is $5,000 and monthly limit is $50,000. VIP members have higher limits. Contact support to request an increase.'
  },
  {
    question: 'Can I play if I\'m not verified?',
    answer: 'Yes, you can play with unverified status. However, you cannot withdraw funds until your account is verified.'
  },
  {
    question: 'How do I reset my password?',
    answer: 'Click "Forgot Password" on the login page. You\'ll receive an email with a reset link. Follow the instructions to set a new password.'
  },
  {
    question: 'Are my funds safe?',
    answer: 'Yes, your funds are held in segregated accounts and are protected by industry-standard security measures. We use encryption for all transactions.'
  }
];

const SUPPORT_CATEGORIES = ['General', 'Account', 'Payments', 'Verification', 'Technical', 'Responsible Gaming', 'Other'];
const PRIORITY_LEVELS = ['Low', 'Medium', 'High', 'Urgent'];

const Support = () => {
  const { user, isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 101,
      subject: 'Withdrawal processing time',
      description: 'My withdrawal is taking longer than expected',
      status: 'In Progress',
      priority: 'Medium',
      category: 'Payments',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
      messages: [
        {
          id: 1,
          author: 'You',
          message: 'Hi, I submitted a withdrawal request 2 days ago but it hasn\'t been processed yet.',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          isAdmin: false
        },
        {
          id: 2,
          author: 'Support Team',
          message: 'Thank you for contacting us. We\'re looking into your withdrawal. It should be processed within 24 hours.',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          isAdmin: true
        }
      ]
    },
    {
      id: 98,
      subject: 'Verification document rejected',
      description: 'My ID was rejected during verification',
      status: 'Resolved',
      priority: 'High',
      category: 'Verification',
      created_at: new Date(Date.now() - 604800000).toISOString(),
      updated_at: new Date(Date.now() - 259200000).toISOString(),
      messages: [
        {
          id: 1,
          author: 'You',
          message: 'My ID submission was rejected. What should I do?',
          timestamp: new Date(Date.now() - 604800000).toISOString(),
          isAdmin: false
        },
        {
          id: 2,
          author: 'Support Team',
          message: 'Could you please resubmit with better lighting and all edges visible?',
          timestamp: new Date(Date.now() - 518400000).toISOString(),
          isAdmin: true
        },
        {
          id: 3,
          author: 'You',
          message: 'Just resubmitted. Thanks!',
          timestamp: new Date(Date.now() - 432000000).toISOString(),
          isAdmin: false
        },
        {
          id: 4,
          author: 'Support Team',
          message: 'Perfect! Your account is now verified. Welcome!',
          timestamp: new Date(Date.now() - 259200000).toISOString(),
          isAdmin: true
        }
      ]
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('tickets');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [newMessage, setNewMessage] = useState('');
  
  // New ticket form
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    category: 'General',
    priority: 'Medium',
    attachments: [] as File[]
  });

  useEffect(() => {
    if (isAuthenticated) {
      // Don't actually load from API in this case since we have demo data
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.subject.trim() || !ticketForm.description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const newTicket: SupportTicket = {
        id: Math.max(...tickets.map(t => t.id), 0) + 1,
        subject: ticketForm.subject,
        description: ticketForm.description,
        status: 'Open',
        priority: (ticketForm.priority as any),
        category: ticketForm.category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [{
          id: 1,
          author: 'You',
          message: ticketForm.description,
          timestamp: new Date().toISOString(),
          isAdmin: false
        }]
      };

      setTickets([newTicket, ...tickets]);
      toast.success('Support ticket created successfully');
      setShowNewTicket(false);
      setTicketForm({
        subject: '',
        description: '',
        category: 'General',
        priority: 'Medium',
        attachments: []
      });
    } catch (error) {
      toast.error('Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    try {
      setIsSubmitting(true);
      const updatedTickets = tickets.map(t => {
        if (t.id === selectedTicket.id) {
          return {
            ...t,
            messages: [
              ...(t.messages || []),
              {
                id: (t.messages?.length || 0) + 1,
                author: 'You',
                message: newMessage,
                timestamp: new Date().toISOString(),
                isAdmin: false
              }
            ]
          };
        }
        return t;
      });
      
      setTickets(updatedTickets);
      setSelectedTicket(updatedTickets.find(t => t.id === selectedTicket.id) || null);
      setNewMessage('');
      toast.success('Message sent');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'In Progress':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'Resolved':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'Closed':
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low':
        return 'bg-gray-500/10 text-gray-700';
      case 'Medium':
        return 'bg-blue-500/10 text-blue-700';
      case 'High':
        return 'bg-orange-500/10 text-orange-700';
      case 'Urgent':
        return 'bg-red-500/10 text-red-700';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open':
        return <AlertCircle className="w-4 h-4" />;
      case 'In Progress':
        return <Clock className="w-4 h-4" />;
      case 'Resolved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'Closed':
        return <FileText className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.id.toString().includes(searchQuery);
    const matchesStatus = filterStatus === 'All' || ticket.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
          <p className="text-muted-foreground">Get help with your account and resolve issues quickly</p>
        </div>
        {isAuthenticated && (
          <Button 
            onClick={() => setShowNewTicket(true)}
            className="w-full md:w-auto"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Ticket
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tickets">My Tickets</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="contact">Contact Us</TabsTrigger>
        </TabsList>

        {/* My Tickets Tab */}
        <TabsContent value="tickets" className="space-y-6">
          {isAuthenticated ? (
            <>
              {/* Search and Filter */}
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets by subject or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="All">All Status</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {/* Tickets List */}
              <div className="space-y-3">
                {filteredTickets.length > 0 ? (
                  filteredTickets.map(ticket => (
                    <Card 
                      key={ticket.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setShowTicketDetail(true);
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-sm font-bold text-muted-foreground">#{ticket.id}</span>
                              <h3 className="text-lg font-bold">{ticket.subject}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{ticket.description}</p>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline">{ticket.category}</Badge>
                              <Badge className={cn('gap-1', getStatusColor(ticket.status))}>
                                {getStatusIcon(ticket.status)}
                                {ticket.status}
                              </Badge>
                              <Badge className={getPriorityColor(ticket.priority)}>
                                {ticket.priority} Priority
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                            {ticket.messages && ticket.messages.length > 0 && (
                              <Badge variant="secondary" className="gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {ticket.messages.length}
                              </Badge>
                            )}
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <LifeBuoy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No tickets found</p>
                      <Button onClick={() => setShowNewTicket(true)}>
                        Create Your First Ticket
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Please log in to view your support tickets</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FAQ_ITEMS.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base">{item.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-200">Didn't find an answer?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-900 dark:text-blue-200 mb-4">
                If you couldn't find the answer you're looking for, please create a support ticket and our team will help you shortly.
              </p>
              {isAuthenticated && (
                <Button onClick={() => setShowNewTicket(true)}>
                  Create Support Ticket
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Get in Touch</CardTitle>
              <CardDescription>Multiple ways to reach our support team</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4 p-6 bg-muted rounded-lg">
                <MessageCircle className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-bold mb-2">Live Chat</h3>
                  <p className="text-sm text-muted-foreground mb-3">Available 24/7 for immediate assistance</p>
                  <Button variant="outline" className="w-full">
                    Start Chat
                  </Button>
                </div>
              </div>

              <div className="space-y-4 p-6 bg-muted rounded-lg">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-bold mb-2">Email Support</h3>
                  <p className="text-sm text-muted-foreground mb-3">support@coinkrazy.ai</p>
                  <p className="text-xs text-muted-foreground">Response time: 2-4 hours</p>
                </div>
              </div>

              <div className="space-y-4 p-6 bg-muted rounded-lg">
                <AlertCircle className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-bold mb-2">Urgent Issues</h3>
                  <p className="text-sm text-muted-foreground mb-3">For urgent matters, create a ticket and mark as Urgent</p>
                  <Button variant="outline" className="w-full">
                    {isAuthenticated ? 'Create Urgent Ticket' : 'Sign In'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Ticket Dialog */}
      <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Describe your issue and our team will help you as soon as possible
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                placeholder="Brief description of your issue"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select 
                  id="category"
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({...ticketForm, category: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {SUPPORT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select 
                  id="priority"
                  value={ticketForm.priority}
                  onChange={(e) => setTicketForm({...ticketForm, priority: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {PRIORITY_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={ticketForm.description}
                onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
                placeholder="Please provide as much detail as possible"
                rows={6}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button"
                variant="outline"
                onClick={() => setShowNewTicket(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={showTicketDetail} onOpenChange={setShowTicketDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle>Ticket #{selectedTicket.id}: {selectedTicket.subject}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Ticket Info */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge className={getStatusColor(selectedTicket.status)}>
                      {selectedTicket.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Priority</p>
                    <Badge className={getPriorityColor(selectedTicket.priority)}>
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Category</p>
                    <Badge variant="outline">{selectedTicket.category}</Badge>
                  </div>
                </div>

                {/* Messages */}
                <div className="space-y-3 max-h-64 overflow-y-auto p-4 bg-muted/30 rounded-lg">
                  {selectedTicket.messages?.map(msg => (
                    <div 
                      key={msg.id}
                      className={cn(
                        'p-3 rounded-lg',
                        msg.isAdmin 
                          ? 'bg-blue-500/10 border border-blue-200' 
                          : 'bg-gray-500/10'
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-semibold text-sm">
                          {msg.author}
                          {msg.isAdmin && <Badge variant="secondary" className="ml-2">Support Team</Badge>}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  ))}
                </div>

                {/* New Message */}
                {selectedTicket.status !== 'Closed' && (
                  <div className="space-y-2">
                    <Label htmlFor="newMessage">Add a Reply</Label>
                    <div className="flex gap-2">
                      <Textarea
                        id="newMessage"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setShowTicketDetail(false);
                          setSelectedTicket(null);
                        }}
                      >
                        Close
                      </Button>
                      <Button 
                        onClick={handleAddMessage}
                        disabled={isSubmitting || !newMessage.trim()}
                      >
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Support;
