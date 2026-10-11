import { Navigate,useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SplashScreen from './SplashScreen';
export function ProtectedRoute({children}) {
    const {isAuthenticated,isMlynqUser,isLoading,error,user,refresh} = useAuth();
    const location = useLocation();
    if(isLoading) return <SplashScreen/>;
    if(error && user) return <div style={{padding:32}} role="alert">{error}<button onClick={refresh}>Retry</button></div>;
    if(!isAuthenticated) return <Navigate to="/login" state={{from:location}} replace/>;
    if(!isMlynqUser) return <div style={{padding:32}}><h1>Join Mlynq</h1><a href="/join?product=mlynq">Continue with your ISTE account</a></div>;
    return children;
}
export function PublicRoute({children}) {
    const {isAuthenticated,isMlynqUser,isLoading} = useAuth();
    if(isLoading) return <SplashScreen/>;
    if(isAuthenticated && isMlynqUser) return <Navigate to="/home" replace/>;
    return children;
}
