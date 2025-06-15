
"use client";

import * as React from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  // getPaginationRowModel, // Removed for single-page table
  getSortedRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import type { StudentRowData } from "@/types";
import { getColumns, DragHandleCell } from "./student-table-columns";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates, // Added import
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useAuth } from '@/context/auth-context';

interface StudentTableProps {
  data: StudentRowData[];
  onAddPayment: (student: StudentRowData) => void;
  onEditStudent: (student: StudentRowData) => void;
  onDeleteStudent: (student: StudentRowData) => void;
  onViewDetails: (student: StudentRowData) => void;
  onDragEnd: (event: DragEndEvent) => void;
  setStudents: React.Dispatch<React.SetStateAction<StudentRowData[]>>;
}

const SortableRow: React.FC<{ row: Row<StudentRowData>; children: React.ReactNode }> = ({ row, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.original.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative',
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-state={row.getIsSelected() && "selected"}
      className="border-b border-table-border hover:bg-table-row-hover data-[state=selected]:bg-accent/30 last:border-b-0"
    >
      {children}
    </TableRow>
  );
};


export function StudentTable({ data, onAddPayment, onEditStudent, onDeleteStudent, onViewDetails, onDragEnd, setStudents }: StudentTableProps) {
  const { user } = useAuth();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [isInitialVisibilityLoaded, setIsInitialVisibilityLoaded] = React.useState(false);

  const defaultColumnVisibility: VisibilityState = {
    dragHandle: true,
    fatherName: true,
    mobileNumber: true,
    studentNotes: false,
    className: true,
    admissionDate: true,
    profilePictureUrl: true,
    fullName: true,
    monthlyFee: true,
    totalDueAmount: true,
    status: true, // "status" is the id for the fee status column
    actions: true,
  };

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(defaultColumnVisibility);

  const getColumnVisibilityKey = React.useCallback(() => {
    return user ? `feeTrackerColumnVisibility_${user.uid}` : null;
  }, [user]);

  React.useEffect(() => {
    const key = getColumnVisibilityKey();
    if (key) {
      const storedVisibility = localStorage.getItem(key);
      if (storedVisibility) {
        try {
          const parsedVisibility = JSON.parse(storedVisibility);
          // Merge with defaults to ensure all columns are present
          setColumnVisibility(prev => ({ ...defaultColumnVisibility, ...parsedVisibility }));
        } catch (error) {
          console.error("Error parsing column visibility from localStorage", error);
          setColumnVisibility(defaultColumnVisibility); // Fallback to default
        }
      } else {
         setColumnVisibility(defaultColumnVisibility); // No stored, use default
      }
    }
    setIsInitialVisibilityLoaded(true);
  }, [getColumnVisibilityKey, user]);


  const handleColumnVisibilityChange = (updater: React.SetStateAction<VisibilityState>) => {
    setColumnVisibility(old => {
      const newState = typeof updater === 'function' ? updater(old) : updater;
      const key = getColumnVisibilityKey();
      if (key) {
        localStorage.setItem(key, JSON.stringify(newState));
      }
      return newState;
    });
  };


  const columns = React.useMemo(() => getColumns(onAddPayment, onEditStudent, onDeleteStudent, onViewDetails), [onAddPayment, onEditStudent, onDeleteStudent, onViewDetails]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    // getPaginationRowModel: getPaginationRowModel(), // Removed for single-page table
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: handleColumnVisibilityChange, // Use custom handler
    getRowId: (row) => row.id,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    // Removed pagination initial state
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const studentIds = React.useMemo(() => data.map(s => s.id), [data]);

  if (!isInitialVisibilityLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading table settings...</p>
      </div>
    );
  }

  return (
    <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
      <SortableContext items={studentIds} strategy={verticalListSortingStrategy}>
        <div className="w-full">
          <div className="flex items-center justify-between py-4 px-6">
            <Input
              placeholder="Filter by name..."
              value={(table.getColumn("fullName")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("fullName")?.setFilterValue(event.target.value)
              }
              className="max-w-xs h-9 bg-input border-border focus:ring-primary text-sm placeholder:text-muted-foreground"
            />
            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-9 bg-input hover:bg-accent hover:text-accent-foreground text-sm border-border">
                            <SlidersHorizontal className="mr-2 h-4 w-4" /> Columns
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover text-popover-foreground shadow-lg w-48 backdrop-blur-md">
                        <DropdownMenuLabel className="text-xs px-2 py-1.5">Toggle Columns</DropdownMenuLabel>
                        <DropdownMenuSeparator/>
                        {table
                        .getAllColumns()
                        .filter((column) => column.getCanHide())
                        .map((column) => {
                            let columnLabel = column.id.replace(/([A-Z])/g, ' $1').trim();
                            if (column.id === "status") columnLabel = "Status"; // was dueMonthsCount
                            if (column.id === "profilePictureUrl") columnLabel = "Pic";
                            if (column.id === "fullName") columnLabel = "Student Name";
                            if (column.id === "fatherName") columnLabel = "Father's Name";
                            if (column.id === "mobileNumber") columnLabel = "Mobile No.";
                            if (column.id === "admissionDate") columnLabel = "Joined";
                            if (column.id === "monthlyFee") columnLabel = "Monthly Fee";
                            if (column.id === "totalDueAmount") columnLabel = "Due Amount";
                            if (column.id === "studentNotes") columnLabel = "Notes";


                            return (
                            <DropdownMenuCheckboxItem
                                key={column.id}
                                className="capitalize cursor-pointer focus:bg-accent text-xs py-1.5"
                                checked={column.getIsVisible()}
                                onCheckedChange={(value) =>
                                column.toggleVisibility(!!value)
                                }
                            >
                                {columnLabel}
                            </DropdownMenuCheckboxItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <Table className="min-w-full">
              <TableHeader className="bg-[#1e2133]">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-b-0 border-table-border">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} className="text-xs text-table-header-foreground uppercase tracking-wider px-4 py-3 h-auto whitespace-nowrap">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <SortableRow key={row.id} row={row}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3 px-4 text-sm text-foreground whitespace-nowrap"
                          style={cell.column.id === 'dragHandle' ? { cursor: 'grab' } : {}}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </SortableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between space-x-2 py-3 px-6 border-t border-table-border">
            <div className="flex-1 text-xs text-muted-foreground">
              Displaying {table.getRowModel().rows.length} student(s).
            </div>
            {/* Pagination controls removed for single-page table */}
          </div>
        </div>
      </SortableContext>
    </DndContext>
  );
}
