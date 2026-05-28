import AppLayout from "@/components/layout/AppLayout";
import { ArrowLeft, Bell, Home, BadgeCheck, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const notifications = [
  {
    id: "2",
    type: "listing",
    title: "Your listing is live",
    description: "Bachelor Flat is now visible to tenants",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "3",
    type: "saved",
    title: "Price drop alert",
    description: "A property you saved reduced its price",
    time: "3 hours ago",
    read: true,
  },
  {
    id: "4",
    type: "agent",
    title: "Agent application update",
    description: "Your application is under review",
    time: "Yesterday",
    read: true,
  },
];

const getIcon = (type: string) => {
  switch (type) {
    case "listing":
      return Home;
    case "saved":
      return Heart;
    case "agent":
      return BadgeCheck;
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
    default:
      return "bg-muted text-muted-foreground";
  }
};

const Notifications = () => {
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
                {notifications.filter(n => !n.read).length} unread
              </p>
            </div>
          </div>
          <button className="text-sm text-primary font-medium">Mark all read</button>
        </div>

        {notifications.length === 0 ? (
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
              return (
                <div
                  key={notification.id}
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
                      {notification.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;
