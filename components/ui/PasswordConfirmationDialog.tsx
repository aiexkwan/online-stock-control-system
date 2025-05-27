"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose, // Added for explicit close button if needed via children
} from "./dialog"; // Assuming dialog is in the same folder or accessible via path
import { Input } from "./input"; // Assuming input is in the same folder or accessible via path
import { Button } from "./button"; // Assuming button is in the same folder or accessible via path

interface PasswordConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export function PasswordConfirmationDialog(props: PasswordConfirmationDialogProps) {
  const { 
    isOpen, 
    onOpenChange, 
    onConfirm, 
    onCancel, 
    title = "Confirm Action", 
    description = "Please enter your password to proceed.",
    isLoading = false
  } = props;
  const [password, setPassword] = React.useState("");
  const passwordInputRef = React.useRef<HTMLInputElement>(null);

  // Debug logs removed to reduce console noise

  const handleConfirm = React.useCallback(() => {
    if (password.trim() !== "") {
      onConfirm(password);
    }
  }, [password, onConfirm]);

  const handleCancel = React.useCallback(() => {
    onCancel();
    setPassword(""); // Clear password on cancel
  }, [onCancel]);
  
  // Effect to focus the password input when the dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100); // Small delay to ensure dialog is rendered
      setPassword(""); // Clear password when dialog opens
    }
  }, [isOpen]);

  // Handle Escape key press for cancellation, and Enter key for confirmation
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        handleCancel();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (!isLoading) { // Only submit if not already loading
             handleConfirm();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, password, handleConfirm, handleCancel]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) { // If dialog is closed (e.g. by clicking outside or Escape key handled by Radix)
        handleCancel();
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-orange-400">{title}</DialogTitle>
          <DialogDescription className="text-gray-300">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              id="password-confirm"
              type="password"
              ref={passwordInputRef}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="col-span-4 bg-gray-700 border-gray-600 placeholder-gray-500 text-white focus:ring-orange-500 focus:border-orange-500"
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel} 
            disabled={isLoading}
            className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
          >
            Cancel
          </Button>
          <Button 
            type="submit" // Changed to submit, can be linked to a form if needed or just for Enter key behavior
            onClick={handleConfirm} 
            disabled={isLoading || password.trim() === ""}
            className="bg-orange-600 hover:bg-orange-700 text-white disabled:bg-gray-500"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Confirming...
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 