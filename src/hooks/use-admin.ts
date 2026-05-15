import { useAuth } from "@/contexts/AuthContext";

const ADMIN_EMAILS = ["gamalielkelman@gmail.com", "pennsunjo@gmail.com"];

export function useAdmin() {
  const { user } = useAuth();
  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false;
  return { isAdmin };
}
