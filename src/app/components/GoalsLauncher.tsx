import {
  useEffect,
  useState
} from "react";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  collection,
  doc,
  onSnapshot,
  query,
  where
} from "firebase/firestore";

import {
  Target,
  X
} from "lucide-react";

import {
  auth,
  db
} from "@/firebase";

import {
  SpecialGoals
} from "@/app/components/SpecialGoals";

import {
  Button
} from "@/app/components/ui/button";

import type {
  User,
  UserProgress
} from "@/app/types";


const EMPTY_PROGRESS: UserProgress = {
  xp: 0,
  points: 0,
  streak: 0,
  bonusAwardedOn: "",
  scanStreak: 0,
  lastScanDate: ""
};


interface GoalSummary {
  id: string;
  name: string;
  targetPoints: number;
  emoji?: string;
  active: boolean;
}

interface GoalProgressSummary {
  goalId: string;
  userId: string;
  savedPoints: number;
}


export function GoalsLauncher() {
  const [
    currentUser,
    setCurrentUser
  ] =
    useState<User | null>(
      null
    );

  const [
    progress,
    setProgress
  ] =
    useState<UserProgress>(
      EMPTY_PROGRESS
    );

  const [
    open,
    setOpen
  ] =
    useState(false);

  const [
    goals,
    setGoals
  ] =
    useState<
      GoalSummary[]
    >([]);

  const [
    goalProgress,
    setGoalProgress
  ] =
    useState<
      GoalProgressSummary[]
    >([]);


  useEffect(() => {
    let unsubscribeProfile =
      () => {};

    let unsubscribeProgress =
      () => {};

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        (
          firebaseUser
        ) => {
          unsubscribeProfile();
          unsubscribeProgress();

          if (
            !firebaseUser
          ) {
            setCurrentUser(
              null
            );

            setProgress(
              EMPTY_PROGRESS
            );

            setOpen(
              false
            );

            return;
          }

          const email =
            firebaseUser.email
              ?.trim()
              .toLowerCase() ??
            "";

          const isAdmin =
            email ===
            "onialeixoo@gmail.com";

          setCurrentUser({
            id:
              firebaseUser.uid,

            name:
              isAdmin
                ? "Ona"
                : "Marti",

            username:
              isAdmin
                ? "ona"
                : "marti",

            pin: "",

            role:
              isAdmin
                ? "admin"
                : "user",

            avatar: ""
          });


          unsubscribeProfile =
            onSnapshot(
              doc(
                db,
                "users",
                firebaseUser.uid
              ),
              (
                snapshot
              ) => {
                if (
                  !snapshot.exists()
                ) {
                  return;
                }

                const data =
                  snapshot.data();

                setCurrentUser(
                  (
                    previous
                  ) => {
                    if (
                      !previous
                    ) {
                      return previous;
                    }

                    return {
                      ...previous,

                      name:
                        typeof data.name ===
                        "string"
                          ? data.name
                          : previous.name,

                      avatar:
                        typeof data.avatar ===
                        "string"
                          ? data.avatar
                          : previous.avatar,

                      role:
                        data.role ===
                        "admin"
                          ? "admin"
                          : data.role ===
                              "user"
                            ? "user"
                            : previous.role
                    };
                  }
                );
              },
              (
                error
              ) => {
                console.error(
                  "Error al cargar perfil para Metas:",
                  error
                );
              }
            );


          unsubscribeProgress =
            onSnapshot(
              doc(
                db,
                "userProgress",
                firebaseUser.uid
              ),
              (
                snapshot
              ) => {
                if (
                  !snapshot.exists()
                ) {
                  setProgress(
                    EMPTY_PROGRESS
                  );

                  return;
                }

                setProgress({
                  ...EMPTY_PROGRESS,
                  ...(snapshot.data() as UserProgress)
                });
              },
              (
                error
              ) => {
                console.error(
                  "Error al cargar progreso para Metas:",
                  error
                );
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


  useEffect(() => {
    if (
      !currentUser
    ) {
      setGoals([]);
      setGoalProgress(
        []
      );

      return;
    }


    const unsubscribeGoals =
      onSnapshot(
        collection(
          db,
          "specialGoals"
        ),
        (
          snapshot
        ) => {
          const nextGoals =
            snapshot.docs.map(
              (
                goalDocument
              ) => ({
                id:
                  goalDocument.id,

                ...(goalDocument.data() as Omit<
                  GoalSummary,
                  "id"
                >)
              })
            );

          setGoals(
            nextGoals
          );
        },
        (
          error
        ) => {
          console.error(
            "Error al cargar metas:",
            error
          );
        }
      );


    let unsubscribeGoalProgress =
      () => {};


    if (
      currentUser.role ===
      "user"
    ) {
      const progressReference =
        query(
          collection(
            db,
            "goalProgress"
          ),
          where(
            "userId",
            "==",
            currentUser.id
          )
        );


      unsubscribeGoalProgress =
        onSnapshot(
          progressReference,
          (
            snapshot
          ) => {
            setGoalProgress(
              snapshot.docs.map(
                (
                  progressDocument
                ) =>
                  progressDocument.data() as GoalProgressSummary
              )
            );
          },
          (
            error
          ) => {
            console.error(
              "Error al cargar progreso de metas:",
              error
            );
          }
        );
    } else {
      setGoalProgress(
        []
      );
    }


    return () => {
      unsubscribeGoals();
      unsubscribeGoalProgress();
    };
  }, [
    currentUser?.id,
    currentUser?.role
  ]);


  if (
    !currentUser
  ) {
    return null;
  }


  const featuredGoal =
    goals.find(
      (
        goal
      ) =>
        goal.active &&
        goal.name
          .toLowerCase()
          .includes(
            "gta"
          )
    ) ??
    goals.find(
      (
        goal
      ) =>
        goal.active
    );


  const savedPoints =
    featuredGoal
      ? goalProgress
          .filter(
            (
              item
            ) =>
              item.goalId ===
              featuredGoal.id
          )
          .reduce(
            (
              total,
              item
            ) =>
              total +
              Number(
                item.savedPoints ??
                  0
              ),
            0
          )
      : 0;


  const goalPercentage =
    featuredGoal
      ? Math.min(
          (
            savedPoints /
            Math.max(
              featuredGoal.targetPoints,
              1
            )
          ) *
            100,
          100
        )
      : 0;


  return (
    <>
      {!open && (
        <div className="pointer-events-none fixed bottom-[calc(6.2rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 flex justify-center px-4">

          <button
            type="button"
            onClick={() =>
              setOpen(
                true
              )
            }
            className="pointer-events-auto w-full max-w-[300px] overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-2.5 text-white shadow-[0_8px_25px_rgba(124,58,237,0.35)] transition active:scale-[0.97]"
          >

            <div className="flex items-center gap-2.5">

              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/15">
                <Target className="h-5 w-5" />
              </div>


              <div className="min-w-0 flex-1 text-left">

                {currentUser.role ===
                "admin" ? (
                  <>
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/65">
                      ScanGame
                    </p>

                    <p className="truncate text-sm font-extrabold">
                      Metas especiales
                    </p>
                  </>
                ) : featuredGoal ? (
                  <>
                    <div className="flex items-center justify-between gap-2">

                      <p className="truncate text-sm font-extrabold">
                        {
                          featuredGoal.emoji ??
                          "🎯"
                        }{" "}
                        {
                          featuredGoal.name
                        }
                      </p>

                      <p className="flex-shrink-0 text-[10px] font-bold text-white/85">
                        {
                          savedPoints
                        }
                        /
                        {
                          featuredGoal.targetPoints
                        }
                      </p>

                    </div>

                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/20">

                      <div
                        className="h-full rounded-full bg-white"
                        style={{
                          width: `${goalPercentage}%`
                        }}
                      />

                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/65">
                      Objetivos
                    </p>

                    <p className="truncate text-sm font-extrabold">
                      Metas especiales
                    </p>
                  </>
                )}

              </div>
            </div>
          </button>

        </div>
      )}


      {open && (
        <div className="fixed inset-0 z-[1000] overflow-y-auto bg-[#E2DADB]">

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
                  onClick={() =>
                    setOpen(
                      false
                    )
                  }
                  className="rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>

              </div>
            </div>


            <div className="px-5 py-6 pb-28">

              <SpecialGoals
                currentUser={
                  currentUser
                }
                progress={
                  progress
                }
              />

            </div>

          </div>
        </div>
      )}
    </>
  );
}
