import { useParams, useNavigate, Link } from "react-router"
import { useGetUserQuery, useBanUserMutation, useDeleteUserMutation } from "@/store/api/adminApi"
import { ArrowLeft, Ban, CheckCircle2, Trash2, Briefcase, Send, FileText } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function AdminUserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, isLoading, isError } = useGetUserQuery(id!)
  const [banUser, { isLoading: isBanning }] = useBanUserMutation()
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation()

  if (isLoading) {
    return <div className="text-muted-foreground p-6">Loading user details...</div>
  }

  if (isError || !data?.data) {
    return <div className="text-red-500 p-6">Failed to load user details. They might not exist.</div>
  }

  const user = data.data

  const handleBanToggle = async () => {
    try {
      const action = user.is_active ? "banned" : "unbanned"
      await banUser(user.id).unwrap()
      toast.success(`User successfully ${action}.`)
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to update user status.")
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this user? This action may be restricted if they have active contracts.")) return
    
    try {
      await deleteUser(user.id).unwrap()
      toast.success("User successfully deleted.")
      navigate("/admin/users")
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to delete user.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">User Profile</h1>
          <p className="text-muted-foreground">Detailed view and management.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 items-start">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Basic user information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4 w-full">
              <Avatar className="h-24 w-24 shrink-0">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">{user.full_name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="w-full min-w-0">
                <h3 className="font-bold text-xl truncate" title={user.full_name}>{user.full_name}</h3>
                <p className="text-sm text-muted-foreground truncate" title={user.email}>{user.email}</p>
                <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                  <Badge variant={user.role === 'admin' ? "destructive" : "secondary"} className="capitalize">
                    {user.role}
                  </Badge>
                  {user.is_active ? (
                    <Badge variant="outline" className="text-green-600 border-green-200">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600 border-red-200">Banned</Badge>
                  )}
                  {user.is_deleted && (
                    <Badge variant="destructive">Deleted</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <div>
                <p className="text-sm font-medium text-muted-foreground">User ID</p>
                <p className="text-sm font-mono break-all">{user.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Joined Date</p>
                <p className="text-sm">{format(new Date(user.created_at), 'PPP')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bio</p>
                <p className="text-sm">{user.bio || "No bio provided."}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t">
              <Button 
                variant={user.is_active ? "destructive" : "default"} 
                className="w-full"
                onClick={handleBanToggle}
                disabled={user.role === 'admin' || isBanning || user.is_deleted}
              >
                {user.is_active ? (
                  <><Ban className="mr-2 h-4 w-4" /> Ban User</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Unban User</>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
                disabled={user.role === 'admin' || isDeleting || user.is_deleted}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Soft Delete
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Platform Activity</CardTitle>
            <CardDescription>Aggregated statistics for this user</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-6 bg-gray-50 rounded-lg border flex flex-col items-center justify-center text-center space-y-2">
                <Briefcase className="h-8 w-8 text-blue-500" />
                <p className="text-3xl font-bold">{user.stats.total_jobs}</p>
                <p className="text-sm font-medium text-muted-foreground">Total Jobs Posted</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-lg border flex flex-col items-center justify-center text-center space-y-2">
                <Send className="h-8 w-8 text-indigo-500" />
                <p className="text-3xl font-bold">{user.stats.total_bids}</p>
                <p className="text-sm font-medium text-muted-foreground">Total Bids Placed</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-lg border flex flex-col items-center justify-center text-center space-y-2">
                <FileText className="h-8 w-8 text-green-500" />
                <p className="text-3xl font-bold">{user.stats.total_contracts}</p>
                <p className="text-sm font-medium text-muted-foreground">Total Contracts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
