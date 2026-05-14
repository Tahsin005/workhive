import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import {
  Camera,
  Loader2,
  Lock,
  Mail,
  UserCircle,
  Save,
  ShieldCheck
} from 'lucide-react'

import {
  useMeQuery,
  useUpdateProfileMutation,
  useUpdateAvatarMutation,
  useChangePasswordMutation
} from '@/store/api/authApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(6, 'New password must be at least 6 characters'),
  confirm_password: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

type ProfileFormValues = z.infer<typeof profileSchema>
type PasswordFormValues = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const { data: meData, isLoading: isLoadingUser } = useMeQuery()
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation()
  const [updateAvatar, { isLoading: isUpdatingAvatar }] = useUpdateAvatarMutation()
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const user = meData?.data

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: { full_name: user?.full_name || '', bio: user?.bio || '' },
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) })

  const onUpdateProfile = async (values: ProfileFormValues) => {
    try {
      await updateProfile(values).unwrap()
      toast.success('Profile updated successfully')
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to update profile')
    }
  }

  const onUpdateAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('avatar', file)
    try {
      await updateAvatar(formData).unwrap()
      toast.success('Avatar updated successfully')
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to update avatar')
    }
  }

  const onChangePassword = async (values: PasswordFormValues) => {
    try {
      await changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      }).unwrap()
      toast.success('Password changed successfully')
      resetPassword()
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to change password')
    }
  }

  if (isLoadingUser) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your profile and security preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        <div className="flex flex-col gap-4">

          <Card className="border shadow-none">
            <CardContent className="pt-6 pb-4 flex flex-col items-center text-center gap-1">
              <div
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Avatar className="h-[88px] w-[88px] ring-2 ring-primary/10 transition-all group-hover:ring-primary/30">
                  <AvatarImage src={user?.avatar_url || undefined} alt={user?.full_name} />
                  <AvatarFallback className="text-2xl bg-primary/5 text-primary font-bold">
                    {user?.full_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUpdatingAvatar
                    ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                    : <Camera className="h-5 w-5 text-white" />
                  }
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={onUpdateAvatar}
                />
              </div>

              <p className="mt-3 font-semibold text-base leading-tight">{user?.full_name}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[160px]">{user?.email}</span>
              </div>
              <Badge variant="secondary" className="capitalize mt-2 text-xs">{user?.role}</Badge>
            </CardContent>

            <Separator />

            <CardFooter className="py-3 justify-center">
              <p className="text-xs text-muted-foreground">
                Joined {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })
                  : 'N/A'}
              </p>
            </CardFooter>
          </Card>

          <Card className="border shadow-none bg-indigo-50/40">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Security Status
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Account Verified</span>
                <span className="font-semibold text-green-600 text-xs">✓ Yes</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Two-Factor Auth</span>
                <span className="font-semibold text-amber-500 text-xs">Off</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-5">

          <Card className="border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-primary" />
                Public Profile
              </CardTitle>
              <CardDescription className="text-xs">
                This information will be displayed to other users.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form id="profile-form" onSubmit={handleSubmitProfile(onUpdateProfile)}>
                <FieldGroup className="space-y-4">
                  <Field>
                    <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
                    <Input
                      {...registerProfile('full_name')}
                      id="full_name"
                      placeholder="Your Name"
                    />
                    <FieldError>{profileErrors.full_name?.message}</FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="bio">Bio</FieldLabel>
                    <Textarea
                      {...registerProfile('bio')}
                      id="bio"
                      placeholder="Tell us about yourself..."
                      className="min-h-[100px] resize-none"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">Maximum 500 characters.</p>
                    <FieldError>{profileErrors.bio?.message}</FieldError>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>

            <CardFooter className="border-t pt-4 bg-muted/20">
              <Button
                type="submit"
                form="profile-form"
                disabled={isUpdatingProfile}
                size="sm"
                className="ml-auto gap-1.5"
              >
                {isUpdatingProfile
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Save className="h-3.5 w-3.5" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>

          <Card className="border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500" />
                Change Password
              </CardTitle>
              <CardDescription className="text-xs">
                Ensure your account is using a long, random password.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form id="password-form" onSubmit={handleSubmitPassword(onChangePassword)}>
                <FieldGroup className="space-y-4">
                  <Field>
                    <FieldLabel htmlFor="current_password">Current Password</FieldLabel>
                    <Input
                      {...registerPassword('current_password')}
                      id="current_password"
                      type="password"
                      autoComplete="current-password"
                    />
                    <FieldError>{passwordErrors.current_password?.message}</FieldError>
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="new_password">New Password</FieldLabel>
                      <Input
                        {...registerPassword('new_password')}
                        id="new_password"
                        type="password"
                        autoComplete="new-password"
                      />
                      <FieldError>{passwordErrors.new_password?.message}</FieldError>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="confirm_password">Confirm Password</FieldLabel>
                      <Input
                        {...registerPassword('confirm_password')}
                        id="confirm_password"
                        type="password"
                        autoComplete="new-password"
                      />
                      <FieldError>{passwordErrors.confirm_password?.message}</FieldError>
                    </Field>
                  </div>
                </FieldGroup>
              </form>
            </CardContent>

            <CardFooter className="border-t pt-4 bg-muted/20">
              <Button
                type="submit"
                form="password-form"
                variant="outline"
                size="sm"
                disabled={isChangingPassword}
                className="ml-auto gap-1.5"
              >
                {isChangingPassword && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Update Password
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}