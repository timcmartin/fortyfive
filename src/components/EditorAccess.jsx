import { useState } from "react";
import { LogIn, LogOut } from "lucide-react";

export function EditorAccess({ editorAuth }) {
  const [showSignIn, setShowSignIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSignIn = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      await editorAuth.signIn(email, password);
      setPassword("");
      setShowSignIn(false);
    } catch (signInError) {
      setError(signInError.message);
    }
  };

  if (editorAuth.loading) {
    return <span className="loading loading-spinner loading-sm" />;
  }

  if (editorAuth.user) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm">
          {editorAuth.isEditor ? "Editor signed in" : "Signed in without editor access"}
        </span>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => void editorAuth.signOut()}
        >
          <LogOut className="size-4" />
          Sign out
        </button>
        {editorAuth.error && <span className="text-sm text-error">{editorAuth.error}</span>}
      </div>
    );
  }

  return (
    <div>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setShowSignIn((current) => !current)}
        disabled={!editorAuth.configured}
      >
        <LogIn className="size-4" />
        Editor sign in
      </button>
      {showSignIn && (
        <form className="mt-3 flex flex-wrap items-end gap-3" onSubmit={handleSignIn}>
          <label className="form-control">
            <span className="label-text mb-1">Email</span>
            <input
              className="input input-bordered"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-1">Password</span>
            <input
              className="input input-bordered"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button className="btn btn-primary" type="submit">Sign in</button>
        </form>
      )}
      {!editorAuth.configured && (
        <p className="mt-2 text-sm text-warning">
          Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable editor access.
        </p>
      )}
      {(error || editorAuth.error) && (
        <p className="mt-2 text-sm text-error">{error ?? editorAuth.error}</p>
      )}
    </div>
  );
}
