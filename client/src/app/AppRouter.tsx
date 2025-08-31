import { createBrowserRouter, RouterProvider } from "react-router";

export const AppRouter = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <h1 className="text-2xl text-center">Home </h1>,
    },
  ]);

  return <RouterProvider router={router} />;
};
