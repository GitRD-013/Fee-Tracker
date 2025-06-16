
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, generateMonthYearOptions, formatMonthYearString } from '@/lib/utils';
import { CalendarIcon, Loader2, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import type { Student, Payment } from '@/types';
import { useToast } from '@/hooks/use-toast';

const paymentFormSchema = z.object({
  dateOfPayment: z.date({ required_error: "Date of payment is required." }),
  paymentMethod: z.enum(['Cash', 'Online', 'Cheque', 'Other'], { required_error: "Payment method is required." }),
  monthPaidFor: z.string().min(1, { message: "Month paid for is required." }),
  amountPaid: z.coerce.number().positive({ message: "Amount must be a positive number." }),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface EditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null; 
  payment: Payment | null; 
  onUpdatePayment: (studentId: string, paymentId: string, payment: Omit<Payment, 'id'>) => void;
  monthlyFee: number; 
  referenceDate: Date; 
}

export function EditPaymentModal({ isOpen, onClose, student, payment, onUpdatePayment, monthlyFee, referenceDate }: EditPaymentModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { 
      dateOfPayment: new Date(),
      paymentMethod: undefined,
      monthPaidFor: undefined,
      amountPaid: monthlyFee,
      notes: '',
    },
  });

  useEffect(() => {
    if (isOpen && payment && student) {
      setIsSubmitting(false);
      form.reset({
        dateOfPayment: payment.dateOfPayment instanceof Date ? payment.dateOfPayment : new Date(payment.dateOfPayment.toString()),
        paymentMethod: payment.paymentMethod,
        monthPaidFor: payment.monthPaidFor,
        amountPaid: payment.amountPaid,
        notes: payment.notes || '',
      });
    }
  }, [payment, isOpen, form, student]);


  const onSubmit = async (data: PaymentFormValues) => {
    if (!student || !payment) return;
    setIsSubmitting(true);
    try {
        await onUpdatePayment(student.id, payment.id, data );
    } finally {
        // Parent component handles closing and state reset
    }
  };

  if (!student || !payment) return null;

  const monthYearOptions = generateMonthYearOptions(
    student.admissionDate instanceof Date ? student.admissionDate : student.admissionDate.toDate(),
    referenceDate
  );


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isSubmitting) onClose(); }}>
      <DialogContent className="w-[95vw] max-w-md sm:max-w-[525px] max-h-[85vh] flex flex-col overflow-hidden p-0 rounded-lg sm:rounded-lg bg-card backdrop-blur-md border-border">
        <DialogHeader className="pt-6 px-6 pb-4 shrink-0 border-b border-border/50">
          <DialogTitle className="font-headline text-2xl text-foreground flex items-center">
            <Edit3 className="mr-2 h-6 w-6 text-primary" /> Edit Payment for {student.fullName}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update payment details for {formatMonthYearString(payment.monthPaidFor)}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="px-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="dateOfPayment"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Payment</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal bg-input border-border text-foreground hover:bg-accent hover:text-accent-foreground",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isSubmitting}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-primary" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover backdrop-blur-md" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || isSubmitting}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger className="bg-input border-border text-foreground">
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover text-popover-foreground backdrop-blur-md">
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Online">Online</SelectItem>
                          <SelectItem value="Cheque">Cheque</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthPaidFor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month Paid For</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger className="bg-input border-border text-foreground">
                            <SelectValue placeholder="Select month and year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover text-popover-foreground backdrop-blur-md max-h-60">
                          {monthYearOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amountPaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Paid (INR)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 1000" {...field} className="bg-input border-border text-foreground placeholder:text-muted-foreground" disabled={isSubmitting}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Paid by uncle, late fee waiver requested"
                          {...field}
                          className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </div>
        <DialogFooter className="px-6 py-4 border-t border-border/50 shrink-0">
          <Button type="button" variant="outline" onClick={onClose} className="border-border text-foreground hover:bg-accent hover:text-accent-foreground" disabled={isSubmitting}>Cancel</Button>
          <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
