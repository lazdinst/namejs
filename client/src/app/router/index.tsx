import React from "react";
import { Routes, Route } from "react-router-dom";
import InitializeActiveRoute from "./InitializeActiveRoute";
const supportedModuleRoutes = import.meta.env.VITE_SUPPORTED_MODULES || [
  "home",
];

if (!supportedModuleRoutes.includes("home")) {
  supportedModuleRoutes.push("home");
}

const secondaryModuleRoutes = import.meta.env.VITE_SECONDARY_MODULES || [
  "settings",
];

type RoutePathTypes = "/" | "/system";

type RouteNameTypes = "home" | "system";

interface RouteMap {
  HOME: RoutePathTypes;
  SYSTEM: RoutePathTypes;
}

export const routesMap: RouteMap = {
  HOME: "/",
  SYSTEM: "/system",
};

export interface RouteItem {
  path: RoutePathTypes;
  name: RouteNameTypes;
  icon: string;
  details: string;
  element: JSX.Element;
}

export const routes: RouteItem[] = [
  {
    path: routesMap.HOME,
    name: "home",
    icon: "home",
    details: "Home",
    element: <>home</>,
  },
  {
    path: routesMap.SYSTEM,
    name: "system",
    icon: "rocket",
    details: "System",
    element: <>system</>,
  },
];

export const routerMenuItems = routes
  .map((route: RouteItem) => ({
    icon: route.icon,
    name: route.name,
    route: route.path,
    details: route.details,
  }))
  .filter((item) => supportedModuleRoutes.includes(item.name.toLowerCase()));

export const secondaryRouterMenuitems = routes
  .map((route) => ({
    icon: route.icon,
    name: route.name,
    route: route.path,
    details: route.details,
  }))
  .filter((item) => secondaryModuleRoutes.includes(item.name.toLowerCase()));

const Router: React.FC = () => {
  return (
    <>
      <InitializeActiveRoute />
      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
    </>
  );
};

export default Router;
