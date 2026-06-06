// cspell:disable
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non autorisé" };
    }

    const username = formData.get("username") as string;
    const country = formData.get("country") as string;
    const bio = formData.get("bio") as string;
    
    let avatarUrl = undefined;
    const avatarFile = formData.get("avatarFile") as File;

    if (avatarFile && avatarFile.size > 0) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile);

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return { error: "Erreur lors de l'upload de l'avatar." };
      }
      
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      avatarUrl = publicUrl;
    }

    let coverUrl = undefined;
    const coverFile = formData.get("coverFile") as File;

    if (coverFile && coverFile.size > 0) {
      const fileExt = coverFile.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(fileName, coverFile);

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return { error: "Erreur lors de l'upload de la couverture." };
      }
      
      const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName);
      coverUrl = publicUrl;
    }

    const updates: Record<string, string | null> = {
      username: username?.trim() || "Anonyme",
      country: country?.trim() || null,
      bio: bio?.trim() || null,
    };

    if (avatarUrl) {
      updates.avatar = avatarUrl;
    }
    
    if (coverUrl) {
      updates.cover_url = coverUrl;
    }

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      console.error(error);
      return { error: "Erreur lors de la mise à jour du profil" };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erreur serveur" };
  }
}
