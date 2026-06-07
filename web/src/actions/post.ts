"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non autorisé" };
    }

    const caption = formData.get("caption") as string;
    const mediaFile = formData.get("mediaFile") as File;
    const gifUrl = formData.get("gifUrl") as string;

    let mediaUrl = gifUrl || null;

    if (mediaFile && mediaFile.size > 0) {
      const fileExt = mediaFile.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('posts_media')
        .upload(fileName, mediaFile);

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return { error: "Erreur lors de l'upload du média." };
      }
      
      const { data: { publicUrl } } = supabase.storage.from('posts_media').getPublicUrl(fileName);
      mediaUrl = publicUrl;
    }

    if (!caption && !mediaUrl) {
      return { error: "Le post ne peut pas être vide" };
    }

    const { error } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        type: mediaUrl ? 'IMAGE' : 'TEXT',
        caption: caption?.trim() || null,
        media_url: mediaUrl,
      });

    if (error) {
      console.error(error);
      return { error: "Erreur lors de la création du post" };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erreur serveur" };
  }
}
