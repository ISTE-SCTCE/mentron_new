import { useContext,createContext,useState,useEffect,useRef,useCallback } from 'react';
import { supabase } from '../lib/supabase';
const AuthContext = createContext(null);
export function AuthProvider({children}) {
    const [user,setUser] = useState(null);
    const [profile,setProfile] = useState(null);
    const [isLoading,setLoading] = useState(true);
    const [error,setError] = useState(null);
    const request = useRef(0);
    const loadProfile = useCallback(async (authUser) => {
        const version = ++request.current;
        setUser(authUser); setProfile(null); setError(null); setLoading(true);
        try {
            if(!authUser) return;
            const {data,error} = await supabase.from('profiles').select('*').eq('id',authUser.id).single();
            if(error) throw error;
            if(version!==request.current) return;
            setProfile({...data,membership_id:data.iste_membership_id??'',validity_end:data.expiry_date??null});
        } catch(e) { if(version===request.current) setError('Could not load your account. Please try again.'); }
        finally { if(version===request.current) setLoading(false); }
    },[]);
    useEffect(() => {
        let mounted = true;
        supabase.auth.getUser().then(({data}) => { if(mounted) loadProfile(data.user??null); }).catch(() => { if(mounted) loadProfile(null); });
        const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,session) => {
            // Leave the Auth callback before making another Supabase request.
            setTimeout(() => { if(mounted) loadProfile(session?.user??null); },0);
        });
        return () => { mounted=false; ++request.current; subscription.unsubscribe(); };
    },[loadProfile]);
    const isSuspended = profile && (profile.status!=='active' || (profile.suspended_until && new Date(profile.suspended_until)>new Date()));
    const validityEnd = profile?.expiry_date ? new Date(profile.expiry_date) : null;
    const isIsteMember = profile?.is_iste_member===true;
    const value = {
        user,profile,isLoading,error,isSuspended,
        isAuthenticated:!!user && !!profile && !isSuspended,
        isMlynqUser:profile?.is_mlynq_user===true,isMentronUser:profile?.is_mentron_user===true,
        name:profile?.name??'',role:profile?.role??'member',membershipId:profile?.iste_membership_id??'',
        validityEnd,isIsteMember,isRegistered:profile?.is_registered===true,
        isMembershipValid:isIsteMember && (!validityEnd || validityEnd>=new Date()),
        daysUntilExpiry:validityEnd ? Math.ceil((validityEnd-new Date())/86400000) : null,
        refresh:() => loadProfile(user),
        signOut:async () => { ++request.current; await supabase.auth.signOut(); setUser(null); setProfile(null); }
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
    const value = useContext(AuthContext);
    if(!value) throw new Error('AuthProvider required');
    return value;
}
