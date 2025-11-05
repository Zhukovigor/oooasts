// app/admin/advertisements/[id]/edit/page.tsx
export default function TestPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <h1>Тестовая страница редактирования</h1>
      <p>ID: {params.id}</p>
      <p>Если эта страница открывается, значит проблема в компоненте edit-client</p>
    </div>
  )
}
