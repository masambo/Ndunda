import AppLayout from "@/components/layout/AppLayout";
import { ArrowLeft, Bell, Home, BadgeCheck, Heart, Calendar, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const getIcon = (type: string) => {
  switch (type) {
    case "listing":
      return Home;
    case "saved":
      return Heart;
    case "agent":
      return BadgeCheck;
    case "viewing":
      return Calendar;
    case "booking":
      return Clock;
    default:
      return Bell;
  }
};

const getIconColor = (type: string) => {
  switch (type) {
    case "listing":
      return "bg-primary/10 text-primary";
    case "saved":
      return "bg-destructive/10 text-destructive";
    case "agent":
      return "bg-warning/10 text-warning";
    case "viewing":
      return "bg-info/10 text-info";
    case "booking":
      return "bg-primary/10 text-primary";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const Notifications = () => {
  const notifications = useQuery(api.notifications.list, { limit: 50 });
  const markAllRead = useMutation(api.notifications.markAllRead);
  const loading = notifications === undefined;
  const unread = (notifications ?? []).filter((notification) => !notification.read).length;

  return (
    <AppLayout>
      <div className="px-4 pt-4 pb-6">
        <Link to="/profile" className="inline-flex items-center gap-2 text-muted-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                {unread} unread
              </p>
            </div>
          </div>
          <button
            className="text-sm text-primary font-medium disabled:opacity-50"
            disabled={loading || unread === 0}
            onClick={() => void markAllRead({})}
          >
            Mark all read
          </button>
        </div>

        {loading ? (
          <div className="grid min-h-48 place-items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">No notifications</h3>
            <p className="text-sm text-muted-foreground">
              We'll notify you about important updates
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon = getIcon(notification.type);
              const content = (
                <div
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl transition-colors",
                    notification.read ? "bg-card" : "bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    getIconColor(notification.type)
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={cn(
                        "text-sm",
                        notification.read ? "font-medium text-foreground" : "font-semibold text-foreground"
                      )}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                      {notification.description}
                    </p>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
              return notification.path ? (
                <Link key={notification._id} to={notification.path}>
                  {content}
                </Link>
              ) : (
                <div key={notification._id}>{content}</div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;
