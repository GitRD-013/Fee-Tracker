
"use client";

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter as AlertDialogFooterNested, // Renamed to avoid conflict
  AlertDialogHeader as AlertDialogHeaderNested, // Renamed to avoid conflict
  AlertDialogTitle as AlertDialogTitleNested,   // Renamed to avoid conflict
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { StudentRowData, Payment as PaymentType, StudentDetailsModalProps as ModalProps } from '@/types';
import { formatDate, formatCurrency, formatMonthYearString } from '@/lib/utils';
import { UserCircle2, CalendarDays, Phone, IndianRupee, FileText, ListChecks, Info, Edit3, PlusCircle, Pencil, Trash2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';


const monthBadgeColorClasses = [
  'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30',
  'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30',
  'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
  'bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30',
  'bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/30',
  'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  'bg-lime-500/20 text-lime-700 dark:text-lime-300 border-lime-500/30',
  'bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30',
  'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  'bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/30',
  'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30',
];

type BadgeVariant = "statusSuccess" | "statusWarning" | "statusDestructive" | "outline" | "secondary";

const getBadgeVariantForStatus = (statusType: StudentRowData['feeStatusType']): BadgeVariant => {
  switch (statusType) {
    case 'success': return 'statusSuccess';
    case 'warning': return 'statusWarning';
    case 'destructive': return 'statusDestructive';
    case 'info': return 'outline';
    default: return 'secondary';
  }
};

const getBadgeCustomClassesForStatus = (statusType: StudentRowData['feeStatusType']): string => {
    switch (statusType) {
      case 'success': return "bg-badge-status-success-background text-badge-status-success-foreground";
      case 'warning': return "bg-badge-status-warning-background text-badge-status-warning-foreground";
      case 'destructive': return "bg-badge-status-destructive-background text-badge-status-destructive-foreground";
      case 'info': return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/30";
      default: return "bg-secondary text-secondary-foreground";
    }
};


export function StudentDetailsModal({
    isOpen,
    onClose,
    studentRow,
    onTriggerEditStudent,
    onTriggerAddPayment,
    onTriggerEditPayment,
    onDeletePayment
}: ModalProps) {
  const [isDeletePaymentDialogOpen, setIsDeletePaymentDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentType | null>(null);
  const { toast } = useToast();

  const placeholderBase = `https://placehold.co/64x64.png?font=montserrat&text=`;
  const initials = studentRow?.fullName ? studentRow.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'S';
  const fallbackSrc = `${placeholderBase}${initials}`;

  const [currentAvatarSrc, setCurrentAvatarSrc] = useState(studentRow?.profilePictureUrl || fallbackSrc);

  useEffect(() => {
    const newDisplaySrc = studentRow?.profilePictureUrl || fallbackSrc;
    if (newDisplaySrc !== currentAvatarSrc) {
      setCurrentAvatarSrc(newDisplaySrc);
    }
  }, [studentRow?.profilePictureUrl, fallbackSrc, currentAvatarSrc, isOpen]);

  const handleAvatarError = () => {
    if (currentAvatarSrc !== fallbackSrc) {
      setCurrentAvatarSrc(fallbackSrc);
    }
  };

  const openDeletePaymentDialog = (payment: PaymentType) => {
    setPaymentToDelete(payment);
    setIsDeletePaymentDialogOpen(true);
  };

  const handleConfirmDeletePayment = async () => {
    if (!studentRow || !paymentToDelete) {
      toast({ title: "Error", description: "Cannot delete payment. Student or payment data missing.", variant: "destructive" });
      return;
    }
    try {
      await onDeletePayment(studentRow.id, paymentToDelete.id);
    } catch (error) {
      console.error("Error in modal while confirming delete payment:", error);
    } finally {
      setIsDeletePaymentDialogOpen(false);
      setPaymentToDelete(null);
    }
  };


  if (!studentRow) return null;

  const unoptimizedAvatar = currentAvatarSrc.includes('drive.google.com') || currentAvatarSrc.includes('supabase.co') || currentAvatarSrc.startsWith('blob:');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-2xl max-h-[85vh] p-0 flex flex-col bg-card backdrop-blur-md border-border rounded-lg sm:rounded-lg overflow-hidden">
            <DialogHeader className="pt-6 px-6 pb-4 shrink-0 border-b border-border/50">
            <div className="flex items-center space-x-3">
                <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarImage asChild>
                    <Image
                    src={currentAvatarSrc}
                    alt={studentRow.fullName}
                    width={64}
                    height={64}
                    className="object-cover rounded-full"
                    onError={handleAvatarError}
                    unoptimized={unoptimizedAvatar}
                    data-ai-hint="student portrait placeholder"
                    />
                </AvatarImage>
                <AvatarFallback className="text-xl bg-secondary text-secondary-foreground">
                    {initials}
                </AvatarFallback>
                </Avatar>
                <div className="text-left">
                <DialogTitle className="font-headline text-2xl text-foreground">{studentRow.fullName}</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                    Class {studentRow.className} &bull; Father: {studentRow.fatherName}
                </DialogDescription>
                </div>
            </div>
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <div className="px-6 py-4 space-y-6">
                    <section>
                    <h3 className="text-lg font-semibold text-primary mb-2 flex items-center"><UserCircle2 className="mr-2 h-5 w-5" />Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <div className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" />Mobile: <span className="ml-1 font-medium text-foreground">{studentRow.mobileNumber}</span></div>
                        <div className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />Admission: <span className="ml-1 font-medium text-foreground">{formatDate(studentRow.admissionDate as Date, "dd MMM yyyy")}</span></div>
                        <div className="flex items-center"><IndianRupee className="mr-2 h-4 w-4 text-muted-foreground" />Monthly Fee: <span className="ml-1 font-medium text-foreground">{formatCurrency(studentRow.monthlyFee)}</span></div>
                    </div>
                    {studentRow.studentNotes && (
                        <div className="mt-4">
                        <p className="text-xs text-muted-foreground flex items-start"><FileText className="mr-2 h-4 w-4 mt-0.5 shrink-0" />Notes:</p>
                        <p className="text-sm bg-secondary/50 p-2 rounded-md whitespace-pre-wrap text-foreground mt-1.5">{studentRow.studentNotes}</p>
                        </div>
                    )}
                    </section>

                    <Separator className="bg-border/50"/>

                    <section>
                    <h3 className="text-lg font-semibold text-primary mb-3 flex items-center"><Info className="mr-2 h-5 w-5" />Fee Status</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div>
                        Status:
                        <Badge
                            variant={getBadgeVariantForStatus(studentRow.feeStatusType)}
                            className={`ml-1 text-xs px-2.5 py-1 leading-none ${getBadgeCustomClassesForStatus(studentRow.feeStatusType)}`}
                        >
                            {studentRow.feeStatusLabel}
                        </Badge>
                        </div>
                        {studentRow.totalDueAmount > 0 && studentRow.feeStatusType !== 'info' && (
                        <div>
                            Total Due: <span className={`font-semibold text-destructive`}>{formatCurrency(studentRow.totalDueAmount)}</span>
                        </div>
                        )}
                    </div>
                    {studentRow.dueMonths.length > 0 && studentRow.feeStatusType !== 'info' && (
                        <div className="mt-2">
                        <p className="text-xs text-muted-foreground">Due for months:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {studentRow.dueMonths.map((monthStr, index) => (
                            <Badge
                                key={monthStr}
                                variant="outline"
                                className={`text-xs px-1.5 py-0.5 rounded-full border ${monthBadgeColorClasses[index % monthBadgeColorClasses.length]}`}
                            >
                                {formatMonthYearString(monthStr)}
                            </Badge>
                            ))}
                        </div>
                        </div>
                    )}
                    </section>

                    <Separator className="bg-border/50"/>

                    <section>
                    <h3 className="text-lg font-semibold text-primary mb-3 flex items-center"><ListChecks className="mr-2 h-5 w-5" />Payment History</h3>
                    {studentRow.payments.length > 0 ? (
                        <div className="border border-table-border rounded-md overflow-hidden">
                        <Table className="text-xs">
                            <TableHeader className="bg-table-header">
                            <TableRow className="border-table-border">
                                <TableHead className="h-9 text-table-header-foreground">DATE</TableHead>
                                <TableHead className="h-9 text-table-header-foreground">MONTH PAID</TableHead>
                                <TableHead className="h-9 text-right text-table-header-foreground">AMOUNT</TableHead>
                                <TableHead className="h-9 text-table-header-foreground">METHOD</TableHead>
                                <TableHead className="h-9 text-table-header-foreground">NOTES</TableHead>
                                <TableHead className="h-9 text-table-header-foreground text-center">ACTIONS</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {studentRow.payments.map((payment: PaymentType) => (
                                <TableRow key={payment.id} className="border-table-border">
                                <TableCell className="text-foreground">{formatDate(payment.dateOfPayment as Date, 'dd MMM yyyy')}</TableCell>
                                <TableCell className="text-foreground">{formatMonthYearString(payment.monthPaidFor)}</TableCell>
                                <TableCell className="text-right font-medium text-foreground">{formatCurrency(payment.amountPaid)}</TableCell>
                                <TableCell><Badge variant="secondary" className="text-xs bg-secondary text-secondary-foreground">{payment.paymentMethod}</Badge></TableCell>
                                <TableCell className="text-foreground">
                                    {payment.notes && (
                                        <div className="max-w-[150px] truncate" title={payment.notes}>{payment.notes}</div>
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                                    onClick={() => onTriggerEditPayment(studentRow, payment)}
                                    >
                                    <Pencil className="h-3.5 w-3.5" />
                                    <span className="sr-only">Edit Payment</span>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                      onClick={() => openDeletePaymentDialog(payment)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span className="sr-only">Delete Payment</span>
                                    </Button>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground p-4 border border-dashed border-border rounded-md flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                            <span>No payments recorded. If you've just added a payment, it will appear shortly or upon reopening this view.</span>
                        </div>
                    )}
                    </section>
                </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border/50 flex flex-col space-y-3 sm:flex-row sm:justify-end sm:space-x-3 sm:items-center shrink-0">
                <DialogClose asChild>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="w-full sm:w-auto border-border text-foreground hover:bg-accent hover:text-accent-foreground sm:self-center"
                    >
                        Close
                    </Button>
                </DialogClose>
                <Button
                    variant="outline"
                    onClick={() => onTriggerEditStudent(studentRow)}
                    className="w-full sm:w-auto border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                    <Edit3 className="mr-2 h-4 w-4" /> Edit Student
                </Button>
                <Button
                    variant="default"
                    onClick={() => onTriggerAddPayment(studentRow, studentRow.id)}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Payment
                </Button>
            </DialogFooter>

        <AlertDialog open={isDeletePaymentDialogOpen} onOpenChange={setIsDeletePaymentDialogOpen}>
          <AlertDialogContent className="bg-card backdrop-blur-md rounded-lg">
            <AlertDialogHeaderNested>
              <AlertDialogTitleNested>Delete Payment Record?</AlertDialogTitleNested>
              <AlertDialogDescription className="text-muted-foreground">
                Are you sure you want to delete the payment of <span className="font-semibold text-foreground">{formatCurrency(paymentToDelete?.amountPaid || 0)}</span> for <span className="font-semibold text-foreground">{formatMonthYearString(paymentToDelete?.monthPaidFor || '')}</span>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeaderNested>
            <AlertDialogFooterNested>
              <AlertDialogCancel onClick={() => { setIsDeletePaymentDialogOpen(false); setPaymentToDelete(null); }}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeletePayment}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Payment
              </AlertDialogAction>
            </AlertDialogFooterNested>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
    
