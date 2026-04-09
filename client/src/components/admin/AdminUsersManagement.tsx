import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Plus, User, Edit, Trash2 } from "lucide-react";
import { insertAdminUserSchema, type InsertAdminUser, type AdminUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface AdminUsersManagementProps {
    adminUsers: Omit<AdminUser, 'password'>[];
}

export function AdminUsersManagement({ adminUsers }: AdminUsersManagementProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [editingUser, setEditingUser] = useState<Omit<AdminUser, 'password'> | null>(null);
    const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

    const createUserForm = useForm<InsertAdminUser>({
        resolver: zodResolver(insertAdminUserSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            isActive: true,
        },
    });

    const editUserForm = useForm<Partial<InsertAdminUser>>({
        resolver: zodResolver(insertAdminUserSchema.partial()),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            isActive: true,
        },
    });

    const createUserMutation = useMutation({
        mutationFn: async (data: InsertAdminUser) => {
            const response = await fetch("/api/admin/users", {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Erro ao criar usuário");
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            queryClient.invalidateQueries({ queryKey: ["/api/audit-logs"] });
            toast({ title: "Usuário criado com sucesso", description: "O novo usuário administrador foi criado." });
            setIsCreating(false);
            createUserForm.reset();
        },
        onError: (error: any) => {
            toast({ title: "Erro ao criar usuário", description: error.message, variant: "destructive" });
        },
    });

    const updateUserMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<InsertAdminUser> }) => {
            const response = await fetch(`/api/admin/users/${id}`, {
                method: "PATCH",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Erro ao atualizar usuário");
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            queryClient.invalidateQueries({ queryKey: ["/api/audit-logs"] });
            toast({ title: "Usuário atualizado com sucesso", description: "Os dados do usuário foram atualizados." });
            setEditingUser(null);
            editUserForm.reset();
        },
        onError: (error: any) => {
            toast({ title: "Erro ao atualizar usuário", description: error.message, variant: "destructive" });
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Erro ao deletar usuário");
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            queryClient.invalidateQueries({ queryKey: ["/api/audit-logs"] });
            toast({ title: "Usuário removido com sucesso", description: "O usuário administrador foi removido do sistema." });
            setDeleteUserId(null);
        },
        onError: (error: any) => {
            toast({ title: "Erro ao remover usuário", description: error.message, variant: "destructive" });
        },
    });

    const onCreateUser = (data: InsertAdminUser) => createUserMutation.mutate(data);
    const onUpdateUser = (data: Partial<InsertAdminUser>) => editingUser && updateUserMutation.mutate({ id: editingUser.id, data });

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Gerenciar Usuários Administradores</CardTitle>
                    <Button onClick={() => setIsCreating(true)} data-testid="button-create-admin-user">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Usuário
                    </Button>
                </CardHeader>
                <CardContent>
                    {!adminUsers || adminUsers.length === 0 ? (
                        <div className="text-center py-12">
                            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Nenhum usuário administrador cadastrado</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {adminUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-4 rounded-md border hover-elevate">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium" data-testid={`text-user-name-${user.id}`}>{user.name}</p>
                                                <p className="text-sm text-muted-foreground" data-testid={`text-user-email-${user.id}`}>{user.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={user.isActive ? "default" : "secondary"} data-testid={`badge-user-status-${user.id}`}>
                                            {user.isActive ? "Ativo" : "Inativo"}
                                        </Badge>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() => {
                                                setEditingUser(user);
                                                editUserForm.reset({ name: user.name, email: user.email, isActive: user.isActive });
                                            }}
                                            data-testid={`button-edit-user-${user.id}`}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="outline" onClick={() => setDeleteUserId(user.id)} data-testid={`button-delete-user-${user.id}`}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create User Dialog */}
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Novo Usuário Administrador</DialogTitle>
                    </DialogHeader>
                    <Form {...createUserForm}>
                        <form onSubmit={createUserForm.handleSubmit(onCreateUser)} className="space-y-4">
                            <FormField
                                control={createUserForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome</FormLabel>
                                        <FormControl><Input {...field} placeholder="Nome completo" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={createUserForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl><Input {...field} type="email" placeholder="email@exemplo.com" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={createUserForm.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Senha</FormLabel>
                                        <FormControl><Input {...field} type="password" placeholder="Mínimo 6 caracteres" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={createUserForm.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel>Usuário Ativo</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
                                <Button type="submit" disabled={createUserMutation.isPending}>
                                    {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Usuário Administrador</DialogTitle>
                    </DialogHeader>
                    <Form {...editUserForm}>
                        <form onSubmit={editUserForm.handleSubmit(onUpdateUser)} className="space-y-4">
                            <FormField
                                control={editUserForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome</FormLabel>
                                        <FormControl><Input {...field} placeholder="Nome completo" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editUserForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl><Input {...field} type="email" placeholder="email@exemplo.com" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
                                <Button type="submit" disabled={updateUserMutation.isPending}>
                                    {updateUserMutation.isPending ? "Atualizando..." : "Atualizar Usuário"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteUserId && deleteUserMutation.mutate(deleteUserId)} className="bg-destructive text-destructive-foreground">
                            Sim, remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
