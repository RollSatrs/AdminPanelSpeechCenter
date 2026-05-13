import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  childExerciseAssignmentsTable,
  childrenTable,
  speechExercisesTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import { ensureExerciseTables } from "@/lib/exercises-db";
import { getCurrentParentSession } from "@/lib/parent-session";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const parent = await getCurrentParentSession(req);
    if (!parent) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await ensureExerciseTables();

    const { id } = await params;
    const assignmentId = Number(id);
    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      return NextResponse.json({ message: "Некорректный id упражнения" }, { status: 400 });
    }

    const rows = await db
      .select({
        id: childExerciseAssignmentsTable.id,
        childId: childExerciseAssignmentsTable.childId,
        status: childExerciseAssignmentsTable.status,
        notes: childExerciseAssignmentsTable.notes,
        assignedAt: childExerciseAssignmentsTable.assignedAt,
        completedAt: childExerciseAssignmentsTable.completedAt,
        childFullName: childrenTable.fullname,
        childBirthDate: childrenTable.birthDate,
        childLanguage: childrenTable.language,
        exerciseId: speechExercisesTable.id,
        exerciseSlug: speechExercisesTable.slug,
        exerciseTitle: speechExercisesTable.title,
        exerciseWord: speechExercisesTable.word,
        targetSound: speechExercisesTable.targetSound,
        imageEmoji: speechExercisesTable.imageEmoji,
        accentColor: speechExercisesTable.accentColor,
        samplePrompt: speechExercisesTable.samplePrompt,
        helperText: speechExercisesTable.helperText,
      })
      .from(childExerciseAssignmentsTable)
      .innerJoin(childrenTable, eq(childrenTable.id, childExerciseAssignmentsTable.childId))
      .innerJoin(speechExercisesTable, eq(speechExercisesTable.id, childExerciseAssignmentsTable.exerciseId))
      .where(
        and(
          eq(childExerciseAssignmentsTable.id, assignmentId),
          eq(childrenTable.parentId, parent.parentId)
        )
      )
      .limit(1);

    const assignment = rows[0];
    if (!assignment) {
      return NextResponse.json({ message: "Упражнение не найдено" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      assignment: {
        id: assignment.id,
        child: {
          id: assignment.childId,
          fullName: assignment.childFullName,
          birthDate: String(assignment.childBirthDate),
          language: assignment.childLanguage,
        },
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
          id: assignment.exerciseId,
          slug: assignment.exerciseSlug,
          title: assignment.exerciseTitle,
          word: assignment.exerciseWord,
          targetSound: assignment.targetSound,
          imageEmoji: assignment.imageEmoji ?? "🎯",
          accentColor: assignment.accentColor ?? "#FF8B6A",
          samplePrompt: assignment.samplePrompt,
          helperText: assignment.helperText,
        },
      },
    });
  } catch (error) {
    console.error("cabinet assignment GET error", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const parent = await getCurrentParentSession(req);
    if (!parent) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await ensureExerciseTables();

    const { id } = await params;
    const assignmentId = Number(id);
    const body = await req.json().catch(() => null);
    const status = String(body?.status ?? "").trim();

    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      return NextResponse.json({ message: "Некорректный id упражнения" }, { status: 400 });
    }

    if (!["assigned", "in_progress", "completed"].includes(status)) {
      return NextResponse.json({ message: "Некорректный статус" }, { status: 400 });
    }

    const rows = await db
      .select({
        id: childExerciseAssignmentsTable.id,
      })
      .from(childExerciseAssignmentsTable)
      .innerJoin(childrenTable, eq(childrenTable.id, childExerciseAssignmentsTable.childId))
      .where(
        and(
          eq(childExerciseAssignmentsTable.id, assignmentId),
          eq(childrenTable.parentId, parent.parentId)
        )
      )
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ message: "Упражнение не найдено" }, { status: 404 });
    }

    await db
      .update(childExerciseAssignmentsTable)
      .set({
        status: status as "assigned" | "in_progress" | "completed",
        updatedAt: new Date(),
        completedAt: status === "completed" ? new Date() : null,
      })
      .where(eq(childExerciseAssignmentsTable.id, assignmentId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("cabinet assignment PATCH error", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
