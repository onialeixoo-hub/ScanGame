import { useEffect } from "react";
import {
  onAuthStateChanged
} from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  runTransaction
} from "firebase/firestore";
import { toast } from "sonner";

import {
  auth,
  db
} from "@/firebase";

import {
  rarityBasePoints
} from "@/app/lib/products";

import type {
  ProductRarity,
  UserProgress
} from "@/app/types";

interface ScanData {
  rarity?: ProductRarity;
  xpReward?: number;
}

export function ScanPointsAwarder() {
  useEffect(() => {
    let unsubscribeScans =
      () => {};

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        (firebaseUser) => {
          unsubscribeScans();

          if (!firebaseUser) {
            return;
          }

          let initialSnapshot =
            true;

          const processedScans =
            new Set<string>();

          const scansReference =
            collection(
              db,
              "users",
              firebaseUser.uid,
              "scans"
            );

          unsubscribeScans =
            onSnapshot(
              scansReference,
              (snapshot) => {
                if (
                  initialSnapshot
                ) {
                  snapshot.docs.forEach(
                    (scanDocument) => {
                      processedScans.add(
                        scanDocument.id
                      );
                    }
                  );

                  initialSnapshot =
                    false;

                  return;
                }

                snapshot
                  .docChanges()
                  .forEach(
                    (change) => {
                      if (
                        change.type !==
                        "added"
                      ) {
                        return;
                      }

                      if (
                        processedScans.has(
                          change.doc.id
                        )
                      ) {
                        return;
                      }

                      processedScans.add(
                        change.doc.id
                      );

                      const scan =
                        change.doc.data() as ScanData;

                      if (
                        !scan.rarity
                      ) {
                        return;
                      }

                      if (
                        !scan.xpReward ||
                        scan.xpReward <=
                          0
                      ) {
                        return;
                      }

                      const points =
                        rarityBasePoints[
                          scan.rarity
                        ];

                      if (
                        points <= 0
                      ) {
                        return;
                      }

                      const progressReference =
                        doc(
                          db,
                          "userProgress",
                          firebaseUser.uid
                        );

                      void runTransaction(
                        db,
                        async (
                          transaction
                        ) => {
                          const progressSnapshot =
                            await transaction.get(
                              progressReference
                            );

                          const currentProgress =
                            progressSnapshot.exists()
                              ? (
                                  progressSnapshot.data() as UserProgress
                                )
                              : {
                                  xp: 0,
                                  points: 0,
                                  streak: 0
                                };

                          transaction.set(
                            progressReference,
                            {
                              points:
                                Number(
                                  currentProgress.points ??
                                    0
                                ) +
                                points
                            },
                            {
                              merge: true
                            }
                          );
                        }
                      )
                        .then(() => {
                          toast.success(
                            `+${points} puntos por escaneo`
                          );
                        })
                        .catch(
                          (error) => {
                            console.error(
                              "Error al sumar puntos del escaneo:",
                              error
                            );

                            toast.error(
                              "No se pudieron sumar los puntos del escaneo"
                            );
                          }
                        );
                    }
                  );
              },
              (error) => {
                console.error(
                  "Error escuchando escaneos:",
                  error
                );
              }
            );
        }
      );

    return () => {
      unsubscribeAuth();
      unsubscribeScans();
    };
  }, []);

  return null;
}
