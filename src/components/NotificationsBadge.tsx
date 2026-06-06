'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/lib/authContext';

export default function NotificationsBadge() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!error && data) {
        setNotifications(data);
      }
    };

    fetchNotifications();

    // Subscribe to new notifications
    const supabase = getSupabaseClient();
    const channel = supabase.channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async () => {
    if (unreadCount === 0) return;
    const supabase = getSupabaseClient();
    
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user?.id)
      .eq('is_read', false);
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => {
          setOpen(!open);
          if (!open) markAsRead();
        }}
        className="relative p-2 text-white hover:bg-white/10 rounded-full transition"
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white"></span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
          <div className="p-3 bg-gray-50 border-b border-gray-100 font-bold text-gray-800 text-sm">
            Notifications
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No new notifications</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`p-4 border-b border-gray-50 ${!n.is_read ? 'bg-indigo-50/50' : ''}`}>
                  <h4 className="text-sm font-bold text-gray-900">{n.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                  <p className="text-[10px] text-gray-400 mt-2">
                    {new Date(n.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
