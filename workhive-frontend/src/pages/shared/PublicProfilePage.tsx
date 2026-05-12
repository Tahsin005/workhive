import { useParams, Link } from "react-router"
import { format } from "date-fns"
import { 
  Loader2, 
  Calendar, 
  Star, 
  MessageSquare,
  ShieldCheck,
  Briefcase,
  AlertCircle
} from "lucide-react"

import { useGetUserProfileQuery } from "@/store/api/authApi"
import { useGetUserReviewsQuery } from "@/store/api/reviewsApi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function PublicProfilePage() {
  const { id } = useParams()
  
  const { data: userData, isLoading: isLoadingUser, isError: isUserError } = useGetUserProfileQuery(id!)
  const { data: reviewsData, isLoading: isLoadingReviews } = useGetUserReviewsQuery({ userId: id! })

  const user = userData?.data
  const reviewStats = reviewsData?.data?.stats
  const reviews = reviewsData?.data?.reviews || []

  if (isLoadingUser) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isUserError || !user) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">User Not Found</h2>
        <p className="text-muted-foreground text-center max-w-xs">
          The user profile you are looking for does not exist or has been removed.
        </p>
        <Button asChild variant="outline">
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Card className="overflow-hidden border-none shadow-lg bg-white">
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
        <CardContent className="relative pt-0 px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-12">
            <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
              <AvatarImage src={user.avatar_url || ""} alt={user.full_name} />
              <AvatarFallback className="text-4xl bg-gray-100 text-primary">
                {user.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2 mb-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{user.full_name}</h1>
                {user.role === 'admin' && (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                    <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Staff
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  <span className="capitalize">{user.role}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {format(new Date(user.created_at), 'MMMM yyyy')}
                </span>
                {reviewStats && reviewStats.total_reviews > 0 && (
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    {reviewStats.average_rating.toFixed(1)} ({reviewStats.total_reviews} reviews)
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 mb-2">
              <Button>
                <MessageSquare className="mr-2 h-4 w-4" />
                Contact
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed italic">
                {user.bio || `${user.full_name} hasn't added a bio yet.`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Identity</span>
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Verified
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Verified
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Verified
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Client Reviews</CardTitle>
                <CardDescription>What others say about {user.full_name}</CardDescription>
              </div>
              {reviewStats && (
                <div className="text-right">
                  <div className="flex items-center gap-1 text-2xl font-bold">
                    <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
                    {reviewStats.average_rating.toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground">{reviewStats.total_reviews} total reviews</p>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingReviews ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                  <p className="text-muted-foreground">No reviews yet for this user.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={review.reviewer.avatar_url || ""} />
                            <AvatarFallback>{review.reviewer.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">{review.reviewer.full_name}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(review.created_at), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < review.rating ? 'fill-amber-500 text-amber-500' : 'text-gray-200'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {review.comment}
                      </p>
                      <Separator className="pt-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
