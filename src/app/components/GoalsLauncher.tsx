import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { Target, X } from "lucide-react";

import { auth, db } from "@/firebase";
import { SpecialGoals } from "@/app/components/SpecialGoals";
import { Button } from "@/app/components/ui/button";
import type { User, UserProgress } from "@/app/types";

const EMPTY_PROGRESS: UserProgress = {
  xp: 0,
  points: 0,
  streak: 0,
  bonusAwardedOn: "",
  scanStreak: 0,
  lastScanDate: ""
};

export function GoalsLauncher() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [progress, setProgress] =
    useState<UserProgress>(EMPTY_PROGRESS);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    let unsubscribeProfile = () => {};
    let unsubscribeProgress = () => {};

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        unsubscribeProfile();
        unsubscribeProgress();

        if (!firebaseUser) {
          setCurrentUser(null);
          setProgress(EMPTY_PROGRESS);
          setOpen(false);
          return;
        }

        unsubscribeProfile = onSnapshot(
          doc(db, "users", firebaseUser.uid),
          (snapshot) => {
            if (!snapshot.exists()) {
              setCurrentUser(null);
              return;
            }

            const data = snapshot.data();

            const role =
              data.role === "admin"
                ? "admin"
                : "user";

            setCurrentUser({
              id: firebaseUser.uid,

              name:
                typeof data.name === "string"
                  ? data.name
                  : "Usuario",

              username:
                firebaseUser.email ?? "",

              pin: "",

              role,

              avatar:
                typeof data.avatar === "string"
                  ? data.avatar
                  : ""
            });
          }
        );

        unsubscribeProgress = onSnapshot(
          doc(
            db,
            "userProgress",
            firebaseUser.uid
          ),
          (snapshot) => {
            if (!snapshot.exists()) {
              setProgress(EMPTY_PROGRESS);
              return;
            }

            setProgress({
              ...EMPTY_PROGRESS,
              ...(snapshot.data() as UserProgress)
            });
          }
        );
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
      unsubscribeProgress();
    };
  }, []);

  if (!currentUser) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-4 z-[90] flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 font-bold text-white shadow-xl transition active:scale-95"
      >
        <Target className="h-5 w-5" />

        <span className="text-sm">
          Metas
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[180] overflow-y-auto bg-[#E2DADB]">
          <div className="mx-auto min-h-screen max-w-md bg-[#E2DADB] shadow-2xl">
            <div className="sticky top-0 z-20 bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-5 text-white shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                    ScanGame
                  </p>

                  <h1 className="text-2xl font-bold">
                    Metas especiales
                  </h1>
                </div>

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="px-5 py-6 pb-28">
              <SpecialGoals
                currentUser={currentUser}
                progress={progress}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
