import { createClient } from "@/utils/supabase/server";
import { ProfileForm } from "@/components/profile/ProfileForm"; // Formulaire de profil
import { redirect } from "next/navigation";

export default async function EditProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <h1 className="text-xl font-black text-black">Modifier le profil</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
          <ProfileForm profile={profile || { id: user.id }} />
        </div>
      </div>
    </div>
  );
}
