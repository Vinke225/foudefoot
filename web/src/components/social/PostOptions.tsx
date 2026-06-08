"use client";

import { useState } from "react";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { deletePost, editPost } from "@/actions/social";

export function PostOptions({ post, currentUserId }: { post: { id: string, caption: string, user_id: string }, currentUserId?: string }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState(post.caption || "");
  const [isPending, setIsPending] = useState(false);

  // Si l'utilisateur n'est pas le créateur du post, on n'affiche rien (ou le bouton statique d'origine)
  if (currentUserId !== post.user_id) {
    return (
      <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-50 h-8 w-8 cursor-default shrink-0">
        <MoreHorizontal className="w-5 h-5" />
      </Button>
    );
  }

  const handleDelete = async () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce post ?")) {
      const res = await deletePost(post.id);
      if (res && res.error) {
        alert(res.error);
      }
    }
    setShowMenu(false);
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    setIsPending(true);
    const res = await editPost(post.id, editContent);
    if (!res.error) {
      setShowEditModal(false);
    } else {
      alert(res.error);
    }
    setIsPending(false);
  };

  return (
    <div className="relative shrink-0">
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-gray-400 hover:bg-gray-50 h-8 w-8"
        onClick={() => setShowMenu(!showMenu)}
      >
        <MoreHorizontal className="w-5 h-5" />
      </Button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-1 z-50 animate-in fade-in zoom-in duration-200">
            <button 
              className="w-full text-left px-3 py-2.5 hover:bg-gray-50 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              onClick={() => {
                setShowMenu(false);
                setEditContent(post.caption || "");
                setShowEditModal(true);
              }}
            >
              <Pencil className="w-4 h-4 text-gray-500" />
              Modifier
            </button>
            <button 
              className="w-full text-left px-3 py-2.5 hover:bg-red-50 text-red-600 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors mt-0.5"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </>
      )}

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la publication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Que voulez-vous dire ?"
              className="min-h-30 resize-none text-[15px] focus-visible:ring-primary/20"
              disabled={isPending}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={isPending}>
                Annuler
              </Button>
              <Button onClick={handleEdit} disabled={isPending || !editContent.trim()} className="bg-primary hover:bg-primary/90 text-white">
                {isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
