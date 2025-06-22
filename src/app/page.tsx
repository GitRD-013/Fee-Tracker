
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { StudentTable } from "@/components/students/student-table";
import { AddStudentModal, StudentFormValues } from "@/components/students/add-student-modal";
import { AddPaymentModal } from "@/components/students/add-payment-modal";
import { EditPaymentModal } from "@/components/students/edit-payment-modal";
import { StudentDetailsModal } from "@/components/students/student-details-modal";
import type { Student, Payment, StudentRowData, StudentDocument, PaymentDocument } from "@/types";
import { calculateDueInfo, formatMonthYearString, formatDate as formatDateUtil } from '@/lib/utils';
import { UserPlus, DollarSign, PlusCircle, Banknote, CalendarX, Trash2, LogOutIcon, Loader2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format as formatDateFn } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import {
  collection, addDoc, getDocs, doc, setDoc, deleteDoc, updateDoc, Timestamp, query, orderBy, where, writeBatch
} from 'firebase/firestore';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';


const DEFAULT_MONTHLY_FEE = 1200;
const SUPABASE_BUCKET_NAME = 'profile-pictures';

export default function FeeTrackerPage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [currentStudentForPayment, setCurrentStudentForPayment] = useState<Student | null>(null);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentRowData | null>(null);

  const [isStudentDetailsModalOpen, setIsStudentDetailsModalOpen] = useState(false);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<StudentRowData | null>(null);
  const { toast } = useToast();
  const [currentDateForCalculations, setCurrentDateForCalculations] = useState<Date | null>(null);

  const [studentIdForDetailsReopen, setStudentIdForDetailsReopen] = useState<string | null>(null);
  const [modalReopenKey, setModalReopenKey] = useState(0);
  const [attemptReopenDetails, setAttemptReopenDetails] = useState(false);
  const [studentIdContextForAction, setStudentIdContextForAction] = useState<string | null>(null);


  useEffect(() => {
    setCurrentDateForCalculations(new Date());
  }, []);


  const fetchStudents = useCallback(async () => {
    if (!user) {
      setIsLoadingStudents(false);
      setStudents([]);
      return;
    }
    setIsLoadingStudents(true);
    try {
      const studentsCollectionRef = collection(db, 'students');
      const q = query(studentsCollectionRef, where("userId", "==", user.uid), orderBy("sortOrder", "asc"));
      const studentSnapshot = await getDocs(q);

      if (studentSnapshot.empty) {
        setStudents([]);
        setIsLoadingStudents(false);
        return;
      }

      let missingSortOrder = false;

      const studentProcessingPromises = studentSnapshot.docs.map(async (studentDoc, index) => {
        const studentData = studentDoc.data() as StudentDocument;
        let sortOrder = studentData.sortOrder;
        if (sortOrder === undefined || sortOrder === null) {
          sortOrder = index;
          missingSortOrder = true;
        }

        const paymentsCollectionRef = collection(db, 'students', studentDoc.id, 'payments');
        const paymentsSnapshot = await getDocs(query(paymentsCollectionRef, orderBy("dateOfPayment", "desc")));
        const paymentsListLocal: Payment[] = paymentsSnapshot.docs.map(paymentDoc => ({
          id: paymentDoc.id,
          ...paymentDoc.data(),
          dateOfPayment: (paymentDoc.data().dateOfPayment as Timestamp).toDate(),
        } as Payment));

        let profilePicUrl = studentData.profilePictureUrl || '';
         if (!profilePicUrl ||
            profilePicUrl.includes('drive.google.com') ||
            (profilePicUrl.includes('placehold.co') && !profilePicUrl.includes('supabase.co'))) {
          if (profilePicUrl && profilePicUrl.includes('supabase.co') && !profilePicUrl.includes('placehold.co')) {
            // Valid Supabase URL
          } else {
            const initial = studentData.fullName?.charAt(0)?.toUpperCase() || 'S';
            profilePicUrl = `https://placehold.co/100x100.png?text=${initial}&font=montserrat`;
          }
        }

        return {
          id: studentDoc.id,
          ...studentData,
          userId: studentData.userId,
          admissionDate: (studentData.admissionDate as Timestamp).toDate(),
          payments: paymentsListLocal,
          profilePictureUrl: profilePicUrl,
          sortOrder: sortOrder,
        } as Student;
      });

      const processedStudents = await Promise.all(studentProcessingPromises);
      processedStudents.sort((a, b) => a.sortOrder - b.sortOrder);
      setStudents(processedStudents);

      if (missingSortOrder) {
        const batch = writeBatch(db);
        processedStudents.forEach(s => {
          if (s.id) {
            const studentRef = doc(db, 'students', s.id);
            batch.update(studentRef, { sortOrder: s.sortOrder });
          }
        });
        await batch.commit();
      }

    } catch (error) {
      console.error("Error fetching students: ", error);
      toast({ title: "Error", description: "Could not fetch student data.", variant: "destructive" });
      setStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  }, [user, toast]);


  useEffect(() => {
    if (user) {
     fetchStudents();
    } else if (!authLoading) {
      setStudents([]);
      setIsLoadingStudents(false);
    }
  }, [user, fetchStudents, authLoading]);

 useEffect(() => {
    if (studentIdForDetailsReopen && students.length > 0 && !isLoadingStudents && currentDateForCalculations) {
      const studentToReopenDetailsFor = students.find(s => s.id === studentIdForDetailsReopen);
      if (studentToReopenDetailsFor) {
        const feeToUse = (studentToReopenDetailsFor.monthlyFee !== undefined && !isNaN(studentToReopenDetailsFor.monthlyFee) && studentToReopenDetailsFor.monthlyFee > 0)
                         ? studentToReopenDetailsFor.monthlyFee
                         : DEFAULT_MONTHLY_FEE;
        const admissionDateAsDate = studentToReopenDetailsFor.admissionDate instanceof Timestamp
                                    ? studentToReopenDetailsFor.admissionDate.toDate()
                                    : new Date(studentToReopenDetailsFor.admissionDate);
        const processedPayments = studentToReopenDetailsFor.payments.map(p => ({
          ...p,
          dateOfPayment: p.dateOfPayment instanceof Timestamp ? p.dateOfPayment.toDate() : new Date(p.dateOfPayment),
        }));
        const dueInfo = calculateDueInfo(admissionDateAsDate, processedPayments, feeToUse, currentDateForCalculations);
        const initial = studentToReopenDetailsFor.fullName?.charAt(0)?.toUpperCase() || 'S';
        const placeholderUrl = `https://placehold.co/100x100.png?text=${initial}&font=montserrat`;

        const fullStudentDetailsForModal: StudentRowData = {
            id: studentToReopenDetailsFor.id,
            userId: studentToReopenDetailsFor.userId,
            profilePictureUrl: studentToReopenDetailsFor.profilePictureUrl || placeholderUrl,
            fullName: studentToReopenDetailsFor.fullName,
            fatherName: studentToReopenDetailsFor.fatherName,
            className: studentToReopenDetailsFor.className,
            mobileNumber: studentToReopenDetailsFor.mobileNumber,
            studentNotes: studentToReopenDetailsFor.studentNotes,
            sortOrder: studentToReopenDetailsFor.sortOrder,
            admissionDate: admissionDateAsDate,
            monthlyFee: feeToUse,
            payments: processedPayments,
            ...dueInfo,
        };
        setModalReopenKey(prevKey => prevKey + 1);
        setSelectedStudentForDetails(fullStudentDetailsForModal);
        setAttemptReopenDetails(true);
      }
      setStudentIdForDetailsReopen(null);
    }
  }, [students, studentIdForDetailsReopen, isLoadingStudents, currentDateForCalculations]);

  useEffect(() => {
    if (attemptReopenDetails) {
      setIsStudentDetailsModalOpen(true);
      setAttemptReopenDetails(false);
    }
  }, [attemptReopenDetails]);


  const handleAddStudent = async (studentData: StudentFormValues, profilePictureFile?: File) => {
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
        return;
    }

    let profilePictureUrlToSave = '';
    const initial = studentData.fullName?.charAt(0)?.toUpperCase() || 'S';
    const placeholderUrl = `https://placehold.co/100x100.png?text=${initial}&font=montserrat`;


    if (profilePictureFile) {
      const fileExt = profilePictureFile.name.split('.').pop();
      const filePath = `${user.uid}/${Date.now()}-${studentData.fullName.replace(/\s+/g, '-')}.${fileExt}`;
      try {
        const { data: uploadResult, error: uploadError } = await supabase.storage
          .from(SUPABASE_BUCKET_NAME)
          .upload(filePath, profilePictureFile);

        if (uploadError) {
          console.error("Supabase upload error:", uploadError);
          toast({ title: "Upload Error", description: `Supabase upload error: ${uploadError.message}`, variant: "destructive" });
          profilePictureUrlToSave = placeholderUrl;
        } else if (uploadResult?.path) {
            const { data: urlData } = supabase.storage.from(SUPABASE_BUCKET_NAME).getPublicUrl(uploadResult.path);
            if (urlData?.publicUrl) {
                profilePictureUrlToSave = urlData.publicUrl;
            } else {
                console.error("Failed to get public URL from Supabase, will use placeholder.");
                toast({ title: "Upload Warning", description: `Profile picture uploaded, but could not get public URL. Using placeholder.`, variant: "default" });
                profilePictureUrlToSave = placeholderUrl;
            }
        } else {
             console.error("Supabase upload returned no path in result, will use placeholder:", uploadResult);
             toast({ title: "Upload Issue", description: "Profile picture upload did not return a valid path. Using placeholder.", variant: "default" });
             profilePictureUrlToSave = placeholderUrl;
        }
      } catch (error: any) {
        console.error("Generic error during profile picture upload to Supabase: ", error);
        if (!error.message?.includes('Supabase')) {
          toast({ title: "Upload Error", description: `Could not upload profile picture: ${error.message || 'Unknown error'}. Using placeholder.`, variant: "destructive" });
        }
        profilePictureUrlToSave = placeholderUrl;
      }
    } else {
        profilePictureUrlToSave = placeholderUrl;
    }

    const newSortOrder = students.length > 0 ? Math.max(...students.map(s => s.sortOrder), -1) + 1 : 0;

    const studentId = doc(collection(db, 'students')).id;
    if (!studentId) {
        console.error("Could not generate student ID.");
        toast({ title: "Error", description: "Could not generate student ID.", variant: "destructive" });
        return;
    }
    const studentDocData: StudentDocument = {
      userId: user.uid,
      fullName: studentData.fullName,
      fatherName: studentData.fatherName,
      className: studentData.className,
      mobileNumber: studentData.mobileNumber,
      studentNotes: studentData.studentNotes,
      admissionDate: Timestamp.fromDate(studentData.admissionDate),
      monthlyFee: Number(studentData.monthlyFee),
      profilePictureUrl: profilePictureUrlToSave,
      sortOrder: newSortOrder,
    };

    try {
      await setDoc(doc(db, 'students', studentId), studentDocData);
      toast({ title: "Student Added", description: `${studentData.fullName} has been added.` });
      fetchStudents();
    } catch (error) {
      console.error("Error adding student to Firestore: ", error);
      toast({ title: "Firestore Error", description: "Could not add student to database.", variant: "destructive" });
    }
  };

  const handleEditStudent = async (updatedStudentData: StudentFormValues & { id: string; sortOrder: number; userId: string }, profilePictureFile?: File) => {
    if (!user || !editingStudent || user.uid !== updatedStudentData.userId) {
        toast({ title: "Authorization Error", description: "You cannot edit this student.", variant: "destructive" });
        return;
    }
    let profilePictureUrlToSave = updatedStudentData.profilePictureUrl || editingStudent.profilePictureUrl || '';
    const initial = updatedStudentData.fullName?.charAt(0)?.toUpperCase() || 'S';
    const placeholderUrl = `https://placehold.co/100x100.png?text=${initial}&font=montserrat`;

    if (profilePictureUrlToSave.includes('placehold.co') && !profilePictureFile) {
        profilePictureUrlToSave = placeholderUrl;
    }

    if (profilePictureFile) {
      if (editingStudent.profilePictureUrl &&
          editingStudent.profilePictureUrl.includes('supabase.co') &&
          !editingStudent.profilePictureUrl.includes('placehold.co')
         ) {
        try {
          const supabaseBaseUrl = supabase.storage.from(SUPABASE_BUCKET_NAME).getPublicUrl('').data.publicUrl;
          const urlPrefixToRemove = `${supabaseBaseUrl}/`;
          if (editingStudent.profilePictureUrl.startsWith(urlPrefixToRemove)) {
            const oldFilePath = editingStudent.profilePictureUrl.substring(urlPrefixToRemove.length).split('?')[0];
            if (oldFilePath.startsWith(user.uid + '/')) {
              await supabase.storage.from(SUPABASE_BUCKET_NAME).remove([oldFilePath]);
            }
          }
        } catch (error) {
          console.error("Error deleting old profile picture from Supabase (edit): ", error);
          toast({ title: "Storage Warning", description: "Could not remove old profile picture from storage, but will proceed with update.", variant: "default" });
        }
      }

      const fileExt = profilePictureFile.name.split('.').pop();
      const filePath = `${user.uid}/${Date.now()}-${updatedStudentData.fullName.replace(/\s+/g, '-')}.${fileExt}`;
      try {
        const { data: uploadResult, error: uploadError } = await supabase.storage
          .from(SUPABASE_BUCKET_NAME)
          .upload(filePath, profilePictureFile);

        if (uploadError) {
            console.error("Supabase upload error (edit):", uploadError);
            toast({ title: "Upload Error", description: `Supabase upload error: ${uploadError.message}`, variant: "destructive" });
            profilePictureUrlToSave = editingStudent.profilePictureUrl || placeholderUrl;
        } else if (uploadResult?.path) {
            const { data: urlData } = supabase.storage.from(SUPABASE_BUCKET_NAME).getPublicUrl(uploadResult.path);
            if (urlData?.publicUrl) {
                profilePictureUrlToSave = urlData.publicUrl;
            } else {
                console.error("Failed to get public URL from Supabase (edit).");
                toast({ title: "Upload Warning", description: `New profile picture uploaded, but could not get public URL. Using previous/placeholder.`, variant: "default" });
                profilePictureUrlToSave = editingStudent.profilePictureUrl || placeholderUrl;
            }
        } else {
             console.error("Supabase upload returned no path in result (edit), using previous/placeholder:", uploadResult);
             toast({ title: "Upload Issue", description: "New profile picture upload did not return a valid path. Using previous/placeholder.", variant: "default" });
             profilePictureUrlToSave = editingStudent.profilePictureUrl || placeholderUrl;
        }
      } catch (error: any) {
        console.error("Generic error during new profile picture upload (edit): ", error);
         if (!error.message?.includes('Supabase')) {
             toast({ title: "Upload Error", description: `Could not upload new profile picture: ${error.message || 'Unknown error'}. Using previous/placeholder.`, variant: "destructive" });
        }
        profilePictureUrlToSave = editingStudent.profilePictureUrl || placeholderUrl;
      }
    } else if (!updatedStudentData.profilePictureUrl && editingStudent.profilePictureUrl && editingStudent.profilePictureUrl.includes('supabase.co')) {
       try {
          const supabaseBaseUrl = supabase.storage.from(SUPABASE_BUCKET_NAME).getPublicUrl('').data.publicUrl;
          const urlPrefixToRemove = `${supabaseBaseUrl}/`;
          if (editingStudent.profilePictureUrl.startsWith(urlPrefixToRemove)) {
            const oldFilePath = editingStudent.profilePictureUrl.substring(urlPrefixToRemove.length).split('?')[0];
            if (oldFilePath.startsWith(user.uid + '/')) {
                await supabase.storage.from(SUPABASE_BUCKET_NAME).remove([oldFilePath]);
            }
          }
        } catch (error) {
          console.error("Error deleting profile picture from Supabase (cleared field): ", error);
          toast({ title: "Storage Warning", description: "Could not remove old profile picture from storage.", variant: "default" });
        }
      profilePictureUrlToSave = placeholderUrl;
    } else if (!profilePictureFile && !updatedStudentData.profilePictureUrl) {
        profilePictureUrlToSave = placeholderUrl;
    }


    const studentDocRef = doc(db, 'students', updatedStudentData.id);
    try {
      await updateDoc(studentDocRef, {
        fullName: updatedStudentData.fullName,
        fatherName: updatedStudentData.fatherName,
        className: updatedStudentData.className,
        mobileNumber: updatedStudentData.mobileNumber,
        studentNotes: updatedStudentData.studentNotes,
        admissionDate: Timestamp.fromDate(new Date(updatedStudentData.admissionDate)),
        monthlyFee: Number(updatedStudentData.monthlyFee),
        profilePictureUrl: profilePictureUrlToSave,
      });
      toast({ title: "Student Updated", description: `${updatedStudentData.fullName}'s details updated.` });

      if (isAddStudentModalOpen && editingStudent?.id === updatedStudentData.id) {
        setStudentIdContextForAction(updatedStudentData.id);
      }
      fetchStudents();

      if (isAddStudentModalOpen && editingStudent?.id === updatedStudentData.id) {
        setIsAddStudentModalOpen(false);
        setEditingStudent(null);
      }

    } catch (error) {
      console.error("Error updating student in Firestore: ", error);
      toast({ title: "Error", description: "Could not update student in database.", variant: "destructive" });
      setEditingStudent(null);
      setIsAddStudentModalOpen(false);
    }
  };

  const handleSaveStudent = (
    studentData: StudentFormValues | (StudentFormValues & { id: string; userId: string; sortOrder: number }),
    profilePictureFile?: File
  ) => {
    if ('id' in studentData && 'userId' in studentData && 'sortOrder' in studentData) {
      handleEditStudent(studentData, profilePictureFile);
    } else {
      handleAddStudent(studentData as StudentFormValues, profilePictureFile);
    }
  };


  const handleAddPayment = async (studentId: string, paymentData: Omit<Payment, 'id'>) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to add a payment.", variant: "destructive" });
      return;
    }
    const studentToPay = students.find(s => s.id === studentId);
    if (!studentToPay || studentToPay.userId !== user.uid) {
        toast({ title: "Authorization Error", description: "Cannot add payment for this student.", variant: "destructive" });
        return;
    }

    let validDateOfPayment: Date;
    if (paymentData.dateOfPayment instanceof Date) {
      validDateOfPayment = paymentData.dateOfPayment;
    } else if (typeof paymentData.dateOfPayment === 'string' || typeof paymentData.dateOfPayment === 'number') {
      validDateOfPayment = new Date(paymentData.dateOfPayment);
    } else {
      const ts = paymentData.dateOfPayment as unknown as Timestamp;
      if (ts && typeof ts.toDate === 'function') {
        validDateOfPayment = ts.toDate();
      } else {
        console.error("Invalid dateOfPayment type:", paymentData.dateOfPayment);
        toast({ title: "Data Error", description: "Invalid date format for payment.", variant: "destructive" });
        return;
      }
    }

    if (isNaN(validDateOfPayment.getTime())) {
        console.error("Invalid date after conversion:", validDateOfPayment);
        toast({ title: "Data Error", description: "Invalid date provided for payment.", variant: "destructive" });
        return;
    }

    const paymentDocData: PaymentDocument = {
      dateOfPayment: Timestamp.fromDate(validDateOfPayment),
      paymentMethod: paymentData.paymentMethod,
      monthPaidFor: paymentData.monthPaidFor,
      amountPaid: Number(paymentData.amountPaid),
      notes: paymentData.notes || "",
    };

    setIsAddPaymentModalOpen(false);
    setCurrentStudentForPayment(null);

    try {
      const paymentsCollectionRef = collection(db, 'students', studentId, 'payments');
      await addDoc(paymentsCollectionRef, paymentDocData);
      toast({
        title: "Payment Added",
        description: `Payment of ₹${paymentDocData.amountPaid} for ${formatMonthYearString(paymentDocData.monthPaidFor)} recorded.`,
      });

      if (studentIdContextForAction === studentId) {
        setStudentIdForDetailsReopen(studentIdContextForAction);
      }
      fetchStudents();
      setStudentIdContextForAction(null);
    } catch (error: any) {
      console.error("Error adding payment to Firestore: ", error);
      toast({ title: "Error Adding Payment", description: error.message || "Could not add payment to database.", variant: "destructive" });
    }
  };

  const handleUpdatePayment = async (studentId: string, paymentId: string, paymentData: Omit<Payment, 'id'>) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to update a payment.", variant: "destructive" });
      return;
    }
    const studentToUpdatePaymentFor = students.find(s => s.id === studentId);
    if (!studentToUpdatePaymentFor || studentToUpdatePaymentFor.userId !== user.uid) {
        toast({ title: "Authorization Error", description: "Cannot update payment for this student.", variant: "destructive" });
        return;
    }

    let validDateOfPayment: Date;
    if (paymentData.dateOfPayment instanceof Date) {
      validDateOfPayment = paymentData.dateOfPayment;
    } else if (typeof paymentData.dateOfPayment === 'string' || typeof paymentData.dateOfPayment === 'number') {
      validDateOfPayment = new Date(paymentData.dateOfPayment);
    } else {
      const ts = paymentData.dateOfPayment as unknown as Timestamp;
      if (ts && typeof ts.toDate === 'function') {
        validDateOfPayment = ts.toDate();
      } else {
        toast({ title: "Data Error", description: "Invalid date format for payment.", variant: "destructive" });
        return;
      }
    }

    if (isNaN(validDateOfPayment.getTime())) {
        toast({ title: "Data Error", description: "Invalid date provided for payment.", variant: "destructive" });
        return;
    }

    const paymentDocRef = doc(db, 'students', studentId, 'payments', paymentId);
    const paymentDocData: Partial<PaymentDocument> = {
      dateOfPayment: Timestamp.fromDate(validDateOfPayment),
      paymentMethod: paymentData.paymentMethod,
      monthPaidFor: paymentData.monthPaidFor,
      amountPaid: Number(paymentData.amountPaid),
      notes: paymentData.notes || "",
    };

    setIsEditPaymentModalOpen(false);
    setCurrentStudentForPayment(null);
    setPaymentToEdit(null);

    try {
      await updateDoc(paymentDocRef, paymentDocData);
      toast({
        title: "Payment Updated",
        description: `Payment details for ${formatMonthYearString(paymentDocData.monthPaidFor!)} updated.`,
      });
      if (studentIdContextForAction === studentId) {
        setStudentIdForDetailsReopen(studentIdContextForAction);
      }
      fetchStudents();
      setStudentIdContextForAction(null);
    } catch (error: any) {
      console.error("Error updating payment in Firestore: ", error);
      toast({ title: "Error Updating Payment", description: error.message || "Could not update payment.", variant: "destructive" });
    }
  };

  const handleDeletePayment = async (studentId: string, paymentId: string) => {
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to delete a payment.", variant: "destructive" });
        return;
    }
    const studentForPaymentDeletion = students.find(s => s.id === studentId);
    if (!studentForPaymentDeletion || studentForPaymentDeletion.userId !== user.uid) {
        toast({ title: "Authorization Error", description: "Cannot delete payment for this student.", variant: "destructive" });
        return;
    }

    const paymentDocRef = doc(db, 'students', studentId, 'payments', paymentId);
    try {
        await deleteDoc(paymentDocRef);
        toast({ title: "Payment Deleted", description: "The payment record has been removed.", variant: "destructive" });
        setStudentIdForDetailsReopen(studentId);
        fetchStudents();
    } catch (error) {
        console.error("Error deleting payment: ", error);
        toast({ title: "Error", description: "Could not delete payment record.", variant: "destructive" });
    }
  };


  const openAddPaymentModalFromTable = (student: StudentRowData) => {
    if (!user || !currentDateForCalculations) return;
    const studentToUse = students.find(s => s.id === student.id && s.userId === user.uid);
    if (studentToUse) {
      setCurrentStudentForPayment(studentToUse);
      setStudentIdForDetailsReopen(null);
      setStudentIdContextForAction(null);
      setIsAddPaymentModalOpen(true);
    } else {
        toast({title: "Error", description: "Student not found or access denied.", variant: "destructive"});
    }
  };

  const openEditStudentModalFromTable = (student: StudentRowData) => {
    if (!user) return;
    const studentToUse = students.find(s => s.id === student.id && s.userId === user.uid);
    if (studentToUse) {
      setEditingStudent(studentToUse);
      setStudentIdForDetailsReopen(null);
      setStudentIdContextForAction(null);
      setIsAddStudentModalOpen(true);
    } else {
       toast({title: "Error", description: "Student not found or access denied for editing.", variant: "destructive"});
    }
  };


  const openDeleteDialog = (student: StudentRowData) => {
    if (!user || student.userId !== user.uid) {
        toast({title: "Error", description: "Cannot delete this student.", variant: "destructive"});
        return;
    }
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete || !user || studentToDelete.userId !== user.uid) {
        toast({title: "Error", description: "Deletion criteria not met.", variant: "destructive"});
        setIsDeleteDialogOpen(false);
        setStudentToDelete(null);
        return;
    }
    try {
      if (studentToDelete.profilePictureUrl &&
          studentToDelete.profilePictureUrl.includes('supabase.co') &&
          !studentToDelete.profilePictureUrl.includes('placehold.co')
         ) {
        const supabaseBaseUrl = supabase.storage.from(SUPABASE_BUCKET_NAME).getPublicUrl('').data.publicUrl;
        const urlPrefixToRemove = `${supabaseBaseUrl}/`;
          if (studentToDelete.profilePictureUrl.startsWith(urlPrefixToRemove)) {
            const filePath = studentToDelete.profilePictureUrl.substring(urlPrefixToRemove.length).split('?')[0];
            if (filePath && filePath.startsWith(user.uid + '/')) {
              const { error: deleteError } = await supabase.storage.from(SUPABASE_BUCKET_NAME).remove([filePath]);
              if (deleteError) {
                console.error("Error deleting profile picture from Supabase (on student delete): ", deleteError);
                toast({ title: "Storage Error", description: "Could not delete profile picture from storage, but will remove student record.", variant: "warning" });
              }
            } else if (filePath) {
                console.warn("Attempted to delete a file path not belonging to the current user:", filePath);
            }
        }
      }

      const paymentsCollectionRef = collection(db, 'students', studentToDelete.id, 'payments');
      const paymentsSnapshot = await getDocs(paymentsCollectionRef);
      const batch = writeBatch(db);
      paymentsSnapshot.docs.forEach(docSnap => batch.delete(docSnap.ref));

      batch.delete(doc(db, 'students', studentToDelete.id));
      await batch.commit();

      toast({ title: "Student Deleted", description: `${studentToDelete.fullName} has been removed.`, variant: "destructive" });
      fetchStudents();
    } catch (error) {
      console.error("Error deleting student: ", error);
      toast({ title: "Error", description: "Could not delete student.", variant: "destructive" });
    }
    setIsDeleteDialogOpen(false);
    setStudentToDelete(null);
  };

  const openStudentDetailsModalFromTable = (studentRow: StudentRowData) => {
    if (!user || studentRow.userId !== user.uid || !currentDateForCalculations) {
        toast({title: "Error", description: "Cannot view details for this student or date not ready.", variant: "destructive"});
        return;
    }
    const fullStudentData = students.find(s => s.id === studentRow.id);
    if (fullStudentData) {
      const feeToUse = (fullStudentData.monthlyFee !== undefined && !isNaN(fullStudentData.monthlyFee) && fullStudentData.monthlyFee > 0)
                       ? fullStudentData.monthlyFee
                       : DEFAULT_MONTHLY_FEE;

      const admissionDateAsDate = fullStudentData.admissionDate instanceof Timestamp
                                  ? fullStudentData.admissionDate.toDate()
                                  : new Date(fullStudentData.admissionDate);

      const processedPayments = fullStudentData.payments.map(p => ({
        ...p,
        dateOfPayment: p.dateOfPayment instanceof Timestamp ? p.dateOfPayment.toDate() : new Date(p.dateOfPayment),
      }));

      const dueInfo = calculateDueInfo(admissionDateAsDate, processedPayments, feeToUse, currentDateForCalculations);

      const initial = fullStudentData.fullName?.charAt(0)?.toUpperCase() || 'S';
      const placeholderUrl = `https://placehold.co/100x100.png?text=${initial}&font=montserrat`;

      setSelectedStudentForDetails({
        ...fullStudentData,
        id: fullStudentData.id,
        userId: fullStudentData.userId,
        profilePictureUrl: fullStudentData.profilePictureUrl || placeholderUrl,
        fullName: fullStudentData.fullName,
        fatherName: fullStudentData.fatherName,
        className: fullStudentData.className,
        mobileNumber: fullStudentData.mobileNumber,
        studentNotes: fullStudentData.studentNotes,
        sortOrder: fullStudentData.sortOrder,
        admissionDate: admissionDateAsDate,
        monthlyFee: feeToUse,
        payments: processedPayments,
        ...dueInfo,
      });
      setStudentIdContextForAction(null);
      setIsStudentDetailsModalOpen(true);
    } else {
        const admissionDateAsDate = studentRow.admissionDate instanceof Timestamp
                                    ? studentRow.admissionDate.toDate()
                                    : new Date(studentRow.admissionDate);
        const feeToUse = (studentRow.monthlyFee !== undefined && !isNaN(studentRow.monthlyFee) && studentRow.monthlyFee > 0)
                         ? studentRow.monthlyFee
                         : DEFAULT_MONTHLY_FEE;
        const processedStudentRowPayments = (studentRow.payments || []).map(p => ({
            ...p,
             dateOfPayment: p.dateOfPayment instanceof Timestamp ? p.dateOfPayment.toDate() : new Date(p.dateOfPayment),
        }));
        const dueInfo = calculateDueInfo(admissionDateAsDate, processedStudentRowPayments, feeToUse, currentDateForCalculations);
        const initial = studentRow.fullName?.charAt(0)?.toUpperCase() || 'S';
        const placeholderUrl = `https://placehold.co/100x100.png?text=${initial}&font=montserrat`;
        setSelectedStudentForDetails({
            ...studentRow,
             id: studentRow.id,
             userId: studentRow.userId,
             profilePictureUrl: studentRow.profilePictureUrl || placeholderUrl,
             fullName: studentRow.fullName,
             fatherName: studentRow.fatherName,
             className: studentRow.className,
             mobileNumber: studentRow.mobileNumber,
             studentNotes: studentRow.studentNotes,
             sortOrder: studentRow.sortOrder,
            admissionDate: admissionDateAsDate,
            monthlyFee: feeToUse,
            payments: processedStudentRowPayments,
            ...dueInfo
        });
        setStudentIdContextForAction(null);
        setIsStudentDetailsModalOpen(true);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!user || !active || !over || active.id === over.id) return;

      setStudents((currentStudents) => {
        const oldIndex = currentStudents.findIndex((s) => s.id === active.id && s.userId === user.uid);
        const newIndex = currentStudents.findIndex((s) => s.id === over.id && s.userId === user.uid);

        if (oldIndex === -1 || newIndex === -1) {
          console.error("Could not find student for drag and drop operation or permission denied.");
          return currentStudents;
        }

        let newOrderStudents = arrayMove(currentStudents, oldIndex, newIndex);

        newOrderStudents = newOrderStudents.map((student, index) => ({
          ...student,
          sortOrder: index,
        }));

        const batch = writeBatch(db);
        newOrderStudents.forEach((student) => {
          if (student.id && typeof student.id === 'string' && student.userId === user.uid) {
            const studentRef = doc(db, 'students', student.id);
            batch.update(studentRef, { sortOrder: student.sortOrder });
          } else {
            console.warn("Skipping student update in batch due to missing ID or mismatched user:", student);
          }
        });

        batch.commit()
          .then(() => {
            toast({ title: "Order Saved", description: "Student order updated successfully." });
          })
          .catch((error) => {
            console.error("Error updating student order: ", error);
            toast({ title: "Error", description: "Could not save student order.", variant: "destructive" });
            fetchStudents();
          });
        return newOrderStudents;
      });
  };

  const studentRowData: StudentRowData[] = useMemo(() => {
    if (!user || !currentDateForCalculations) return [];
    return students
      .filter(student => student.userId === user.uid)
      .map(student => {
      const feeToUse = (student.monthlyFee !== undefined && !isNaN(student.monthlyFee) && student.monthlyFee > 0)
                       ? student.monthlyFee
                       : DEFAULT_MONTHLY_FEE;

      const admissionDateAsDate = student.admissionDate instanceof Timestamp
                                  ? student.admissionDate.toDate()
                                  : new Date(student.admissionDate);

      const processedPayments = student.payments.map(p => ({
        ...p,
        dateOfPayment: p.dateOfPayment instanceof Timestamp ? p.dateOfPayment.toDate() : new Date(p.dateOfPayment)
      }));

      const dueInfo = calculateDueInfo(admissionDateAsDate, processedPayments, feeToUse, currentDateForCalculations);

      const initial = student.fullName?.charAt(0)?.toUpperCase() || 'S';
      const placeholderUrl = `https://placehold.co/100x100.png?text=${initial}&font=montserrat`;

      return {
        id: student.id,
        userId: student.userId,
        profilePictureUrl: student.profilePictureUrl || placeholderUrl,
        fullName: student.fullName,
        fatherName: student.fatherName,
        className: student.className,
        mobileNumber: student.mobileNumber,
        studentNotes: student.studentNotes,
        sortOrder: student.sortOrder,
        admissionDate: admissionDateAsDate,
        monthlyFee: feeToUse,
        payments: processedPayments,
        ...dueInfo,
      };
    }).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [students, user, currentDateForCalculations]);

  const totalStudents = studentRowData.length;

  const studentsWithOutstandingDuesCount = useMemo(() => {
    return studentRowData.filter(student => student.totalDueAmount > 0).length;
  }, [studentRowData]);

  const totalPaidAmount = useMemo(() => {
    if (!user) return 0;
    return students
      .filter(student => student.userId === user.uid)
      .reduce((total, student) => {
      return total + student.payments.reduce((studentTotal, payment) => studentTotal + Number(payment.amountPaid), 0);
    }, 0);
  }, [students, user]);

  const totalDueAmountGlobal = studentRowData.reduce((sum, s) => sum + s.totalDueAmount, 0);


  const feeForPaymentModal = useMemo(() => {
    if (!user || !currentDateForCalculations) return DEFAULT_MONTHLY_FEE;
    const studentForModal = currentStudentForPayment && currentStudentForPayment.userId === user.uid
                           ? students.find(s => s.id === (currentStudentForPayment?.id))
                           : null;
    if (studentForModal) {
      return (studentForModal.monthlyFee !== undefined && !isNaN(studentForModal.monthlyFee) && studentForModal.monthlyFee > 0)
             ? studentForModal.monthlyFee
             : DEFAULT_MONTHLY_FEE;
    }
    return DEFAULT_MONTHLY_FEE;
  }, [currentStudentForPayment, students, user, currentDateForCalculations]);

  if (authLoading || !currentDateForCalculations) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const handleCloseStudentDetailsModal = () => {
    setIsStudentDetailsModalOpen(false);
    setSelectedStudentForDetails(null);
  };

  const handleTriggerEditStudent = (student: StudentRowData) => {
    const studentToEdit = students.find(s => s.id === student.id);
    if (studentToEdit) {
      setEditingStudent(studentToEdit);
      setIsStudentDetailsModalOpen(false);
      setSelectedStudentForDetails(null);
      requestAnimationFrame(() => {
          setIsAddStudentModalOpen(true);
      });
    }
  };

  const handleTriggerAddPayment = (studentData: StudentRowData, originatingStudentId: string) => {
    const studentToPayFor = students.find(s => s.id === studentData.id);
    if (studentToPayFor && currentDateForCalculations) {
        setCurrentStudentForPayment(studentToPayFor);
        setStudentIdContextForAction(originatingStudentId);
        setIsStudentDetailsModalOpen(false);
        setSelectedStudentForDetails(null);
        requestAnimationFrame(() => {
           setIsAddPaymentModalOpen(true);
        });
    } else {
        toast({ title: "Error", description: "Student data not found for payment.", variant: "destructive" });
    }
  };

  const handleTriggerEditPayment = (student: StudentRowData, payment: Payment) => {
    const studentToEditPaymentFor = students.find(s => s.id === student.id);
    if (studentToEditPaymentFor && currentDateForCalculations) {
        setCurrentStudentForPayment(studentToEditPaymentFor);
        setPaymentToEdit(payment);
        setStudentIdContextForAction(student.id);
        setIsStudentDetailsModalOpen(false);
        setSelectedStudentForDetails(null);
        requestAnimationFrame(() => {
          setIsEditPaymentModalOpen(true);
        });
    } else {
        toast({title: "Error", description: "Student data not found for editing payment.", variant: "destructive"});
    }
  };


  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <header className="flex items-center justify-between p-4 border-b border-border/50">
        <h1 className="font-headline text-2xl md:text-3xl font-bold text-foreground">
            Fee Management
        </h1>
        {user && (
          <Button onClick={signOut} variant="outline" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
            <LogOutIcon className="mr-2 h-5 w-5" /> Logout
          </Button>
        )}
      </header>

      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto pt-6 md:pt-8 lg:pt-10 custom-scrollbar">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
            </div>
            <div className="flex items-center gap-2">
                 <Button
                    onClick={() => {
                        setEditingStudent(null);
                        setStudentIdContextForAction(null);
                        setIsAddStudentModalOpen(true);
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md text-base py-3 px-6 transition-all duration-200 ease-in-out hover:scale-105"
                    disabled={!user}
                >
                    <PlusCircle className="mr-2 h-5 w-5" /> Add Student
                </Button>
            </div>
        </div>

        {(isLoadingStudents || authLoading) && !students.length ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-3 text-lg">Loading student data...</p>
          </div>
        ) : !user ? (
            <div className="flex justify-center items-center h-64">
                <p className="text-lg text-muted-foreground">Please log in to manage student fees.</p>
            </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card className="shadow-lg bg-card-glass-purple backdrop-blur-md border border-card-glass-purple-border hover:shadow-[0_0_15px_3px_hsl(var(--card-glass-purple-shadow))] transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-glass-purple-foreground">Total Students</CardTitle>
                  <Users className="h-5 w-5 text-card-glass-purple-foreground opacity-70" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-card-glass-purple-foreground">{totalStudents}</div>
                </CardContent>
              </Card>
              <Card className="shadow-lg bg-card-glass-blue backdrop-blur-md border border-card-glass-blue-border hover:shadow-[0_0_15px_3px_hsl(var(--card-glass-blue-shadow))] transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-glass-blue-foreground">Students With Dues</CardTitle>
                  <CalendarX className="h-5 w-5 text-card-glass-blue-foreground opacity-70" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-card-glass-blue-foreground">{studentsWithOutstandingDuesCount}</div>
                  {currentDateForCalculations && <p className="text-xs text-card-glass-blue-foreground/80">as of {formatDateFn(currentDateForCalculations, 'dd MMM yyyy')}</p>}
                </CardContent>
              </Card>
              <Card className="shadow-lg bg-card-glass-green backdrop-blur-md border border-card-glass-green-border hover:shadow-[0_0_15px_3px_hsl(var(--card-glass-green-shadow))] transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-glass-green-foreground">Total Paid Amount</CardTitle>
                  <Banknote className="h-5 w-5 text-card-glass-green-foreground opacity-70" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-card-glass-green-foreground">₹{totalPaidAmount.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card className="shadow-lg bg-card-glass-red backdrop-blur-md border border-card-glass-red-border hover:shadow-[0_0_15px_3px_hsl(var(--card-glass-red-shadow))] transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-glass-red-foreground">Total Due Amount</CardTitle>
                  <DollarSign className="h-5 w-5 text-card-glass-red-foreground opacity-70" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-card-glass-red-foreground">₹{totalDueAmountGlobal.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            <main className="bg-card p-6 rounded-lg shadow-xl border border-foreground/20">
               <StudentTable
                  data={studentRowData}
                  onAddPayment={openAddPaymentModalFromTable}
                  onEditStudent={openEditStudentModalFromTable}
                  onDeleteStudent={openDeleteDialog}
                  onViewDetails={openStudentDetailsModalFromTable}
                  onDragEnd={handleDragEnd}
                  setStudents={setStudents as React.Dispatch<React.SetStateAction<StudentRowData[]>>}
                />
            </main>
          </>
        )}

        <AddStudentModal
          isOpen={isAddStudentModalOpen}
          onClose={() => {
              setIsAddStudentModalOpen(false);
              setEditingStudent(null);
              if (studentIdContextForAction) {
                setStudentIdForDetailsReopen(studentIdContextForAction);
                setStudentIdContextForAction(null);
              }
          }}
          onSaveStudent={handleSaveStudent}
          editingStudent={editingStudent}
          defaultMonthlyFee={DEFAULT_MONTHLY_FEE}
        />

        {currentStudentForPayment && currentDateForCalculations && (
          <AddPaymentModal
            isOpen={isAddPaymentModalOpen}
            onClose={() => {
                setIsAddPaymentModalOpen(false);
                setCurrentStudentForPayment(null);
                if (studentIdContextForAction) {
                   setStudentIdForDetailsReopen(studentIdContextForAction);
                   setStudentIdContextForAction(null);
                }
            }}
            student={currentStudentForPayment}
            onAddPayment={handleAddPayment}
            monthlyFee={feeForPaymentModal}
            referenceDate={currentDateForCalculations}
          />
        )}

        {currentStudentForPayment && paymentToEdit && currentDateForCalculations && (
          <EditPaymentModal
            isOpen={isEditPaymentModalOpen}
            onClose={() => {
                setIsEditPaymentModalOpen(false);
                setCurrentStudentForPayment(null);
                setPaymentToEdit(null);
                if (studentIdContextForAction) {
                   setStudentIdForDetailsReopen(studentIdContextForAction);
                   setStudentIdContextForAction(null);
                }
            }}
            student={currentStudentForPayment}
            payment={paymentToEdit}
            onUpdatePayment={handleUpdatePayment}
            monthlyFee={feeForPaymentModal}
            referenceDate={currentDateForCalculations}
          />
        )}

        {isStudentDetailsModalOpen && selectedStudentForDetails && (
             <StudentDetailsModal
                key={selectedStudentForDetails ? `${selectedStudentForDetails.id}-${modalReopenKey}` : `details-modal-${modalReopenKey}`}
                isOpen={isStudentDetailsModalOpen}
                onClose={handleCloseStudentDetailsModal}
                studentRow={selectedStudentForDetails}
                onTriggerEditStudent={handleTriggerEditStudent}
                onTriggerAddPayment={handleTriggerAddPayment}
                onTriggerEditPayment={handleTriggerEditPayment}
                onDeletePayment={handleDeletePayment}
            />
        )}


        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="bg-card backdrop-blur-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this student?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This action cannot be undone. This will permanently delete the student record for <span className="font-semibold text-foreground">{studentToDelete?.fullName}</span> and all associated payment history and profile picture.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setStudentToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <footer className="text-center py-6 mt-8 text-sm text-muted-foreground">
          Fee Management &copy; {currentDateForCalculations ? formatDateUtil(currentDateForCalculations, 'yyyy') : new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}

