
import { Timestamp } from 'firebase/firestore';
import type { DueInfo as UtilDueInfo } from '@/lib/utils';

export interface Payment {
  id: string;
  dateOfPayment: Date | Timestamp;
  paymentMethod: 'Cash' | 'Online' | 'Cheque' | 'Other';
  monthPaidFor: string;
  amountPaid: number;
  notes?: string;
}

export interface Student {
  id: string;
  userId: string;
  profilePictureUrl: string;
  fullName: string;
  fatherName: string;
  className: string;
  mobileNumber: string;
  admissionDate: Date | Timestamp;
  monthlyFee: number;
  studentNotes?: string;
  payments: Payment[];
  sortOrder: number;
}

export interface StudentRowData extends Omit<Student, 'payments' | 'admissionDate'>, UtilDueInfo {
  admissionDate: Date;
  payments: Payment[];
}

export interface StudentDocument extends Omit<Student, 'id' | 'payments'> {
  userId: string;
  admissionDate: Timestamp;
  sortOrder: number;
}

export interface PaymentDocument extends Omit<Payment, 'id'> {
  dateOfPayment: Timestamp;
}

// Props for StudentDetailsModal
export interface StudentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void; // Called for simple closing (e.g., 'X' button or overlay click)
  studentRow: StudentRowData | null;
  // fetchStudentData?: () => void; // This seems unused, can be removed if confirmed
  onTriggerEditStudent: (student: StudentRowData) => void; // Parent handles closing this modal & opening edit student
  onTriggerAddPayment: (student: StudentRowData, originatingStudentId: string) => void; // Parent handles closing this modal & opening add payment
  onTriggerEditPayment: (student: StudentRowData, payment: Payment) => void; // Parent handles closing this modal & opening edit payment
  onDeletePayment: (studentId: string, paymentId: string) => Promise<void>;
}

