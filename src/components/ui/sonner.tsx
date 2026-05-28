import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-xl group-[.toaster]:border group-[.toaster]:shadow-lg",
          success:
            "group-[.toaster]:border-primary group-[.toaster]:bg-primary group-[.toaster]:text-primary-foreground",
          error:
            "group-[.toaster]:border-destructive group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground",
          warning:
            "group-[.toaster]:border-amber-500 group-[.toaster]:bg-amber-500 group-[.toaster]:text-white",
          info:
            "group-[.toaster]:border-primary group-[.toaster]:bg-secondary group-[.toaster]:text-secondary-foreground",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary-foreground group-[.toast]:text-primary",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
