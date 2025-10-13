"use server"

export async function verifyAdminPassword(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminPassword = process.env.ARTICLE_ADMIN_PASSWORD || "admin2025"

    if (password === adminPassword) {
      return { success: true }
    }

    return { success: false, error: "Неверный пароль" }
  } catch (error) {
    console.error("[v0] Error verifying admin password:", error)
    return { success: false, error: "Ошибка проверки пароля" }
  }
}
