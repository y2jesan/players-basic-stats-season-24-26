import { Link } from "@tanstack/react-router"

export function Footer() {
  return (
    <footer className="text-muted-foreground flex items-center justify-center border-t px-4 py-4 text-sm">
      <Link to="/glossary" className="hover:text-foreground underline underline-offset-2">
        Stat Glossary — what every stat means
      </Link>
    </footer>
  )
}
