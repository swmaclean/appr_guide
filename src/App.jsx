import { useDrive } from './useDrive'

export default function App() {
  const { authState, user, login, logout } = useDrive()

  return (
    <div>
      <h1>APPR Guide</h1>

      <p>Status: {authState}</p>

      {authState !== 'authenticated' ? (
        <button onClick={login}>Connect Google Drive</button>
      ) : (
        <>
          <p>Welcome {user?.email}</p>
          <button onClick={logout}>Logout</button>
        </>
      )}
    </div>
  )
}
