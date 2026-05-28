import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { ClerkLoaded, ClerkLoading, SignIn, SignUp, useAuth } from "@clerk/react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import propertyImage from "@/assets/property-3.jpg";

const clerkAppearance = {
  elements: {
    rootBox: "w-full",
    card: "shadow-card border border-border rounded-lg",
    footer: "hidden",
  },
  variables: {
    colorPrimary: "#22c55e",
    borderRadius: "0.5rem",
  },
};

const Login = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const activeTab = searchParams.get("mode") === "signup" ? "signup" : "login";
  const redirectTarget =
    typeof location.state?.from === "string" ? location.state.from : "/";

  const setActiveTab = (value: string) => {
    setSearchParams(value === "signup" ? { mode: "signup" } : {});
  };

  if (isLoaded && isSignedIn) {
    return <Navigate to={redirectTarget} replace />;
  }

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden md:block relative overflow-hidden">
        <img
          src={propertyImage}
          alt="Modern home interior"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 h-full flex flex-col justify-end p-10 text-white">
          <div className="max-w-xl pb-8">
            <h1 className="text-3xl lg:text-4xl font-semibold leading-tight">
              Find your next home in Namibia.
            </h1>
            <p className="mt-4 text-base lg:text-lg text-white/85">
              Save properties, manage listings, and connect directly with verified agents.
            </p>
          </div>
        </div>
      </section>

      <section className="min-h-screen flex flex-col px-4 md:px-10 lg:px-14">
        <div className="flex md:hidden justify-center items-center pt-8 pb-5">
          <img
            src="/Ndunda_logo.png"
            alt="Ndunda Logo"
            className="h-12 w-auto object-contain"
          />
        </div>

        <div className="flex-1 flex items-start md:items-center justify-center pb-8 md:pb-0">
        <div className="w-full max-w-md">
          <Link to="/" className="hidden md:flex justify-center mb-6">
            <img
              src="/Ndunda_logo.png"
              alt="Ndunda Logo"
              className="h-14 w-auto object-contain"
            />
          </Link>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 rounded-lg">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
          </Tabs>

          <ClerkLoading>
            <div className="min-h-[18rem] rounded-lg border border-border bg-card shadow-card flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading secure sign in...</p>
            </div>
          </ClerkLoading>

          <ClerkLoaded>
            {activeTab === "login" ? (
              <SignIn
                routing="virtual"
                signUpUrl="/login?mode=signup"
                forceRedirectUrl={redirectTarget}
                appearance={clerkAppearance}
              />
            ) : (
              <SignUp
                routing="virtual"
                signInUrl="/login"
                forceRedirectUrl={redirectTarget}
                appearance={clerkAppearance}
              />
            )}
          </ClerkLoaded>

          <div className="mt-4 text-center">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Continue as guest
            </Link>
          </div>
        </div>
      </div>
      </section>
    </div>
  );
};

export default Login;
