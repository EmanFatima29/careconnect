export const dynamic = "force-static";

export default function ApiUsersPage() {
  return (
    <main style={{ padding: 16 }}>
      <h1>/api/users</h1>
      <p>
        This path currently renders as a page in the App Router. The backend
        Users API is served from your Express server (NEXT_PUBLIC_API_BASE_URL)
        and is called directly by the client.
      </p>
    </main>
  );
}
