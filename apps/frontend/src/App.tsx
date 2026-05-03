import { Routes, Route, Outlet } from "react-router";
import { Nav } from "./components/Nav";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomePage } from "./pages/Home";
import { LoginPage } from "./pages/Login";

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          index
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route path="login" element={<LoginPage />} />
        <Route
          path="*"
          element={<p className="text-primary text-sm max-w-5xl mx-auto px-6 py-12">Not Found</p>}
        />
      </Route>
    </Routes>
  );
}
