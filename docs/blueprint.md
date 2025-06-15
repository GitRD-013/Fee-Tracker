# **App Name**: Fee Tracker

## Core Features:

- Student Records Table: Display student records in a sortable, paginated table.
- Add New Student Form: A popup form to add new students to the records with fields for profile picture, full name, father's name, class, mobile number, admission date, and notes.
- Add Payment Form: Form popup to record a payment, capturing date, payment method, the month for which the fee is paid, and notes.
- Automatic Months Calculation: Automatically calculate total months since admission based on the admission date.
- Automatic Due Months Calculation: Determine the months for which no payment has been recorded and indicate these as 'Due Months'.
- Automatic Due Amount Calculation: Calculate the total amount due based on 'Due Months' multiplied by a customizable monthly fee.
- AI-Powered Note Categorization: AI tool that assists in categorizing student payment notes. LLM will decide if it can add a relevant category such as 'late payment' or 'partial payment' from the note field.

## Style Guidelines:

- Primary color: Moderate cyan (#3B82F6) to promote clarity and focus on fee data.
- Background color: Light cyan (#CFECFE), desaturated, for a clean dashboard appearance.
- Accent color: Sea green (#F5F5F5) for 'Add Payment' and other action buttons.
- Font pairing: 'Space Grotesk' (sans-serif) for headers and 'Inter' (sans-serif) for body text.
- Code Font: 'Source Code Pro' to display fee calculation or related formula.
- Simple, flat design icons for navigation and actions. Icons should use the accent color (#3b82f6).
- Clean, grid-based layout to ensure data is easily scannable.