import React, { useState } from 'react';
import { toast } from 'sonner';
import { KeyRound, X, Check, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { updateAdminPassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await updateAdminPassword(currentPassword, newPassword);
      toast.success('Admin passcode updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update passcode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-[#1A2027] rounded-[16px] p-6 border border-[#E8E2D9] dark:border-[#2A3138] shadow-2xl space-y-4">
        
        <div className="flex items-center justify-between border-b border-[#E8E2D9] dark:border-[#2A3138] pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#D98E04]" />
            <h3 className="font-semibold text-base font-serif-literary text-[#14213D] dark:text-[#FAF7F2]">
              Change Admin Passcode
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#6B7280] hover:text-[#14213D]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#1A1A1A] dark:text-[#E5E7EB]">
              Current Password *
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter existing password..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2]/60 dark:bg-[#0F1419]/60 text-[#14213D] dark:text-[#FAF7F2] focus:border-[#D98E04]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#1A1A1A] dark:text-[#E5E7EB]">
              New Password (min 6 characters) *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2]/60 dark:bg-[#0F1419]/60 text-[#14213D] dark:text-[#FAF7F2] focus:border-[#D98E04]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#1A1A1A] dark:text-[#E5E7EB]">
              Confirm New Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2]/60 dark:bg-[#0F1419]/60 text-[#14213D] dark:text-[#FAF7F2] focus:border-[#D98E04]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E2D9] dark:border-[#2A3138]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#E8E2D9] text-xs font-semibold text-[#6B7280] hover:text-[#14213D]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[#14213D] hover:bg-[#2D4A73] dark:bg-[#D98E04] text-white text-xs font-semibold disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Passcode'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
