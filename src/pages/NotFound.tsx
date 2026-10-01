import { useLocation, Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function NotFound() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center py-20 bg-background">
        <div className="text-center px-4">
          <div className="text-8xl mb-6">🍽️</div>
          <h1 className="text-5xl font-black text-secondary mb-4" style={{ fontFamily: 'Nunito' }}>404</h1>
          <h2 className="text-2xl font-bold text-foreground mb-3">Oops! Page Not Found</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            The page <code className="bg-muted px-2 py-1 rounded text-sm">{location.pathname}</code> doesn't exist. Maybe you were looking for our delicious menu?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="btn-primary px-8 py-3 inline-flex items-center justify-center gap-2">
              🏠 Go Home
            </Link>
            <Link to="/menu" className="btn-outline px-8 py-3 inline-flex items-center justify-center gap-2">
              🍽️ View Menu
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
