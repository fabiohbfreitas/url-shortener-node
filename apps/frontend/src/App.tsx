import { Routes, Route, Link, Outlet } from "react-router";

function Layout() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/example">Example</Link>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<p>Home</p>} />
        <Route path="example" element={<p>Example Page</p>} />
        <Route path="*" element={<p>Not Found</p>} />
      </Route>
    </Routes>
  );
}
