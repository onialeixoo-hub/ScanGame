
              <div>
                <p className="mb-2 text-xs font-semibold text-[#386FA4]">
                  Prioridad sugerida
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {(
                    [
                      "low",
                      "medium",
                      "high",
                      "very_high",
                      "special"
                    ] as TaskPriority[]
                  ).map((priority) => {
                    const config = TASK_PRIORITY_CONFIG[priority];

                    return (
                      <button
                        key={priority}
                        type="button"
                        className={`rounded-xl border px-1 py-2 text-[10px] font-bold ${
                          taskDraft.priority === priority
                            ? config.buttonClass
                            : "border-slate-200 bg-white text-slate-500"
                        }`}
                        onClick={() =>
                          setTaskDraft((previous) => ({
                            ...previous,
                            priority,
                            points: config.points,
                            xp: config.xp
                          }))
                        }
                      >
                        {config.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#386FA4]">
                    Puntos
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={taskDraft.points}
                    onChange={(event) => {
                      const points = Number(event.target.value);
                      setTaskDraft((previous) => ({
                        ...previous,
                        points,
                        priority: getPriorityFromPoints(points)
                      }));
                    }}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#386FA4]">
                    XP
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={taskDraft.xp}
                    onChange={(event) =>
                      setTaskDraft((previous) => ({
                        ...previous,
                        xp: Number(event.target.value)
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setTaskRequestBeingResolved(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-[#386FA4] text-white"
                onClick={() => void saveTaskFromRequest()}
              >
                Crear tarea
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
