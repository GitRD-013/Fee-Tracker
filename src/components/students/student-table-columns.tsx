
"use client";

import React, { useState, useEffect } from 'react';
import type { ColumnDef } from "@tanstack/react-table";
import type { StudentRowData } from "@/types"; // Ensure StudentRowData includes feeStatusLabel and feeStatusType
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal, CreditCard, Edit3, Trash2, Eye, UserCircle2, GripVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import Image from "next/image";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ProfilePictureCell: React.FC<{ imageUrl: string | undefined; studentName: string }> = ({ imageUrl: initialImageUrl, studentName }) => {
  const placeholderBase = `https://placehold.co/40x40.png?font=montserrat&text=`;
  const initials = studentName ? studentName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'S';
  const fallbackSrc = `${placeholderBase}${initials}`;

  const [currentSrc, setCurrentSrc] = useState(initialImageUrl || fallbackSrc);

  useEffect(() => {
    const newDisplaySrc = initialImageUrl || fallbackSrc;
    if (newDisplaySrc !== currentSrc) {
      setCurrentSrc(newDisplaySrc);
    }
  }, [initialImageUrl, fallbackSrc, currentSrc]);


  const handleError = () => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  };
  
  const unoptimized = currentSrc.includes('supabase.co') || currentSrc.includes('drive.google.com');

  return (
    <Avatar className="h-8 w-8">
      <AvatarImage asChild>
        <Image
          src={currentSrc}
          alt={studentName}
          width={32}
          height={32}
          className="object-cover rounded-full"
          onError={handleError}
          unoptimized={unoptimized}
        />
      </AvatarImage>
      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export const DragHandleCell: React.FC<{ rowId: string }> = ({ rowId }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: rowId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center justify-center">
      <GripVertical className="h-5 w-5 text-muted-foreground" />
    </div>
  );
};


export const getColumns = (
  onAddPaymentClick: (student: StudentRowData) => void,
  onEditStudentClick: (student: StudentRowData) => void,
  onDeleteStudentClick: (student: StudentRowData) => void,
  onViewDetailsClick: (student: StudentRowData) => void
): ColumnDef<StudentRowData>[] => [
  {
    id: 'dragHandle',
    header: () => null,
    cell: ({ row }) => <DragHandleCell rowId={row.original.id} />,
    size: 40,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "profilePictureUrl",
    header: () => (
      <div className="w-8 h-8 flex items-center justify-center"> 
        <UserCircle2 className="h-5 w-5 text-table-header-foreground" />
      </div>
    ),
    cell: ({ row }) => {
      const imageUrl = row.getValue("profilePictureUrl") as string | undefined;
      const studentName = row.original.fullName;
      return <ProfilePictureCell imageUrl={imageUrl} studentName={studentName} />;
    },
    size: 60,
    enableHiding: true,
    enableSorting: false,
  },
  {
    accessorKey: "fullName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left p-0 hover:bg-transparent font-semibold text-table-header-foreground hover:text-foreground"
      >
        STUDENT NAME
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => (
      <div
        className="font-bold text-sm text-foreground cursor-pointer hover:text-primary"
        onClick={() => onViewDetailsClick(row.original)}
      >
        {row.getValue("fullName")}
      </div>
    ),
    minSize: 180,
  },
  {
    accessorKey: "fatherName",
    header: () => <div className="font-semibold text-table-header-foreground">FATHER'S NAME</div>,
    cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.getValue("fatherName")}</div>,
    minSize: 150,
  },
  {
    accessorKey: "mobileNumber",
    header: () => <div className="font-semibold text-table-header-foreground">MOBILE NO.</div>,
    cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.getValue("mobileNumber")}</div>,
    minSize: 120,
  },
  {
    accessorKey: "className",
    header: () => <div className="font-semibold text-table-header-foreground">CLASS</div>,
    cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.getValue("className")}</div>,
    minSize: 70,
  },
  {
    accessorKey: "admissionDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left p-0 hover:bg-transparent font-semibold text-table-header-foreground hover:text-foreground"
      >
        JOINED
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-sm text-muted-foreground">{formatDate(row.getValue("admissionDate"), "dd MMM yyyy")}</div>,
    minSize: 150,
  },
  {
    accessorKey: "monthlyFee",
    header: ({ column }) => (
       <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left p-0 hover:bg-transparent font-semibold text-table-header-foreground hover:text-foreground w-full justify-start"
      >
        MONTHLY FEE
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.original.monthlyFee.toString());
      return <div className="font-medium text-sm text-foreground text-left">{formatCurrency(amount)}</div>;
    },
    minSize: 120,
  },
  {
    accessorKey: "totalDueAmount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left p-0 hover:bg-transparent font-semibold text-table-header-foreground hover:text-foreground w-full justify-start"
      >
        DUE AMOUNT
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.original.totalDueAmount.toString());
      return <div className={`font-medium text-sm ${amount > 0 ? 'text-red-400' : 'text-foreground'} text-left`}>{formatCurrency(amount)}</div>;
    },
    minSize: 130,
  },
  {
    id: "status", // Changed from accessorKey "dueMonthsCount" to "status" for clarity
    header: () => <div className="font-semibold text-table-header-foreground">STATUS</div>,
    cell: ({ row }) => {
      const { feeStatusLabel, feeStatusType } = row.original;
      let badgeVariant: VariantProps<typeof Badge>["variant"] = "outline";
      
      if (feeStatusType === "success") badgeVariant = "statusSuccess";
      else if (feeStatusType === "warning") badgeVariant = "statusWarning";
      else if (feeStatusType === "destructive") badgeVariant = "statusDestructive";
      else if (feeStatusType === "info") badgeVariant = "outline"; // For "Not Due Yet" using a specific style
      else badgeVariant = "secondary"; // Fallback

      const customClasses: Record<typeof feeStatusType, string> = {
        success: "bg-badge-status-success-background text-badge-status-success-foreground",
        warning: "bg-badge-status-warning-background text-badge-status-warning-foreground",
        destructive: "bg-badge-status-destructive-background text-badge-status-destructive-foreground",
        info: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/30",
        default: "bg-secondary text-secondary-foreground"
      };

      return <Badge variant={badgeVariant} className={`text-xs px-2.5 py-1 leading-none ${customClasses[feeStatusType]}`}>{feeStatusLabel}</Badge>;
    },
    accessorFn: (row) => row.feeStatusLabel, // Sorting will be based on the label
    minSize: 150,
  },
  {
    id: "actions",
    header: () => <div className="font-semibold text-table-header-foreground text-center">ACTIONS</div>,
    cell: ({ row }) => {
      const student = row.original;
      return (
        <div className="text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-accent text-muted-foreground hover:text-accent-foreground">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover text-popover-foreground shadow-lg backdrop-blur-md border-border">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Actions</DropdownMenuLabel>
               <DropdownMenuItem onClick={() => onViewDetailsClick(student)} className="cursor-pointer hover:bg-accent text-xs">
                <Eye className="mr-2 h-3.5 w-3.5" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddPaymentClick(student)} className="cursor-pointer hover:bg-accent text-xs">
                <CreditCard className="mr-2 h-3.5 w-3.5" /> Add Payment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditStudentClick(student)} className="cursor-pointer hover:bg-accent text-xs">
                 <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit Student
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border"/>
              <DropdownMenuItem
                onClick={() => onDeleteStudentClick(student)}
                className="cursor-pointer text-xs text-destructive hover:!text-destructive-foreground hover:!bg-destructive/90"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Student
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    size: 80,
    enableHiding: false,
    enableSorting: false,
  },
  {
    accessorKey: "studentNotes",
    header: () => <div className="font-semibold text-table-header-foreground">NOTES</div>,
    cell: ({ row }) => <div className="text-sm text-muted-foreground truncate max-w-xs">{row.getValue("studentNotes")}</div>,
    enableHiding: true, // Keep it hideable by default
    minSize: 200,
  },
];

type VariantProps<Component extends (...args: any) => any> = Parameters<Component>[0] extends { variant: infer V } ? { variant?: V } : {};

