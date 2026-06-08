// cspell:disable
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPost(content: string) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: "Vous devez être connecté pour publier un post." };
    }

    if (!content || content.trim() === "") {
      return { error: "Le contenu du post ne peut pas être vide." };
    }

    // Insérer le post
    const { error } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        caption: content.trim(),
        type: "text",
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error("Erreur insertion post:", error);
      return { error: "Impossible de publier le post." };
    }

    revalidatePath("/");
    return { success: true };

  } catch (error: unknown) {
    console.error("Exception createPost:", error);
    return { error: "Une erreur inattendue est survenue." };
  }
}

export async function getFeedPosts() {
  const supabase = await createClient();
  
  // Joindre avec la table users pour avoir le pseudo et l'avatar
  // Supabase postgREST permet les jointures si la FK est bien configurée
  // La migration de BDD indique que user_id references public.users(id)
  const { data, error } = await supabase
    .from("posts")
    .select(`
      id,
      caption,
      created_at,
      type,
      user_id,
      users (
        username,
        avatar,
        country
      ),
      comments (count),
      likes (count)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Erreur récupération feed:", error);
    return [];
  }

  return data || [];
}

export async function toggleLikePost(postId: string, reactionType: string = 'like') {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { error: "Non connecté" };

    // Vérifier si déjà liké
    const { data: existingLike } = await supabase
      .from("likes")
      .select("id, reaction_type")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single();

    if (existingLike) {
      if (existingLike.reaction_type === reactionType) {
        // Retirer le like si c'est le même type
        await supabase.from("likes").delete().eq("id", existingLike.id);
      } else {
        // Mettre à jour le type de réaction
        await supabase.from("likes").update({ reaction_type: reactionType }).eq("id", existingLike.id);
      }
    } else {
      // Ajouter le like
      await supabase.from("likes").insert({
        post_id: postId,
        user_id: user.id,
        reaction_type: reactionType
      });
      
      // Ajouter une notification au créateur du post
      const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).single();
      if (post && post.user_id !== user.id) {
         const { data: me } = await supabase.from("users").select("username").eq("id", user.id).single();
         await supabase.from("notifications").insert({
           user_id: post.user_id,
           type: "like",
           content: `${me?.username || "Quelqu'un"} a réagi à votre post.`
         });
      }
    }

    revalidatePath("/");
    return { success: true };

  } catch (error) {
    console.error(error);
    return { error: "Erreur toggle like" };
  }
}

export async function addComment(postId: string, content: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { error: "Non connecté" };

    if (!content || content.trim() === "") {
      return { error: "Le commentaire ne peut pas être vide." };
    }

    // Insérer le commentaire
    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      content: content.trim()
    });

    if (error) {
      console.error("DB Error in addComment:", error);
      return { error: `Erreur DB: ${error.message}` };
    }

    // Ajouter une notification au créateur du post
    const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).single();
    if (post && post.user_id !== user.id) {
       const { data: me } = await supabase.from("users").select("username").eq("id", user.id).single();
       await supabase.from("notifications").insert({
         user_id: post.user_id,
         type: "comment",
         content: `${me?.username || "Quelqu'un"} a commenté votre post.`
       });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erreur inattendue" };
  }
}

export async function toggleFollow(targetUserId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non autorisé" };
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .single();

    if (existingFollow) {
      // Unfollow
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) {
        console.error("Error unfollowing:", error);
        return { error: "Erreur lors du désabonnement" };
      }
    } else {
      // Follow
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId
        });

      if (error) {
        console.error("Error following:", error);
        return { error: "Erreur lors de l'abonnement" };
      }
      
      // Create notification
      const { data: me } = await supabase.from('users').select('username').eq('id', user.id).single();
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        type: 'follow',
        content: `${me?.username || "Quelqu'un"} a commencé à vous suivre`,
        link: `/profil/${user.id}`
      });
    }

    revalidatePath(`/profil/${targetUserId}`);
    return { success: true, isFollowing: !existingFollow };
  } catch (error) {
    console.error(error);
    return { error: "Erreur inattendue" };
  }
}

export async function deletePost(postId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Non connecté" };

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id);

    if (error) {
      console.error("Error deleting post:", error);
      return { error: "Erreur lors de la suppression" };
    }

    revalidatePath("/");
    revalidatePath(`/profil/${user.id}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erreur inattendue" };
  }
}

export async function editPost(postId: string, content: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Non connecté" };
    if (!content || content.trim() === "") return { error: "Contenu vide" };

    const { error } = await supabase
      .from('posts')
      .update({ caption: content.trim() })
      .eq('id', postId)
      .eq('user_id', user.id);

    if (error) {
      console.error("Error editing post:", error);
      return { error: "Erreur lors de la modification" };
    }

    revalidatePath("/");
    revalidatePath(`/profil/${user.id}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erreur inattendue" };
  }
}
