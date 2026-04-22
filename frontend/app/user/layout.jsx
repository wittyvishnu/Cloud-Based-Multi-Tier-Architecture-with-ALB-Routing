import ProtectedRoute from '@/components/ProtectedRoute'
import UserHeader from '@/components/UserHeader'

export default function UserLayout({ children }) {
  return (
    <ProtectedRoute>
      <UserHeader />
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </ProtectedRoute>
  )
}
