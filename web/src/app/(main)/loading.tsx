import { Loader2 } from "lucide-react";

export default function MainLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full text-gray-400">
      <Loader2 className="w-8 h-8 animate-spin text-primary/50 mb-4" />
      <p className="text-sm font-medium animate-pulse">Chargement...</p>
    </div>
  );
}
