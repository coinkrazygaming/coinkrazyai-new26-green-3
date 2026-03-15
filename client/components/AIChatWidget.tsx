import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageSquare, X, Send, Cpu, Bot, Loader2, Sparkles, TrendingUp, ShieldCheck, History, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  agent?: string;
  timestamp: Date;
}

interface ConversationSession {
  id: string;
  session_id: string;
  title: string;
  topic: string;
  total_messages: number;
  last_interaction_at: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: "Hello! I'm LuckyAI, your personal casino optimizer. How can I help you win today?",
    sender: 'ai',
    agent: 'LuckyAI',
    timestamp: new Date(),
  },
];

// Generate unique session ID
function generateSessionId(userId: number | undefined): string {
  return `session-${userId}-${Date.now()}`;
}

export const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize session
  useEffect(() => {
    if (user?.id && !sessionId) {
      const newSessionId = generateSessionId(user.id);
      setSessionId(newSessionId);
      localStorage.setItem(`ai-session-${user.id}`, newSessionId);
    }
  }, [user, sessionId]);

  // Load conversation history when session changes
  useEffect(() => {
    if (isOpen && sessionId) {
      loadConversationHistory();
    }
  }, [sessionId, isOpen]);

  // Load saved sessions
  useEffect(() => {
    if (isOpen && user?.id) {
      loadSessions();
    }
  }, [isOpen, user?.id]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const loadConversationHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch(`/api/ai/conversation/history?sessionId=${sessionId}`, {
        credentials: 'include'
      });

      if (!response.ok) return;

      const result = await response.json();
      if (result.data && result.data.length > 0) {
        const loadedMessages: Message[] = result.data.map((msg: any) => ({
          id: msg.id.toString(),
          text: msg.message_content,
          sender: msg.message_type === 'user' ? 'user' : 'ai',
          agent: msg.agent_name,
          timestamp: new Date(msg.created_at),
        }));
        setMessages(loadedMessages.length > 0 ? loadedMessages : INITIAL_MESSAGES);
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/ai/conversation/sessions', {
        credentials: 'include'
      });

      if (!response.ok) return;

      const result = await response.json();
      if (result.data) {
        setSessions(result.data.slice(0, 10)); // Show last 10 sessions
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const switchSession = (newSessionId: string) => {
    setSessionId(newSessionId);
    setShowSessions(false);
    setMessages(INITIAL_MESSAGES);
  };

  const startNewSession = () => {
    if (user?.id) {
      const newSessionId = generateSessionId(user.id);
      setSessionId(newSessionId);
      localStorage.setItem(`ai-session-${user.id}`, newSessionId);
      setMessages(INITIAL_MESSAGES);
      setShowSessions(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    const messageToSend = inputValue;
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Call real AI API
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageToSend,
          sessionId: sessionId,
          conversationHistory: messages.slice(-5) // Send last 5 messages for context
        })
      });

      const result = await response.json();

      if (result.success && result.data) {
        const aiMessage: Message = {
          id: result.data.messageId?.toString() || (Date.now() + 1).toString(),
          text: result.data.message,
          sender: 'ai',
          agent: result.data.agent,
          timestamp: new Date(result.data.timestamp),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('AI Chat failed:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting to the optimization engine. Please try again soon.",
        sender: 'ai',
        agent: 'System',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
      {/* Session History Sidebar */}
      {isOpen && showSessions && (
        <Card className="w-64 h-[500px] flex flex-col shadow-2xl border-2 border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-300 mr-2">
          <CardHeader className="bg-slate-200 dark:bg-slate-800 p-3 flex flex-row items-center justify-between space-y-0 border-b">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <CardTitle className="text-xs font-bold">CHAT HISTORY</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSessions(false)}
              className="h-6 w-6"
            >
              <X className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">
            <Button
              onClick={startNewSession}
              size="sm"
              className="w-full text-xs"
              variant="outline"
            >
              <Plus className="w-3 h-3 mr-1" />
              New Chat
            </Button>
            {sessions.map((session) => (
              <button
                key={session.session_id}
                onClick={() => switchSession(session.session_id)}
                className={cn(
                  "w-full text-left p-2 rounded text-xs truncate transition-colors",
                  sessionId === session.session_id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                <div className="font-semibold truncate">{session.title}</div>
                <div className="text-[10px] opacity-70">{session.total_messages} messages</div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="w-80 md:w-96 h-[500px] flex flex-col shadow-2xl border-2 border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CardHeader className="bg-primary p-4 text-primary-foreground rounded-t-lg flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-black italic">KRAZY AI ASSISTANT</CardTitle>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold uppercase opacity-80">Online & Optimized</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSessions(!showSessions)}
                className="hover:bg-white/10 text-white h-8 w-8"
                title="Conversation history"
              >
                <History className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-white/10 text-white h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
            {isLoadingHistory && (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
            {!isLoadingHistory && messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col max-w-[85%]",
                  message.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                {message.agent && (
                  <span className="text-[10px] font-black uppercase text-slate-500 mb-1 ml-1 flex items-center gap-1">
                    {message.agent === 'SecurityAI' ? <ShieldCheck className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                    {message.agent}
                  </span>
                )}
                <div
                  className={cn(
                    "p-3 rounded-2xl text-sm font-medium shadow-sm",
                    message.sender === 'user'
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-none"
                  )}
                >
                  {message.text}
                </div>
                <span className="text-[8px] text-slate-500 mt-1 uppercase font-bold">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {isTyping && (
              <div className="flex flex-col items-start max-w-[85%]">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl rounded-tl-none shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          <CardFooter className="p-4 border-t bg-white dark:bg-slate-950/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex w-full gap-2"
            >
              <Input
                placeholder="Ask LuckyAI something..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-900"
              />
              <Button type="submit" size="icon" className="shrink-0" disabled={!inputValue.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}

      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className={cn(
          "w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300",
          isOpen ? "bg-slate-900 rotate-90" : "bg-primary hover:scale-110"
        )}
      >
        {isOpen ? (
          <X className="w-8 h-8" />
        ) : (
          <div className="relative">
            <Cpu className="w-8 h-8" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse" />
          </div>
        )}
      </Button>
    </div>
  );
};
