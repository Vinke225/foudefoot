"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { createPost } from "@/actions/social";

export function CreatePostModal({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsLoading(true);
    setError(null);

    const res = await createPost(content);
    if (res?.error) {
      setError(res.error);
    } else {
      setContent("");
      setOpen(false);
    }
    
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button className="w-full rounded-2xl h-13 bg-primary hover:bg-primary/90 text-white font-bold text-[15px] shadow-[0_4px_14px_rgba(30,143,69,0.3)] flex gap-2">
            <Plus className="w-5 h-5" />
            Créer un post
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-125 p-0 overflow-hidden bg-white rounded-3xl border-0 shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-gray-100">
          <DialogTitle className="text-xl font-black text-black">Créer un post</DialogTitle>
        </DialogHeader>
        
        <div className="p-6">
          <Textarea 
            placeholder="Que voulez-vous partager à propos du foot aujourd'hui ?"
            className="min-h-37.5 text-base resize-none border-0 shadow-none focus-visible:ring-0 p-0 text-gray-800 placeholder:text-gray-400 font-medium"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isLoading}
          />
          {error && <p className="text-red-500 text-sm mt-2 font-semibold">{error}</p>}
        </div>
        
        <DialogFooter className="px-6 py-4 border-t border-gray-50 bg-gray-50/50 flex justify-between items-center sm:justify-between">
          <p className="text-xs text-gray-400 font-medium">{content.length} caractères</p>
          <Button 
            onClick={handleSubmit} 
            disabled={!content.trim() || isLoading}
            className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 h-11 font-bold shadow-[0_4px_14px_rgba(30,143,69,0.3)]"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Publier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
