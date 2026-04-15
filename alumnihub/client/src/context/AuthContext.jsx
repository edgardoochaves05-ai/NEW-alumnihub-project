import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user);
      else setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(sessionUser) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sessionUser.id)
        .single();

      if (error) throw error;

      // If the profiles row exists but role is missing, fall back to user_metadata
      const role = data.role || sessionUser.user_metadata?.role || null;
      setProfile({ ...data, role });
    } catch (err) {
      // Profile row doesn't exist yet — create it from user_metadata, then set state
      const meta = sessionUser.user_metadata;
      const newProfile = {
        id: sessionUser.id,
        email: sessionUser.email,
        role: meta?.role || null,
        first_name: meta?.first_name || null,
        last_name: meta?.last_name || null,
      };
      // Persist to DB so the user shows up in directories immediately
      await supabase.from("profiles").upsert(
        { ...newProfile, is_active: true },
        { onConflict: "id" }
      );
      setProfile(newProfile);
    } finally {
      setLoading(false);
    }
  }

  const value = {
    user,
    profile,
    loading,
    isAlumni: profile?.role === "alumni",
    isFaculty: profile?.role === "faculty",
    isAdmin: profile?.role === "admin",
    refreshProfile: () => user && fetchProfile(user),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
