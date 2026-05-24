"use client";
/**
 * Client-side provider tree.
 * Keeping all "use client" context providers here lets `layout.js` remain a
 * Server Component so it can export static `metadata` for Next.js SEO.
 */
import { SessionProvider } from "next-auth/react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { SnackbarProvider } from "notistack";
import { store, persistor } from "@/utils/redux/store";
import { ThemeProvider } from "@/utils/ThemeContext";
import MuiThemeRegistry from "@/theme/MuiThemeRegistry";
import AppShell from "@/components/AppShell";

function PersistLoader() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <div>Loading...</div>
    </div>
  );
}

export default function Providers({ children, session }) {
  return (
    <SessionProvider session={session}>
      <Provider store={store}>
        <PersistGate loading={<PersistLoader />} persistor={persistor}>
          <ThemeProvider>
            <MuiThemeRegistry>
              <SnackbarProvider
                maxSnack={4}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                autoHideDuration={3500}
              >
                <AppShell>{children}</AppShell>
              </SnackbarProvider>
            </MuiThemeRegistry>
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </SessionProvider>
  );
}
