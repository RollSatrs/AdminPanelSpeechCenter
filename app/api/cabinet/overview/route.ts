import { desc, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  childExerciseAssignmentsTable,
  childrenTable,
  speechExercisesTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import { ensureExerciseTables } from "@/lib/exercises-db";
import { getCurrentParentSession } from "@/lib/parent-session";

export async function GET(req: NextRequest) {
  try {
    const parent = await getCurrentParentSession(req);
    if (!parent) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await ensureExerciseTables();

    const children = await db
      .select({
        id: childrenTable.id,
        fullName: childrenTable.fullname,
        birthDate: childrenTable.birthDate,
        language: childrenTable.language,
      })
      .from(childrenTable)
      .where(eq(childrenTable.parentId, parent.parentId));

    const childIds = children.map((child) => child.id);
    const assignments =
      childIds.length === 0
        ? []
        : await db
            .select({
              id: childExerciseAssignmentsTable.id,
              childId: childExerciseAssignmentsTable.childId,
              exerciseId: childExerciseAssignmentsTable.exerciseId,
              status: childExerciseAssignmentsTable.status,
              notes: childExerciseAssignmentsTable.notes,
              assignedAt: childExerciseAssignmentsTable.assignedAt,
              completedAt: childExerciseAssignmentsTable.completedAt,
            })
            .from(childExerciseAssignmentsTable)
            .where(inArray(childExerciseAssignmentsTable.childId, childIds))
            .orderBy(desc(childExerciseAssignmentsTable.assignedAt), desc(childExerciseAssignmentsTable.id));

    const exerciseIds = Array.from(new Set(assignments.map((assignment) => assignment.exerciseId)));
    const exercises =
      exerciseIds.length === 0
        ? []
        : await db
            .select({
              id: speechExercisesTable.id,
              slug: speechExercisesTable.slug,
              title: speechExercisesTable.title,
              word: speechExercisesTable.word,
              targetSound: speechExercisesTable.targetSound,
              imageEmoji: speechExercisesTable.imageEmoji,
              accentColor: speechExercisesTable.accentColor,
              samplePrompt: speechExercisesTable.samplePrompt,
              helperText: speechExercisesTable.helperText,
            })
            .from(speechExercisesTable)
            .where(inArray(speechExercisesTable.id, exerciseIds));

    const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));

    const childrenWithAssignments = children.map((child) => {
      const childAssignments = assignments
        .filter((assignment) => assignment.childId === child.id)
        .map((assignment) => {
          const exercise = exerciseById.get(assignment.exerciseId);
          return {
            id: assignment.id,
            childId: child.id,
            status: assignment.status,
            notes: assignment.notes,
            assignedAt:
              assignment.assignedAt instanceof Date
                ? assignment.assignedAt.toISOString()
                : String(assignment.assignedAt),
            completedAt:
              assignment.completedAt instanceof Date
                ? assignment.completedAt.toISOString()
                : assignment.completedAt
                  ? String(assignment.completedAt)
                  : null,
            exercise: {
              id: exercise?.id ?? assignment.exerciseId,
              slug: exercise?.slug ?? "",
              title: exercise?.title ?? "Упражнение",
              word: exercise?.word ?? "",
              targetSound: exercise?.targetSound ?? null,
              imageEmoji: exercise?.imageEmoji ?? "🎯",
              accentColor: exercise?.accentColor ?? "#FF8B6A",
              samplePrompt: exercise?.samplePrompt ?? "",
              helperText: exercise?.helperText ?? "",
            },
          };
        });

      return {
        id: child.id,
        fullName: child.fullName,
        birthDate: String(child.birthDate),
        language: child.language,
        assignments: childAssignments,
      };
    });

    const allAssignments = childrenWithAssignments.flatMap((child) => child.assignments);

    return NextResponse.json({
      ok: true,
      parent: {
        id: parent.parentId,
        fullName: parent.fullName,
        phone: parent.phone,
        login: parent.login,
      },
      stats: {
        totalChildren: childrenWithAssignments.length,
        totalAssignments: allAssignments.length,
        inProgress: allAssignments.filter((item) => item.status === "in_progress").length,
        completed: allAssignments.filter((item) => item.status === "completed").length,
      },
      children: childrenWithAssignments,
    });
  } catch (error) {
    console.error("cabinet overview error", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
