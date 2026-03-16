import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { adminV2 } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Suspense, lazy } from 'react';

// Lazy load admin sub-components to reduce main bundle
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard'));
const AdminSalesDashboard = lazy(() => import('@/components/admin/AdminSalesDashboard'));
const AdminNotifications = lazy(() => import('@/components/admin/AdminNotifications'));
const AdminPlayers = lazy(() => import('@/components/admin/AdminPlayers'));
const AdminKYC = lazy(() => import('@/components/admin/AdminKYC'));
const AdminWallet = lazy(() => import('@/components/admin/AdminWallet'));
const AdminFinancial = lazy(() => import('@/components/admin/AdminFinancial'));
const AdminGamesSports = lazy(() => import('@/components/admin/AdminGamesSports'));
const AdminOperations = lazy(() => import('@/components/admin/AdminOperations'));
const AdminAdvanced = lazy(() => import('@/components/admin/AdminAdvanced'));
const AdminStore = lazy(() => import('@/components/admin/AdminStore'));
const AIGameEditor = lazy(() => import('@/pages/admin/AIGameEditor'));

// Loading fallback component
const ComponentLoader = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-6 h-6 animate-spin text-primary" />
  </div>
);

const Admin = () => {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [adminVerified, setAdminVerified] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      // If isAdmin is already true, no need to verify
      if (isAdmin) {
        setAdminVerified(true);
        setIsLoading(false);
        return;
      }

      // Try to verify admin status by making an admin API call
      // If it succeeds, we know they have a valid admin token
      try {
        await adminV2.dashboard.getStats();
        setAdminVerified(true);
        setIsLoading(false);
      } catch (error: any) {
        // Not admin or no valid admin token
        if (!authLoading) {
          console.log('[Admin] Not authorized, redirecting to home');
          navigate('/');
        }
      }
    };

    if (!authLoading) {
      verifyAdmin();
    }
  }, [isAdmin, authLoading, navigate]);

  if (authLoading || isLoading || !adminVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b pb-6">
        <h1 className="text-4xl font-black tracking-tight mb-2">ADMIN DASHBOARD</h1>
        <p className="text-muted-foreground">Manage the CoinKrazy AI platform</p>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
        <TabsList className="grid w-full grid-cols-6 md:grid-cols-12 mb-6 overflow-x-auto">
          <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
          <TabsTrigger value="sales" className="text-xs">Sales</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">Notifications</TabsTrigger>
          <TabsTrigger value="players" className="text-xs">Players</TabsTrigger>
          <TabsTrigger value="kyc" className="text-xs">KYC</TabsTrigger>
          <TabsTrigger value="wallet" className="text-xs">Wallet</TabsTrigger>
          <TabsTrigger value="store" className="text-xs">Store</TabsTrigger>
          <TabsTrigger value="financial" className="text-xs">Financial</TabsTrigger>
          <TabsTrigger value="games" className="text-xs">Games</TabsTrigger>
          <TabsTrigger value="ai-editor" className="text-xs font-black text-orange-500">✨ AI Editor</TabsTrigger>
          <TabsTrigger value="operations" className="text-xs">Operations</TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs">Advanced</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard">
          <Suspense fallback={<ComponentLoader />}>
            <AdminDashboard />
          </Suspense>
        </TabsContent>

        {/* Sales Analytics */}
        <TabsContent value="sales">
          <Suspense fallback={<ComponentLoader />}>
            <AdminSalesDashboard />
          </Suspense>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Suspense fallback={<ComponentLoader />}>
            <AdminNotifications />
          </Suspense>
        </TabsContent>

        {/* Player Management */}
        <TabsContent value="players">
          <Suspense fallback={<ComponentLoader />}>
            <AdminPlayers />
          </Suspense>
        </TabsContent>

        {/* KYC Settings */}
        <TabsContent value="kyc">
          <Suspense fallback={<ComponentLoader />}>
            <AdminKYC />
          </Suspense>
        </TabsContent>

        {/* Wallet Management */}
        <TabsContent value="wallet">
          <Suspense fallback={<ComponentLoader />}>
            <AdminWallet />
          </Suspense>
        </TabsContent>

        {/* Store Management */}
        <TabsContent value="store">
          <Suspense fallback={<ComponentLoader />}>
            <AdminStore />
          </Suspense>
        </TabsContent>

        {/* Financial Management */}
        <TabsContent value="financial">
          <Suspense fallback={<ComponentLoader />}>
            <AdminFinancial />
          </Suspense>
        </TabsContent>

        {/* Games & Sports */}
        <TabsContent value="games">
          <Suspense fallback={<ComponentLoader />}>
            <AdminGamesSports />
          </Suspense>
        </TabsContent>

        {/* AI Game Editor */}
        <TabsContent value="ai-editor">
          <Suspense fallback={<ComponentLoader />}>
            <AIGameEditor />
          </Suspense>
        </TabsContent>

        {/* Operations */}
        <TabsContent value="operations">
          <Suspense fallback={<ComponentLoader />}>
            <AdminOperations />
          </Suspense>
        </TabsContent>

        {/* Advanced */}
        <TabsContent value="advanced">
          <Suspense fallback={<ComponentLoader />}>
            <AdminAdvanced />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
