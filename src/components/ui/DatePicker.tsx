// src/components/ui/DatePicker.tsx
import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { DayPicker } from "react-day-picker";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "../../lib/utils";

export interface DatePickerProps {
  date?: Date;
  onChange?: (date: Date | undefined) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({
  date,
  onChange,
  label,
  error,
  placeholder = "Selecione uma data",
  disabled,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider select-none ml-1">
          {label}
        </label>
      )}

      <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            disabled={disabled}
            className={cn(
              "flex items-center w-full px-4 py-2.5 text-sm bg-surface border rounded-xl transition-all duration-200 outline-none text-left h-11",
              "focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm",
              "disabled:bg-surface-hover/50 disabled:text-text-muted disabled:cursor-not-allowed",
              !date && "text-text-muted",
              !error ? "border-border/60 hover:border-border" : "border-error focus:border-error focus:ring-error/20 text-error"
            )}
          >
            <CalendarIcon className={cn("mr-3 h-5 w-5 opacity-50", error && "text-error opacity-100")} />
            {date ? format(date, "PPP", { locale: ptBR }) : placeholder}
          </button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            className="z-[9999] p-3 bg-surface rounded-2xl border border-border/60 shadow-float data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          >
            {/* O Calendário usando DayPicker */}
            <DayPicker
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                onChange?.(newDate);
                setIsOpen(false); // Fecha o calendário ao selecionar
              }}
              locale={ptBR}
              showOutsideDays
              className="p-1"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-black text-text-main",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-border/50 rounded-md flex items-center justify-center transition-opacity"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-text-muted rounded-md w-9 font-bold text-[0.8rem] uppercase tracking-wider",
                row: "flex w-full mt-2",
                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-primary/10 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-9 w-9 p-0 font-medium text-text-main hover:bg-surface-hover hover:text-text-main rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                day_selected: "bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white font-black shadow-md",
                day_today: "bg-surface-hover/50 text-primary font-bold border border-primary/20",
                day_outside: "text-text-muted/50 opacity-50 aria-selected:bg-primary/10 aria-selected:text-primary aria-selected:opacity-30",
                day_disabled: "text-text-muted opacity-50",
                day_hidden: "invisible",
              }}
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {error && (
        <p className="text-xs text-error font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 ml-1 mt-0.5">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}