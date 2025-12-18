"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  Edit,
  Shield,
  UserCheck,
  Search,
  Loader2,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

interface User {
  id: string;
  email: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
  };
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  user_roles: UserRole[];
}

interface UserRole {
  id: string;
  role_name: string;
  level: number;
  is_active: boolean;
  assigned_at: string;
}

interface Role {
  id: string;
  name: string;
  level: number;
  description: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/roles')
      ]);

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        // Ensure user_roles is an array to avoid map errors if API returns weird data
        const safeUsers = Array.isArray(usersData) ? usersData.map((u: any) => ({
          ...u,
          user_roles: u.user_roles || []
        })) : [];
        setUsers(safeUsers);
      } else {
        console.error("Failed to fetch users");
      }

      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      } else {
        console.error("Failed to fetch roles");
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_metadata?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_metadata?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (user: User) => {
    if (!user.email_confirmed_at) {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendiente</Badge>;
    }
    // Since we don't track last_sign_in_at reliably in PB yet, we can assume confirmed users are active enough
    // or just check if they have a role
    if (user.user_roles && user.user_roles.length > 0) {
      return <Badge variant="outline" className="text-green-600 border-green-600">Activo</Badge>;
    }
    return <Badge variant="outline" className="text-gray-600 border-gray-600">Registrado</Badge>;
  };

  const getRoleBadge = (role: UserRole) => {
    const colors = {
      1: "bg-red-100 text-red-800",
      2: "bg-orange-100 text-orange-800",
      3: "bg-blue-100 text-blue-800",
      4: "bg-green-100 text-green-800",
      5: "bg-purple-100 text-purple-800"
    };

    // Fallback if level is missing or non-standard
    const bgClass = (role.level && colors[role.level as keyof typeof colors]) || "bg-gray-100 text-gray-800";

    return (
      <Badge className={bgClass}>
        {role.role_name}
      </Badge>
    );
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      const response = await fetch('/api/admin/users/assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          roleId: selectedRole
        })
      });

      if (response.ok) {
        setShowAssignDialog(false);
        setSelectedRole("");
        // Reload data to show new role
        loadData();
      } else {
        console.error("Failed to assign role");
      }
    } catch (error) {
      console.error("Error assigning role:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando usuarios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administración de Usuarios</h1>
          <p className="text-gray-600 mt-2">
            Gestiona usuarios del sistema y asigna roles de acceso
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-gray-600">Total Usuarios</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {users.filter(u => u.email_confirmed_at).length}
                </p>
                <p className="text-sm text-gray-600">Confirmados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {users.filter(u => u.user_roles?.length > 0).length}
                </p>
                <p className="text-sm text-gray-600">Con Roles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {users.filter(u => !u.email_confirmed_at).length}
                </p>
                <p className="text-sm text-gray-600">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center space-x-4"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Último Acceso</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {users.length === 0 ? "No hay usuarios registrados" : "No se encontraron usuarios"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.user_roles?.length > 0 ? (
                            user.user_roles.map((role) => (
                              <span key={role.id}>
                                {getRoleBadge(role)}
                              </span>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              Sin rol
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {user.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleDateString()
                          : "Nunca"
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Shield className="h-4 w-4 mr-1" />
                                Rol
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Asignar Rol</DialogTitle>
                                <DialogDescription>
                                  Selecciona el rol para {selectedUser?.email}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar rol" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {roles.map((role) => (
                                      <SelectItem key={role.id} value={role.id}>
                                        <div className="flex items-center gap-2">
                                          {getRoleBadge({ level: role.level, role_name: role.name, is_active: true, id: role.id, assigned_at: "" })}
                                          <span className="text-sm text-gray-600">{role.description}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={handleAssignRole} disabled={!selectedRole}>
                                    Asignar Rol
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}