import * as React from "react"
import { Dashboard } from "@/pages/Dashboard"
import { Practice } from "@/pages/Practice"

type Route = "dashboard" | "practice"

function getRoute(): Route {
  if (window.location.pathname === "/practice") return "practice"
  const hash = window.location.hash.replace("#/", "").replace("#", "")
  return hash === "practice" ? "practice" : "dashboard"
}

export function App() {
  const [route, setRoute] = React.useState<Route>(getRoute)

  React.useEffect(() => {
    const onRouteChange = () => setRoute(getRoute())
    window.addEventListener("popstate", onRouteChange)
    window.addEventListener("hashchange", onRouteChange)
    return () => {
      window.removeEventListener("popstate", onRouteChange)
      window.removeEventListener("hashchange", onRouteChange)
    }
  }, [])

  function navigate(target: string) {
    const r = target === "practice" ? "practice" : "dashboard"
    window.history.pushState({}, "", r === "practice" ? "/practice" : "/")
    setRoute(r)
  }

  if (route === "practice") {
    return <Practice onNavigate={navigate} />
  }

  return <Dashboard onNavigate={navigate} />
}

export default App
