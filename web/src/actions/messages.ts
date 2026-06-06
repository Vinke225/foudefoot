// cspell:disable
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function startConversation(targetUserId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non autorisé" };
    }

    if (user.id === targetUserId) {
      return { error: "Vous ne pouvez pas discuter avec vous-même" };
    }

    // Check if conversation already exists
    const { data: existingConvo, error: searchError } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${user.id})`)
      .maybeSingle();

    if (searchError) {
      console.error(searchError);
      return { error: "Erreur lors de la recherche de la conversation" };
    }

    if (existingConvo) {
      return { success: true, conversationId: existingConvo.id };
    }

    // Create new conversation
    // Order user IDs to maintain consistency if needed, but the UNIQUE constraint handles order anyway
    const user1_id = user.id < targetUserId ? user.id : targetUserId;
    const user2_id = user.id < targetUserId ? targetUserId : user.id;

    const { data: newConvo, error: insertError } = await supabase
      .from('conversations')
      .insert({
        user1_id,
        user2_id
      })
      .select('id')
      .single();

    if (insertError) {
      console.error(insertError);
      return { error: "Erreur lors de la création de la conversation" };
    }

    return { success: true, conversationId: newConvo.id };

  } catch (error) {
    console.error(error);
    return { error: "Erreur serveur" };
  }
}
