import { useState } from "react"
import { useGetUsersQuery, useBanUserMutation, useDeleteUserMutation } from "@/store/api/adminApi"
import { Link } from "react-router"
import { Search, Eye, Ban, Trash2, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ConfirmDialog"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<string>("all")
  const [isActive, setIsActive] = useState<string>("all")

  // Query Hook
  const { data, isLoading, isFetching } = useGetUsersQuery({
    page,
    limit,
    search: search || undefined,
    role: role !== "all" ? role : undefined,
    is_active: isActive !== "all" ? isActive : undefined,
  })

  // Mutation Hooks
  const [banUser, { isLoading: isBanning }] = useBanUserMutation()
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation()

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    userId: string
  }>({
    isOpen: false,
    userId: "",
  })

  const handleBanToggle = async (id: string, currentlyActive: boolean) => {
    try {
      const action = currentlyActive ? "banned" : "unbanned"
      await banUser(id).unwrap()
      toast.success(`User successfully ${action}.`)
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to update user status.")
    }
  }

  const handleDelete = async (id: string) => {
    setConfirmConfig({ isOpen: true, userId: id })
  }

  const handleConfirmDelete = async () => {
    const id = confirmConfig.userId
    try {
      await deleteUser(id).unwrap()
      toast.success("User successfully deleted.")
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to delete user.")
    }
    setConfirmConfig({ isOpen: false, userId: "" })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1) // Reset to first page on search
  }

  const users = data?.data || []
  const meta = data?.meta

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Users</h1>
          <p className="text-muted-foreground">Manage all users on the platform.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-8"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        
        <Select value={role} onValueChange={(v) => { setRole(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="freelancer">Freelancer</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        <Select value={isActive} onValueChange={(v) => { setIsActive(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isFetching ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} className={u.is_deleted ? "opacity-50" : ""}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{u.full_name}</span>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                      {u.is_deleted && <span className="text-xs text-red-500 font-bold">(Deleted)</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? "destructive" : "secondary"} className="capitalize">
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.is_active ? (
                      <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">
                        Banned
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(u.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild title="View Details">
                        <Link to={`/admin/users/${u.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleBanToggle(u.id, u.is_active)}
                        disabled={u.role === 'admin' || isBanning || u.is_deleted}
                        title={u.is_active ? "Ban User" : "Unban User"}
                      >
                        {u.is_active ? <Ban className="h-4 w-4 text-red-500" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(u.id)}
                        disabled={u.role === 'admin' || isDeleting || u.is_deleted}
                        className="hover:text-red-600 hover:bg-red-50"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.total_pages > 1 && (
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            disabled={page >= meta.total_pages} 
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, userId: "" })}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        description="Are you sure you want to delete this user? This action may be restricted if they have active contracts."
        variant="destructive"
        confirmText="Delete User"
      />
    </div>
  )
}
