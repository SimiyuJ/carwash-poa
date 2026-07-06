
// app/page.tsx

import { redirect } from "next/navigation";

/* =========================================
   HOME PAGE
========================================= */

export default function HomePage() {
  /*
    SYSTEM ENTRY POINT

    We now use:
    - /auth for login
    - dashboard layouts handle role redirects
  */

  redirect("/auth");
}
