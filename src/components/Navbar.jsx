import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Menu,
  User,
  UserCircle,
  Wallet,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { formatNotificationTime, NotificationIcon } from "./NotificationIcon";

const Navbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const menuRef = useRef(null);
  const notificationsRef = useRef(null);

  const displayName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || "";

  const avatarUrl = user?.user_metadata?.custom_avatar_url || "";

  // Close the dropdown when clicking outside of it.
  useEffect(() => {
    if (!menuOpen && !notificationsOpen) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) setNotificationsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen, notificationsOpen]);

  const goTo = (path) => {
    setMenuOpen(false);
    setNotificationsOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setMenuOpen(false);

    try {
      await logout();
      toast.success("Logged out successfully.");
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out. Please try again.");
    }
  };

  const menuItems = [
    { label: "My Profile", icon: UserCircle, onClick: () => goTo("/profile") },
    {
      label: "Financial Profile",
      icon: Wallet,
      onClick: () => goTo("/financial-profile"),
    },
    {
      label: "Account Settings",
      icon: Settings,
      onClick: () => goTo("/settings"),
    },
    {
      label: "Notifications",
      icon: Bell,
      onClick: () => goTo("/notifications"),
    },
    { label: "Help & Support", icon: HelpCircle, onClick: () => goTo("/help") },
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-40 h-20 border-b border-slate-200 bg-white shadow-sm md:left-64">
      <div className="flex h-full items-center justify-between px-4 md:px-6">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-3">

          {/* MOBILE BURGER */}
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          >
            <Menu size={24} />
          </button>

          {/* MOBILE LOGO */}
          <div className="flex items-center gap-2 md:hidden">
            {/* <img
              src={logo}
              alt="BudgetFlow"
              className="h-12 w-auto rounded-full object-contain"
            /> */}

            <span className="text-lg font-bold text-slate-900">
              BudgetFlow
            </span>
          </div>

          {/* DESKTOP PAGE TITLE */}
          {/* <h2 className="hidden font-semibold text-slate-900 md:block">
            Dashboard
          </h2> */}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
              onClick={() => {
                setNotificationsOpen((previous) => !previous);
                setMenuOpen(false);
              }}
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-700 hover:text-indigo-600"
            >
              <Bell size={21} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold leading-5 text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="fixed left-4 right-4 top-20 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-14 sm:w-80 dark:border-slate-600">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-600">
                  <p className="font-semibold text-slate-900">Notifications</p>
                  {unreadCount > 0 && <span className="text-xs font-medium text-indigo-600">{unreadCount} unread</span>}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.slice(0, 5).map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={async () => {
                        if (!notification.read) await markAsRead(notification.id);
                      }}
                      className={`flex w-full gap-3 border-b border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700 ${!notification.read ? "bg-indigo-50 dark:bg-slate-800" : ""}`}
                    >
                      <NotificationIcon type={notification.type} size={16} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-slate-900">{notification.title}</span>
                          {!notification.read && <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-600" />}
                        </span>
                        <span className="mt-0.5 block line-clamp-2 text-xs text-slate-600 dark:text-slate-200">{notification.message}</span>
                        <span className="mt-1 block text-xs text-slate-400">{formatNotificationTime(notification.created_at)}</span>
                      </span>
                    </button>
                  ))}
                  {notifications.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</p>}
                </div>
                <button type="button" onClick={() => goTo("/notifications")} className="w-full px-4 py-3 text-left text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-slate-700">
                  View all notifications →
                </button>
              </div>
            )}
          </div>

        {/* USER AVATAR + MENU */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="User profile"
            aria-expanded={menuOpen}
            onClick={() => {
              setMenuOpen((prev) => !prev);
              setNotificationsOpen(false);
            }}
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-800 text-white shadow-sm transition hover:bg-slate-700"
          >
            {avatarUrl && !avatarLoadError ? (
              <img
                src={avatarUrl}
                alt="Profile"
                onError={() => setAvatarLoadError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <User size={20} />
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="truncate font-semibold text-slate-900">
                  {displayName || "BudgetFlow User"}
                </p>
                <p className="truncate text-sm text-slate-500">
                  {user?.email || ""}
                </p>
              </div>

              <div className="py-1">
                {menuItems.map(({ label, icon: Icon, onClick }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={onClick}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Icon size={18} className="text-slate-500" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 py-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
