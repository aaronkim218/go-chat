import { CredentialResponse } from "google-one-tap";
import supabase from "@/utils/supabase";
import { useEffect } from "react";

declare global {
  interface Window {
    handleSignInWithGoogle: (response: CredentialResponse) => void;
  }
}

const GoogleSignInButton = () => {
  useEffect(() => {
    window.handleSignInWithGoogle = async function (
      response: CredentialResponse,
    ) {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
      });

      if (error) {
        console.error("Error signing in with Google:", error);
      }
    };

    if (document.getElementById("google-gsi-script")) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.id = "google-gsi-script";
    document.body.appendChild(script);

    return () => {
      const script = document.getElementById("google-gsi-script");
      if (script) {
        script.remove();
      }
    };
  }, []);

  return (
    <>
      <div
        id="g_id_onload"
        data-client_id="463578733051-jlub8pto1je9frh2t8stqle9o0vm1blo.apps.googleusercontent.com"
        data-context="signin"
        data-ux_mode="popup"
        data-callback="handleSignInWithGoogle"
        data-auto_prompt="false"
        data-use_fedcm_for_prompt="true"
      ></div>

      <div
        className="g_id_signin"
        data-type="icon"
        data-shape="square"
        data-theme="outline"
        data-text="signin_with"
        data-size="large"
      ></div>
    </>
  );
};
export default GoogleSignInButton;
