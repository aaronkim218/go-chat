import supabase from "@/utils/supabase";
import { toast } from "sonner";

const useLogout = () => {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error?.message) {
      toast.error(error.message);
    }
  };

  return { handleLogout };
};

export default useLogout;
