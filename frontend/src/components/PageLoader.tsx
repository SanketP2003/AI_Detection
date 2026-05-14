import { Shield } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-neutral-950 z-[100]">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-24 h-24 border-2 border-neutral-200 dark:border-neutral-800 rounded-full animate-pulse" />
        <div className="w-16 h-16 bg-neutral-900 dark:bg-white rounded-full flex items-center justify-center animate-pulse">
          <Shield className="w-6 h-6 text-white dark:text-neutral-900" />
        </div>
      </div>
    </div>
  );
}
