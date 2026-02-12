import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Публичная регистрация отключена. Обратитесь к администратору." },
    { status: 403 }
  );
}
