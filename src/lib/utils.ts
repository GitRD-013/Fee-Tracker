
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as formatDateFn, addMonths, getYear, getMonth, startOfMonth, getDate, isBefore, isEqual, differenceInCalendarMonths } from 'date-fns';
import type { Payment } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | number, dateFormat: string = 'PPP'): string {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  return formatDateFn(dateObj, dateFormat);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

export function getPaidMonths(payments: Payment[]): string[] {
  return payments.map(p => p.monthPaidFor).sort();
}

export interface DueInfo {
  dueMonths: string[]; // "YYYY-MM" of actually due & unpaid months, based on admission day
  dueMonthsCount: number;
  totalDueAmount: number;
  feeStatusLabel: string;
  feeStatusType: "success" | "warning" | "destructive" | "info" | "default";
}

export function calculateDueInfo(
  admissionDateInput: Date,
  payments: Payment[],
  monthlyFee: number,
  referenceDate: Date // This is "today's date" or the date for which we are calculating
): DueInfo {
  const defaultReturn: DueInfo = {
    dueMonths: [],
    dueMonthsCount: 0,
    totalDueAmount: 0,
    feeStatusLabel: "Error",
    feeStatusType: "default",
  };

  if (!(admissionDateInput instanceof Date) || isNaN(admissionDateInput.getTime())) {
    console.error("Invalid admissionDateInput for calculateDueInfo:", admissionDateInput);
    return { ...defaultReturn, feeStatusLabel: "Invalid Admission Date" };
  }
  if (!(referenceDate instanceof Date) || isNaN(referenceDate.getTime())) {
    console.error("Invalid referenceDate for calculateDueInfo:", referenceDate);
    return { ...defaultReturn, feeStatusLabel: "Invalid Reference Date" };
  }

  const paidMonthsSet = new Set(getPaidMonths(payments));
  const actualDueUnpaidMonths: string[] = [];
  
  const admissionDay = getDate(admissionDateInput);
  let potentialBillableMonthIterator = startOfMonth(admissionDateInput);
  const lastPossibleBillableMonthStart = startOfMonth(referenceDate);

  let paymentCycleHasStarted = false;

  while (potentialBillableMonthIterator <= lastPossibleBillableMonthStart) {
    const billableMonthYYYYMM = formatDateFn(potentialBillableMonthIterator, 'yyyy-MM');
    
    // Calculate the specific due date for this billableMonthYYYYMM
    // The due date for the fee of month M (where M's year and month_index are from potentialBillableMonthIterator)
    // is admissionDay of M+1.
    const billableMonthDateObject = new Date(
        getYear(potentialBillableMonthIterator), 
        getMonth(potentialBillableMonthIterator), 
        admissionDay
    );
    const specificDueDateForThisBillableMonth = addMonths(billableMonthDateObject, 1);

    if (isBefore(referenceDate, specificDueDateForThisBillableMonth) || isEqual(referenceDate, specificDueDateForThisBillableMonth)) {
      // If referenceDate is before or exactly on the specific due date, this month's fee is not "due" yet in the cycle.
      // However, if referenceDate is *equal* to specificDueDateForThisBillableMonth, it becomes due *on* this day.
      // The condition should be: if referenceDate < specificDueDateForThisBillableMonth, it's not due.
      // if referenceDate >= specificDueDateForThisBillableMonth, it is due.
    }

    if (isBefore(referenceDate, specificDueDateForThisBillableMonth)) {
        // This billable month's fee is not considered "due" yet based on the reference date.
    } else {
      // This billable month's fee cycle is active or has passed.
      paymentCycleHasStarted = true;
      if (!paidMonthsSet.has(billableMonthYYYYMM)) {
        actualDueUnpaidMonths.push(billableMonthYYYYMM);
      }
    }
    potentialBillableMonthIterator = addMonths(potentialBillableMonthIterator, 1);
  }

  const dueMonthsCount = actualDueUnpaidMonths.length;
  const totalDueAmount = dueMonthsCount * monthlyFee;

  let feeStatusLabel: string;
  let feeStatusType: DueInfo["feeStatusType"];

  if (dueMonthsCount === 0) {
    if (paymentCycleHasStarted) {
      feeStatusLabel = "Paid";
      feeStatusType = "success";
    } else {
      feeStatusLabel = "Not Due Yet";
      feeStatusType = "info";
    }
  } else if (dueMonthsCount === 1) {
    feeStatusLabel = "1 Month Due";
    feeStatusType = "warning";
  } else if (dueMonthsCount === 2) {
    feeStatusLabel = "2 Months Due"; // As per user's example for 2 months
    feeStatusType = "warning"; 
  } else { // 3 or more
    feeStatusLabel = `${dueMonthsCount} Months Due`;
    feeStatusType = "destructive";
  }
  
  // Sort due months for consistent display, though order of pushing should be chronological
  actualDueUnpaidMonths.sort();

  return {
    dueMonths: actualDueUnpaidMonths,
    dueMonthsCount,
    totalDueAmount,
    feeStatusLabel,
    feeStatusType,
  };
}


export const generateMonthYearOptions = (admissionDate: Date, referenceDate: Date): { value: string, label: string }[] => {
  const options: { value: string, label: string }[] = [];
  if (!(admissionDate instanceof Date) || isNaN(admissionDate.getTime())) {
    return options; 
  }
  if (!(referenceDate instanceof Date) || isNaN(referenceDate.getTime())) {
    return options;
  }

  let currentDateIterator = startOfMonth(admissionDate);
  // Generate options up to e.g., 24 months past the referenceDate's month.
  const endReferenceOptionsDate = addMonths(startOfMonth(referenceDate), 24); 

  while (currentDateIterator <= endReferenceOptionsDate) {
    const value = formatDateFn(currentDateIterator, 'yyyy-MM');
    const label = formatDateFn(currentDateIterator, 'MMMM yyyy');
    options.push({ value, label });
    currentDateIterator = addMonths(currentDateIterator, 1);
  }
  return options;
};

export function formatMonthYearString(monthYear: string): string {
  if (!monthYear || typeof monthYear !== 'string' || !monthYear.includes('-')) {
    return 'Invalid Month';
  }
  const [year, month] = monthYear.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
   if (isNaN(date.getTime())) {
    return 'Invalid Date String';
  }
  return formatDateFn(date, 'MMMM yyyy');
}
    
