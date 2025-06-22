
"use client";

import React, { useEffect, useState, ChangeEvent, useRef } from 'react';
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
import { cn } from '@/lib/utils';
import { CalendarIcon, UserPlus, UploadCloud, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Student, StudentDocument } from '@/types';
import Image from 'next/image';

const studentFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  fatherName: z.string().min(2, { message: "Father's name must be at least 2 characters." }),
  className: z.string().min(1, { message: "Class is required." }),
  mobileNumber: z.string().regex(/^\d{10}$/, { message: "Mobile number must be 10 digits." }),
  admissionDate: z.date({ required_error: "Admission date is required." }),
  monthlyFee: z.coerce
    .number({ invalid_type_error: "Monthly fee must be a valid number." })
    .positive({ message: "Monthly fee must be a positive number." }),
  studentNotes: z.string().optional(),
  profilePictureUrl: z.string().optional(),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveStudent: (
    studentData: StudentFormValues | (StudentFormValues & { id: string; userId: string; sortOrder: number }),
    profilePictureFile?: File
  ) => void;
  editingStudent: (Omit<Student, 'payments' | 'userId' | 'sortOrder'> & Partial<Pick<Student, 'userId' | 'sortOrder'>> & { id: string, admissionDate: Date | string, monthlyFee: number | string, profilePictureUrl?: string, userId?: string, sortOrder?: number }) | null;
  defaultMonthlyFee: number;
}

const classOptions = Array.from({ length: 12 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `Class ${i + 1}`,
}));

export function AddStudentModal({ isOpen, onClose, onSaveStudent, editingStudent, defaultMonthlyFee }: AddStudentModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      profilePictureUrl: '',
      fullName: '',
      fatherName: '',
      className: '',
      mobileNumber: '',
      admissionDate: new Date(),
      monthlyFee: defaultMonthlyFee,
      studentNotes: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setIsSaving(false);
      setSelectedFile(null);
      if (editingStudent) {
        form.reset({
          ...editingStudent,
          admissionDate: new Date(editingStudent.admissionDate as Date),
          monthlyFee: Number(editingStudent.monthlyFee) || defaultMonthlyFee,
          profilePictureUrl: editingStudent.profilePictureUrl || '',
        });
        setImagePreview(editingStudent.profilePictureUrl || null);
      } else {
        form.reset({
          profilePictureUrl: '',
          fullName: '',
          fatherName: '',
          className: '',
          mobileNumber: '',
          admissionDate: new Date(),
          monthlyFee: defaultMonthlyFee,
          studentNotes: '',
        });
        setImagePreview(null);
      }
    }
  }, [isOpen, editingStudent, form, defaultMonthlyFee]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      form.setValue('profilePictureUrl', URL.createObjectURL(file)); 
    } else {
      setSelectedFile(null);
      const currentEditingPic = editingStudent?.profilePictureUrl;
      const currentFormValue = form.getValues('profilePictureUrl');
      setImagePreview(currentEditingPic || (currentFormValue && !currentFormValue.startsWith('blob:') ? currentFormValue : null) );
    }
  };

  const onSubmit = async (data: StudentFormValues) => {
    setIsSaving(true);
    const dataToSave = editingStudent
      ? {
          ...data,
          id: editingStudent.id,
          userId: editingStudent.userId!, 
          sortOrder: editingStudent.sortOrder!,
          profilePictureUrl: selectedFile ? undefined : data.profilePictureUrl 
        }
      : data;
    await onSaveStudent(dataToSave, selectedFile || undefined);
    setIsSaving(false);
    // onClose(); // Controlled by parent after save
  };
  
  const currentProfilePicUrlForDisplay = imagePreview || form.watch('profilePictureUrl');


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isSaving) onClose(); }}>
      <DialogContent className="w-[95vw] sm:w-full max-w-md sm:max-w-[525px] max-h-[80vh] flex flex-col overflow-hidden p-0 rounded-lg sm:rounded-lg bg-card backdrop-blur-md border-border">
        <DialogHeader className="text-center items-center space-y-1 pt-6 pb-4 px-6 shrink-0">
          <UserPlus className="h-10 w-10 text-primary" />
          <DialogTitle className="font-headline text-2xl">{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {editingStudent ? "Update the student's details below." : "Fill in the details below to add a new student record."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar"> 
          <div className="px-6 py-4"> 
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex flex-col items-center space-y-2">
                  <div
                    className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center overflow-hidden bg-secondary hover:border-primary transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();}}
                  >
                    {currentProfilePicUrlForDisplay ? (
                      <Image
                        src={currentProfilePicUrlForDisplay}
                        alt="Profile preview"
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                        data-ai-hint="student portrait placeholder"
                        onError={() => setImagePreview(`https://placehold.co/100x100.png?text=${editingStudent?.fullName?.charAt(0) || 'S'}&font=montserrat`)}
                        unoptimized={currentProfilePicUrlForDisplay.includes('supabase.co') || currentProfilePicUrlForDisplay.includes('blob:')}
                      />
                    ) : (
                      <UploadCloud className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">Profile Picture (Optional)</span>
                  <Input
                    type="file"
                    accept="image/png, image/jpeg, image/gif, image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                    disabled={isSaving}
                  />
                   <FormField
                    control={form.control}
                    name="profilePictureUrl"
                    render={() => (
                      <FormItem className="h-0 m-0 p-0">
                        <FormMessage className="text-center"/>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Rohan Sharma" {...field} className="bg-input border-border text-foreground placeholder:text-muted-foreground" disabled={isSaving}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fatherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father's Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Anil Sharma" {...field} className="bg-input border-border text-foreground placeholder:text-muted-foreground" disabled={isSaving}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="className"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={isSaving}>
                          <FormControl>
                            <SelectTrigger className="bg-input border-border text-foreground">
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover text-popover-foreground backdrop-blur-md">
                            {classOptions.map(option => (
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
                    name="monthlyFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Fee (INR)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g. 1200"
                            {...field}
                            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="mobileNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="e.g. 9876543210" {...field} className="bg-input border-border text-foreground placeholder:text-muted-foreground" disabled={isSaving}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="admissionDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Admission Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal bg-input border-border text-foreground hover:bg-accent hover:text-accent-foreground",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isSaving}
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
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01") || isSaving
                            }
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
                  name="studentNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Any relevant notes about the student..." {...field} className="bg-input border-border text-foreground placeholder:text-muted-foreground" disabled={isSaving}/>
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
          <Button type="button" variant="outline" onClick={onClose} className="border-border text-foreground hover:bg-accent hover:text-accent-foreground" disabled={isSaving}>Cancel</Button>
          <Button type="submit" form={form.formState.id} onClick={form.handleSubmit(onSubmit)} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? (editingStudent ? 'Saving...' : 'Adding...') : (editingStudent ? "Save Changes" : "Add Student")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
    
    

    



