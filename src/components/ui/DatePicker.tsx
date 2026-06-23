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
  disableFuture?: boolean;
  containerClassName?: string;
}

export function DatePicker({
  date,
  onChange,
  label,
  error,
  placeholder = "Selecione uma data",
  disabled,
  disableFuture = true,
  containerClassName,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const datePickerId = React.useId();

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", containerClassName)}>
      {label && (
        <label htmlFor={datePickerId} className="text-xs font-bold text-text-secondary uppercase tracking-wider select-none ms-1">
          {label}
        </label>
      )}

      <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            id={datePickerId}
            disabled={disabled}
            className={cn(
              "flex h-12 w-full items-center justify-start rounded-2xl bg-surface-hover/50 px-4 py-3 text-sm text-text-main font-medium shadow-inner transition-all duration-300 border border-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-surface disabled:cursor-not-allowed disabled:opacity-50 touch-target focus-ring",
              !date && "text-text-muted/60",
              !error ? "border-border/60 hover:border-border" : "border-error focus:border-error focus:ring-error/20 text-error"
            )}
          >
            <CalendarIcon className={cn("me-3 h-5 w-5 opacity-50", error && "text-error opacity-100")} />
            {date ? format(date, "PPP", { locale: ptBR }) : placeholder}
          </button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={8}
            className="z-[9999] p-3 w-auto bg-surface rounded-2xl border border-border/60 shadow-float data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          >
            <DayPicker
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                onChange?.(newDate);
                setIsOpen(false);
              }}
              disabled={disableFuture ? { after: new Date() } : disabled}
              locale={ptBR}
              showOutsideDays={true}
              fixedWeeks={true}
              captionLayout="dropdown"
              startMonth={new Date(1950, 0)}
              endMonth={new Date(2050, 11)}
              className="p-1"
              labels={{
                labelPrevious: () => "Mês anterior",
                labelNext: () => "Próximo mês",
              }}
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-black text-text-main hidden", // Esconde a label padrão para mostrar os selects
                dropdowns: "flex justify-center gap-2",
                dropdown_root: "relative flex items-center text-sm font-black text-text-main bg-surface-hover/50 rounded-lg border border-border/50 px-2 py-1",
                dropdown: "bg-transparent w-full h-full text-text-main outline-none appearance-none cursor-pointer absolute inset-0 opacity-0 z-10",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-border/50 rounded-md flex items-center justify-center transition-opacity"
                ),
                nav_button_previous: "absolute inset-s-1",
                nav_button_next: "absolute inset-e-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-text-muted rounded-md w-9 font-bold text-[0.8rem] uppercase tracking-wider",
                row: "flex w-full mt-2",
                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-primary/10 first:[&:has([aria-selected])]:rounded-s-md last:[&:has([aria-selected])]:rounded-e-md focus-within:relative focus-within:z-20",
                
                day: "h-9 w-9 p-0 font-medium text-text-main hover:bg-surface-hover hover:text-text-main rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-30 disabled:text-text-muted/50 aria-disabled:opacity-30 aria-disabled:text-text-muted/50 aria-disabled:hover:bg-transparent aria-disabled:cursor-not-allowed aria-disabled:pointer-events-none",
                day_selected: "bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white font-black shadow-md",
                day_today: "bg-surface-hover/50 text-primary font-bold border border-primary/20",
                day_outside: "text-text-muted/50 opacity-50 aria-selected:bg-primary/10 aria-selected:text-primary aria-selected:opacity-30",
                day_disabled: "text-text-muted/50 opacity-30 cursor-not-allowed pointer-events-none",
                disabled: "text-text-muted/50 opacity-30 cursor-not-allowed pointer-events-none",
                
                day_hidden: "invisible",
              }}
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {error && (
        <p className="text-xs text-error font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 ms-1 mt-0.5">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}