"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Activity,
  Users,
  FileText,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Clock,
  Bell,
  Settings,
  LogIn,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getCurrentUser, getCurrentUserRoles, pocketbase } from "@/lib/auth";
import { PendingUserDialog } from "@/components/PendingUserDialog";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { ThemeToggleButton } from "@/components/ThemeToggle";
import { SessionWarningDialog } from "@/components/SessionWarningDialog";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

export default function DashboardPage() {
  const router = useRouter();
  const { currentTenant, currentRole, setWorkspace } = useWorkspace();
  const [user, setUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Session timeout management
  const { showWarning, timeRemaining, extendSession, logout } = useSessionTimeout(currentRole?.name);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      checkUserRoles(currentUser.id);
    }

    // Load sidebar state from localStorage
    const savedSidebarState = localStorage.getItem('sidebar-collapsed');
    if (savedSidebarState !== null) {
      setSidebarCollapsed(JSON.parse(savedSidebarState));
    }
  }, [currentTenant, currentRole]);


  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
  };

  const checkUserRoles = async (userId: string) => {
    try {
      // El dashboard ya tiene acceso al contexto de workspace
      // No es necesario volver a obtener los roles, solo usar los del contexto
      // Si se necesita actualizar los roles, debería hacerse a través del contexto
      
      // Si el contexto de workspace no tiene roles pero sí tiene tenant y rol,
      // podemos confiar en esos valores
      if (currentTenant && currentRole) {
        // Ya tenemos la información del entorno hospitalario
        setShowPendingDialog(false);
      } else {
        // Si no tenemos información del workspace, mostrar diálogo de pendiente
        setShowPendingDialog(true);
      }
    } catch (error) {
      console.error('Error checking user roles:', error);
    }
  };


  const getTenantLogoUrl = () => {
    if (currentTenant && currentTenant.logo) {
      // 'hub_tenants' is the collection name, 'currentTenant' is the record
      // PocketBase file fields can return a string (single file) or an array of strings (multiple files)
      const logoFileName = Array.isArray(currentTenant.logo) ? currentTenant.logo[0] : currentTenant.logo;
      if (logoFileName && currentTenant.id) { // Ensure currentTenant.id exists for getUrl
        // The collection ID for hub_tenants can be hardcoded or fetched if needed
        // For now, assuming collection name 'hub_tenants' for getUrl
        return pocketbase.files.getUrl(currentTenant, logoFileName, { thumb: '40x40' }); // Optional: request a thumbnail
      }
    }
    return undefined;
  };

  const isUserPending = userRoles.length === 0 && user;

  const stats = [
    {
      title: "Total Revenue",
      value: "$45,231.89",
      change: "+20.1%",
      icon: Activity,
    },
    {
      title: "Subscriptions",
      value: "+2350",
      change: "+180.1%",
      icon: Users,
    },
    {
      title: "Sales",
      value: "+12,234",
      change: "+19%",
      icon: FileText,
    },
    {
      title: "Active Now",
      value: "+573",
      change: "+201",
      icon: AlertTriangle,
    }
  ];

  const modules = [
    { name: "Gestión de Pacientes", description: "Administrar historiales médicos", color: "border-blue-200", href: "/patients" },
    { name: "Reportes Médicos", description: "Generar y revisar reportes", color: "border-green-200", href: "/reports" },
    { name: "Agenda Médica", description: "Programar citas y turnos", color: "border-purple-200", href: "/schedule" },
    { name: "Inventario", description: "Control de medicamentos", color: "border-orange-200", href: "/inventory" },
    { name: "Comunicación", description: "Chat y notificaciones", color: "border-pink-200", href: "/communication" },
    { name: "Administración", description: "Panel de administración", color: "border-gray-200", href: "/admin" }
  ];

  const recentActivities = [
    { time: "09:30", action: "Nueva consulta registrada", patient: "Juan Pérez" },
    { time: "09:15", action: "Reporte médico completado", patient: "María González" },
    { time: "08:45", action: "Urgencia atendida", patient: "Carlos Rodríguez" },
    { time: "08:30", action: "Cita programada", patient: "Ana López" }
  ];

  const tenantLogoUrl = getTenantLogoUrl();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Sidebar Navigation - Full Height */}
      <div className={`fixed left-0 top-0 bottom-0 bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 z-10 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        {/* Integrated Header */}
        <div className="h-14 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-slate-800"
            title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4 text-gray-600 dark:text-slate-400" />
            ) : (
              <PanelLeftClose className="h-4 w-4 text-gray-600 dark:text-slate-400" />
            )}
          </Button>
          {!sidebarCollapsed && <ThemeToggleButton />}
        </div>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-center">
          <div className={`flex items-center w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start gap-3'}`}>
            <Avatar className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
              <AvatarImage src={tenantLogoUrl} alt={currentTenant?.name} />
              <AvatarFallback className="bg-blue-600 dark:bg-blue-500 text-white">
                {currentTenant?.name?.charAt(0).toUpperCase() || 'H'}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <h1 
                  className="text-base font-semibold text-gray-900 dark:text-slate-100" // Removed truncate
                  title={currentTenant?.name || 'Hub Hospitalario'}
                >
                  {currentTenant?.name || 'Hub Hospitalario'}
                </h1>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">Hub Hospitalario</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${sidebarCollapsed ? 'p-2' : 'p-4'} overflow-y-auto`}>
          <div className="space-y-2">
            {!sidebarCollapsed && (
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                Principal
              </div>
            )}
            <button
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 text-sm font-medium text-gray-900 dark:text-slate-100 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors`}
              title={sidebarCollapsed ? 'Dashboard' : undefined}
            >
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              {!sidebarCollapsed && <span>Dashboard</span>}
            </button>

            {currentRole?.name?.toLowerCase() === 'super admin' && (
              <>
                {!sidebarCollapsed && (
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    Administración
                  </div>
                )}
                <button
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors`}
                  title={sidebarCollapsed ? 'Configuración' : undefined}
                >
                  <Settings className="h-4 w-4 text-gray-500 dark:text-slate-400 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Configuración</span>}
                </button>
              </>
            )}
          </div>
        </nav>

        {/* User Profile Dropdown - Fixed at bottom */}
        <div className="border-t border-gray-200 dark:border-slate-700">
          {user && <UserProfileDropdown user={user} collapsed={sidebarCollapsed} />}
        </div>
      </div>

      {/* Main Content */}
      <div className={`pt-14 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="max-w-6xl mx-auto px-8 py-12"
        >
        {/* Header - shadcn/ui Style */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold md:text-2xl text-gray-900 dark:text-slate-100">Dashboard</h1>
            {/* Se eliminó el bloque de texto del hospital y rol */}
          </div>
        </div>

        {/* Stats Cards - shadcn/ui Style */}
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={stat.title} x-chunk="dashboard-01-chunk-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Sales Table */}
        <Card x-chunk="dashboard-01-chunk-5">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>
              You made 265 sales this month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Invoice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">INV001</TableCell>
                  <TableCell>
                    <Badge variant="outline">Paid</Badge>
                  </TableCell>
                  <TableCell>Credit Card</TableCell>
                  <TableCell className="text-right">$250.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">INV002</TableCell>
                  <TableCell>
                    <Badge variant="outline">Pending</Badge>
                  </TableCell>
                  <TableCell>PayPal</TableCell>
                  <TableCell className="text-right">$150.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">INV003</TableCell>
                  <TableCell>
                    <Badge variant="outline">Unpaid</Badge>
                  </TableCell>
                  <TableCell>Bank Transfer</TableCell>
                  <TableCell className="text-right">$350.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">INV004</TableCell>
                  <TableCell>
                    <Badge variant="outline">Paid</Badge>
                  </TableCell>
                  <TableCell>Credit Card</TableCell>
                  <TableCell className="text-right">$450.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">INV005</TableCell>
                  <TableCell>
                    <Badge variant="outline">Paid</Badge>
                  </TableCell>
                  <TableCell>PayPal</TableCell>
                  <TableCell className="text-right">$550.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>


          {/* Dialog para usuario pendiente */}
          <PendingUserDialog
            open={showPendingDialog}
            onOpenChange={setShowPendingDialog}
            userEmail={user?.email}
          />

          {/* Session Warning Dialog */}
          <SessionWarningDialog
            isOpen={showWarning}
            timeRemaining={timeRemaining}
            onExtend={extendSession}
            onLogout={logout}
          />
        </motion.div>
      </div>
    </div>
  );
}